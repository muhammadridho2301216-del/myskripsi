import assert from 'node:assert/strict'
import test from 'node:test'
import { getAdapterForProtocol } from '../domain/ai/adapters'
import type { NormalizedAIRequest } from '../domain/ai/request'
import { validateThinkingRequest } from '../domain/ai/thinkingControls'
import { resolveCapabilitiesWithAudit } from '../domain/ai/capabilityResolution'
import { buildRoutingPlan, runWithFallback, RoutingExhaustedError } from '../domain/ai/router'
import { getCachedModels, setCachedModels, setCachedModelsIfNonEmpty, clearDiscoveryCache } from '../domain/ai/modelDiscoveryCache'

const baseRequest: NormalizedAIRequest = {
  model: 'test-model',
  system: 'You are a helpful assistant.',
  messages: [{ role: 'user', content: 'Halo' }],
  temperature: 0.3,
}

test('openai-compatible adapter: builds a valid chat/completions request', () => {
  const adapter = getAdapterForProtocol('openai')
  const spec = adapter.buildHttpRequest({ request: baseRequest, apiKey: 'sk-test', baseUrl: 'https://api.openai.com/v1' })
  assert.equal(spec.url, 'https://api.openai.com/v1/chat/completions')
  assert.equal(spec.headers.Authorization, 'Bearer sk-test')
  const body = JSON.parse(spec.body!)
  assert.equal(body.model, 'test-model')
  assert.deepEqual(body.messages[0], { role: 'system', content: 'You are a helpful assistant.' })
  assert.deepEqual(body.messages[1], { role: 'user', content: 'Halo' })
})

test('openai-compatible adapter: parses a successful response, including tool calls and usage', () => {
  const adapter = getAdapterForProtocol('openai')
  const response = adapter.parseHttpResponse({
    choices: [{ message: { content: 'Jawaban.', tool_calls: [{ id: 'call_1', function: { name: 'search', arguments: '{"q":"x"}' } }] }, finish_reason: 'tool_calls' }],
    usage: { prompt_tokens: 10, completion_tokens: 5, completion_tokens_details: { reasoning_tokens: 2 } },
  })
  assert.equal(response.text, 'Jawaban.')
  assert.deepEqual(response.toolCalls, [{ id: 'call_1', name: 'search', arguments: { q: 'x' } }])
  assert.deepEqual(response.usage, { inputTokens: 10, outputTokens: 5, reasoningTokens: 2 })
  assert.equal(response.rawFinishReason, 'tool_calls')
})

test('openai-compatible adapter: classifies errors into normalized categories', () => {
  const adapter = getAdapterForProtocol('openai')
  assert.equal(adapter.parseHttpError(401, { error: { message: 'bad key' } }).category, 'auth')
  assert.equal(adapter.parseHttpError(429, {}).category, 'rate-limit')
  assert.equal(adapter.parseHttpError(404, {}).category, 'model-not-found')
  assert.equal(adapter.parseHttpError(400, {}).category, 'invalid-request')
  assert.equal(adapter.parseHttpError(503, {}).category, 'provider-unavailable')
  assert.equal(adapter.parseHttpError(418, {}).category, 'unknown')
})

test('anthropic adapter: builds a Messages API request with system as a top-level field', () => {
  const adapter = getAdapterForProtocol('anthropic')
  const spec = adapter.buildHttpRequest({ request: baseRequest, apiKey: 'sk-ant-test', baseUrl: 'https://api.anthropic.com/v1' })
  assert.equal(spec.url, 'https://api.anthropic.com/v1/messages')
  assert.equal(spec.headers['x-api-key'], 'sk-ant-test')
  const body = JSON.parse(spec.body!)
  assert.equal(body.system, 'You are a helpful assistant.')
  assert.deepEqual(body.messages, [{ role: 'user', content: 'Halo' }])
})

test('anthropic adapter: maps thinking budget into the request body', () => {
  const adapter = getAdapterForProtocol('anthropic')
  const spec = adapter.buildHttpRequest({
    request: { ...baseRequest, thinking: { budgetTokens: 4096 } },
    apiKey: 'k',
    baseUrl: 'https://api.anthropic.com/v1',
  })
  const body = JSON.parse(spec.body!)
  assert.deepEqual(body.thinking, { type: 'enabled', budget_tokens: 4096 })
})

test('anthropic adapter: parses content blocks and classifies overloaded_error as provider-unavailable', () => {
  const adapter = getAdapterForProtocol('anthropic')
  const response = adapter.parseHttpResponse({
    content: [{ type: 'text', text: 'Halo kembali.' }, { type: 'tool_use', id: 't1', name: 'search', input: { q: 'y' } }],
    usage: { input_tokens: 3, output_tokens: 4 },
    stop_reason: 'tool_use',
  })
  assert.equal(response.text, 'Halo kembali.')
  assert.deepEqual(response.toolCalls, [{ id: 't1', name: 'search', arguments: { q: 'y' } }])
  assert.equal(adapter.parseHttpError(529, { error: { type: 'overloaded_error' } }).category, 'provider-unavailable')
})

test('google adapter: builds a generateContent request without a system role in contents', () => {
  const adapter = getAdapterForProtocol('google')
  const spec = adapter.buildHttpRequest({
    request: baseRequest,
    apiKey: 'AIza-test',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  })
  assert.ok(spec.url.endsWith('/models/test-model:generateContent'))
  assert.equal(spec.headers['x-goog-api-key'], 'AIza-test')
  const body = JSON.parse(spec.body!)
  assert.equal(body.contents.length, 1)
  assert.equal(body.contents[0].role, 'user')
  assert.equal(body.systemInstruction.parts[0].text, 'You are a helpful assistant.')
})

test('google adapter: uses Authorization bearer when no apiKey is provided (OAuth path)', () => {
  const adapter = getAdapterForProtocol('google')
  const spec = adapter.buildHttpRequest({ request: baseRequest, accessToken: 'oauth-token', baseUrl: 'https://generativelanguage.googleapis.com/v1beta' })
  assert.equal(spec.headers.Authorization, 'Bearer oauth-token')
  assert.equal('x-goog-api-key' in spec.headers, false)
})

test('google adapter: parses candidates into text/tool calls and classifies RESOURCE_EXHAUSTED as rate-limit', () => {
  const adapter = getAdapterForProtocol('google')
  const response = adapter.parseHttpResponse({
    candidates: [{ content: { parts: [{ text: 'Jawaban Gemini.' }, { functionCall: { name: 'search', args: { q: 'z' } } }] }, finishReason: 'STOP' }],
    usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 9, thoughtsTokenCount: 1 },
  })
  assert.equal(response.text, 'Jawaban Gemini.')
  assert.deepEqual(response.toolCalls, [{ id: 'call_0', name: 'search', arguments: { q: 'z' } }])
  assert.deepEqual(response.usage, { inputTokens: 7, outputTokens: 9, reasoningTokens: 1 })
  assert.equal(adapter.parseHttpError(429, { error: { status: 'RESOURCE_EXHAUSTED' } }).category, 'rate-limit')
})

test('thinking controls: unsupported mode always strips the request, fixed mode always enables', () => {
  assert.equal(validateThinkingRequest({ mode: 'unsupported' }, { enabled: true }), undefined)
  assert.deepEqual(validateThinkingRequest({ mode: 'fixed' }, { enabled: false }), { enabled: true })
})

test('thinking controls: toggle mode falls back to the capability default when unspecified', () => {
  const result = validateThinkingRequest({ mode: 'toggle', defaultEnabled: true }, {})
  assert.deepEqual(result, { enabled: true })
})

test('thinking controls: levels mode rejects an unknown level and falls back to default', () => {
  const capability = { mode: 'levels' as const, levels: ['low', 'medium', 'high'], defaultLevel: 'medium' }
  assert.deepEqual(validateThinkingRequest(capability, { level: 'ultra' }), { level: 'medium' })
  assert.deepEqual(validateThinkingRequest(capability, { level: 'high' }), { level: 'high' })
})

test('thinking controls: budget mode clamps requested tokens into [min, max]', () => {
  const capability = { mode: 'budget' as const, minTokens: 1024, maxTokens: 8192, defaultTokens: 4096 }
  assert.deepEqual(validateThinkingRequest(capability, { budgetTokens: 100 }), { budgetTokens: 1024 })
  assert.deepEqual(validateThinkingRequest(capability, { budgetTokens: 100_000 }), { budgetTokens: 8192 })
  assert.deepEqual(validateThinkingRequest(capability, {}), { budgetTokens: 4096 })
})

test('capability resolution: unknown model stays fully conservative with only the base audit entry', () => {
  const { capabilities, audit } = resolveCapabilitiesWithAudit({ modelId: 'totally-unknown-model' })
  assert.equal(capabilities.toolCalling, false)
  assert.deepEqual(capabilities.thinking, { mode: 'unsupported' })
  assert.deepEqual(audit.map(entry => entry.source), ['conservative'])
})

test('capability resolution: curated entry is applied and recorded in the audit trail', () => {
  const { capabilities, audit } = resolveCapabilitiesWithAudit({ modelId: 'deepseek-flash' })
  assert.equal(capabilities.toolCalling, true)
  assert.ok(audit.some(entry => entry.source === 'curated'))
})

test('capability resolution: admin override wins over curated and connection override, and both are audited', () => {
  const { capabilities, audit } = resolveCapabilitiesWithAudit({
    modelId: 'deepseek-flash',
    connectionOverride: { toolCalling: false },
    adminOverride: { toolCalling: true },
  })
  assert.equal(capabilities.toolCalling, true)
  const sources = audit.map(entry => entry.source)
  assert.ok(sources.includes('connection-override'))
  assert.ok(sources.includes('admin-override'))
})

test('router: buildRoutingPlan parses primary/fallback targets from logicalModels', () => {
  const plan = buildRoutingPlan('ruang-research')
  assert.equal(plan.attempts[0].provider, 'openai')
  assert.ok(plan.attempts.length >= 2)
})

test('router: runWithFallback stops at the first success and reports which attempt was used', async () => {
  const plan = buildRoutingPlan('ruang-fast')
  const { result, outcome } = await runWithFallback(plan, async (attempt) => {
    if (attempt.provider === plan.attempts[0].provider) return { ok: true, value: `ok:${attempt.target}` }
    return { ok: false, retryable: true }
  })
  assert.equal(result, `ok:${plan.attempts[0].target}`)
  assert.equal(outcome.usedFallback, false)
  assert.equal(outcome.attemptIndex, 0)
})

test('router: runWithFallback advances to the fallback only on retryable failures', async () => {
  const plan = buildRoutingPlan('ruang-fast')
  const { outcome } = await runWithFallback(plan, async (attempt) => {
    return attempt === plan.attempts[0] ? { ok: false, retryable: true } : { ok: true, value: 'ok' }
  })
  assert.equal(outcome.usedFallback, true)
  assert.equal(outcome.attemptIndex, 1)
})

test('router: runWithFallback throws immediately on a non-retryable error without trying the fallback', async () => {
  const plan = buildRoutingPlan('ruang-fast')
  let calls = 0
  await assert.rejects(
    () => runWithFallback(plan, async () => { calls += 1; return { ok: false, retryable: false } }),
    RoutingExhaustedError,
  )
  assert.equal(calls, 1)
})

test('model discovery cache: miss then hit, respects TTL, never caches empty results', () => {
  clearDiscoveryCache()
  assert.equal(getCachedModels('openai', 'fp1'), null)
  setCachedModels('openai', 'fp1', [{ id: 'm1', name: 'Model 1' }], 'endpoint')
  const hit = getCachedModels('openai', 'fp1')
  assert.equal(hit?.models.length, 1)
  assert.equal(getCachedModels('openai', 'fp1', -1), null, 'negative TTL should always miss')

  setCachedModelsIfNonEmpty('anthropic', 'fp2', [], 'native')
  assert.equal(getCachedModels('anthropic', 'fp2'), null, 'empty result must not be cached')
})

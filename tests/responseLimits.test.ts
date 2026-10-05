import assert from 'node:assert/strict'
import test from 'node:test'
import { readLimitedText, readLimitedJson, ResponseTooLargeError, DEFAULT_PROVIDER_RESPONSE_LIMIT_BYTES } from '../domain/ai/responseLimits'

function responseFromText(text: string): Response {
  return new Response(text)
}

test('readLimitedText returns the full body when under the limit', async () => {
  const text = await readLimitedText(responseFromText('hello world'), 1024)
  assert.equal(text, 'hello world')
})

test('readLimitedText throws ResponseTooLargeError once the limit is exceeded, without buffering past it', async () => {
  const big = 'x'.repeat(1_000_000)
  await assert.rejects(() => readLimitedText(responseFromText(big), 1024), ResponseTooLargeError)
})

test('readLimitedJson parses JSON that is within the limit', async () => {
  const result = await readLimitedJson<{ ok: boolean }>(responseFromText(JSON.stringify({ ok: true })), 1024)
  assert.deepEqual(result, { ok: true })
})

test('DEFAULT_PROVIDER_RESPONSE_LIMIT_BYTES is a sane finite positive number', () => {
  assert.ok(DEFAULT_PROVIDER_RESPONSE_LIMIT_BYTES > 0)
  assert.ok(Number.isFinite(DEFAULT_PROVIDER_RESPONSE_LIMIT_BYTES))
})

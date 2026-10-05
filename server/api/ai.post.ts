import { getGoogleOAuthAccess } from '../utils/googleOAuth'
import { getProvider, resolveCapabilities } from '../utils/ai/catalog'
import { assertSafePublicEndpoint, safeProviderFetch } from '../utils/network/safeEndpoint'

interface AIRequest {
  provider: string
  apiKey?: string
  model: string
  prompt: string
  system?: string
  baseUrl?: string
  temperature?: number
  thinking?: { enabled?: boolean; level?: string; budgetTokens?: number }
}

async function parseFailure(response: Response) {
  const text = (await response.text()).slice(0, 800)
  throw createError({
    statusCode: 502,
    statusMessage: `Provider menolak permintaan (${response.status}).`,
    data: { providerMessage: text },
  })
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const config = useRuntimeConfig(event)
  const body = await readBody<AIRequest>(event)
  const provider = getProvider(body?.provider)
  if (!provider || provider.status !== 'available') throw createError({ statusCode: 400, statusMessage: 'Provider belum tersedia.' })
  const googleOAuth = body?.provider === 'google' && !body?.apiKey?.trim() ? await getGoogleOAuthAccess(event) : null
  if (!body?.apiKey?.trim() && !googleOAuth) throw createError({ statusCode: 400, statusMessage: 'API key belum diisi atau akun Google belum terhubung.' })
  if (!body?.model?.trim()) throw createError({ statusCode: 400, statusMessage: 'Model belum diisi.' })
  if (!body?.prompt?.trim()) throw createError({ statusCode: 400, statusMessage: 'Pertanyaan masih kosong.' })
  if (body.prompt.length > 20_000) throw createError({ statusCode: 413, statusMessage: 'Pertanyaan terlalu panjang.' })

  const system = body.system?.trim() || 'Anda adalah asisten akademik. Bantu mahasiswa berpikir lebih tajam tanpa mengarang sumber, data, atau kutipan.'
  const temperature = Math.max(0, Math.min(1, Number(body.temperature ?? 0.35)))
  const signal = AbortSignal.timeout(70_000)
  const apiKey = body.apiKey?.trim() ?? ''
  const capabilities = resolveCapabilities(body.model.trim())

  if (provider.protocol === 'openai') {
    const requestedBase = body.baseUrl?.trim()
    if (requestedBase && !provider.customBaseUrl && requestedBase.replace(/\/$/, '') !== provider.defaultBaseUrl.replace(/\/$/, '')) {
      throw createError({ statusCode: 400, statusMessage: 'Provider ini tidak menerima custom base URL.' })
    }
    const base = await assertSafePublicEndpoint(requestedBase || provider.defaultBaseUrl)
    const endpoint = new URL(`${base.toString().replace(/\/$/, '')}/chat/completions`)
    const extra: Record<string, unknown> = {}
    if (capabilities.thinking.mode === 'toggle' && typeof body.thinking?.enabled === 'boolean') {
      extra.thinking = { type: body.thinking.enabled ? 'enabled' : 'disabled' }
    } else if (capabilities.thinking.mode === 'levels' && body.thinking?.level && capabilities.thinking.levels.includes(body.thinking.level)) {
      extra.reasoning_effort = body.thinking.level
    } else if (capabilities.thinking.mode === 'budget' && body.thinking?.budgetTokens) {
      extra.thinking = {
        type: 'enabled',
        budget_tokens: Math.max(capabilities.thinking.minTokens, Math.min(capabilities.thinking.maxTokens, body.thinking.budgetTokens)),
      }
    }
    const response = await safeProviderFetch(endpoint, {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: body.model.trim(),
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: body.prompt.trim() },
        ],
        temperature,
        ...extra,
      }),
    })
    if (!response.ok) await parseFailure(response)
    const data = await response.json() as any
    const text = data?.choices?.[0]?.message?.content
    if (!text) throw createError({ statusCode: 502, statusMessage: 'Provider tidak mengembalikan teks.' })
    return { text, provider: provider.id, model: body.model, usage: data.usage ?? null, capabilities }
  }

  if (provider.protocol === 'anthropic') {
    const response = await safeProviderFetch(new URL(`${provider.defaultBaseUrl}/messages`), {
      method: 'POST',
      signal,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: body.model.trim(),
        max_tokens: 1800,
        system,
        messages: [{ role: 'user', content: body.prompt.trim() }],
        temperature,
      }),
    })
    if (!response.ok) await parseFailure(response)
    const data = await response.json() as any
    const text = (data?.content ?? []).filter((part: any) => part.type === 'text').map((part: any) => part.text).join('\n')
    if (!text) throw createError({ statusCode: 502, statusMessage: 'Anthropic tidak mengembalikan blok teks.' })
    return { text, provider: provider.id, model: body.model, usage: data.usage ?? null, capabilities }
  }

  if (provider.protocol === 'google') {
    const model = body.model.trim().replace(/^models\//, '')
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`
    const response = await fetch(endpoint, {
      method: 'POST',
      signal,
      headers: {
        ...(apiKey
          ? { 'x-goog-api-key': apiKey }
          : { Authorization: `Bearer ${googleOAuth!.accessToken}` }),
        ...(config.googleOAuthProjectId ? { 'x-goog-user-project': config.googleOAuthProjectId } : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: body.prompt.trim() }] }],
        generationConfig: { temperature, maxOutputTokens: 1800 },
      }),
    })
    if (!response.ok) await parseFailure(response)
    const data = await response.json() as any
    const text = (data?.candidates?.[0]?.content?.parts ?? []).map((part: any) => part.text ?? '').join('\n')
    if (!text) throw createError({ statusCode: 502, statusMessage: 'Google tidak mengembalikan teks. Periksa safety feedback dan nama model.' })
    return { text, provider: provider.id, model, usage: data.usageMetadata ?? null, capabilities }
  }

  throw createError({ statusCode: 400, statusMessage: 'Provider tidak dikenali.' })
})
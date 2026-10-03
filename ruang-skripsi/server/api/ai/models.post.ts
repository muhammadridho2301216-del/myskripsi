import { getGoogleOAuthAccess } from '../../utils/googleOAuth'
import { getProvider, resolveCapabilities } from '../../utils/ai/catalog'
import { assertSafePublicEndpoint, safeProviderFetch } from '../../utils/network/safeEndpoint'

interface ModelRequest {
  provider: string
  apiKey?: string
  baseUrl?: string
  modelsPath?: string
}

async function failure(response: Response) {
  const message = (await response.text()).slice(0, 500)
  throw createError({ statusCode: 502, statusMessage: `Tidak dapat mengambil model (${response.status}).`, data: { providerMessage: message } })
}

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const body = await readBody<ModelRequest>(event)
  const provider = getProvider(body?.provider)
  if (!provider || provider.status !== 'available') throw createError({ statusCode: 400, statusMessage: 'Provider belum tersedia.' })
  const googleOAuth = body?.provider === 'google' && !body?.apiKey?.trim() ? await getGoogleOAuthAccess(event) : null
  if (!body?.apiKey?.trim() && !googleOAuth) throw createError({ statusCode: 400, statusMessage: 'Masukkan API key atau hubungkan akun Google terlebih dahulu.' })
  const signal = AbortSignal.timeout(30_000)
  const apiKey = body.apiKey?.trim() ?? ''

  if (provider.protocol === 'openai') {
    const requestedBase = body.baseUrl?.trim()
    if (requestedBase && !provider.customBaseUrl && requestedBase.replace(/\/$/, '') !== provider.defaultBaseUrl.replace(/\/$/, '')) {
      throw createError({ statusCode: 400, statusMessage: 'Provider ini tidak menerima custom base URL.' })
    }
    const base = await assertSafePublicEndpoint(requestedBase || provider.defaultBaseUrl)
    const path = body.modelsPath?.trim() || provider.modelsPath || '/models'
    if (!path.startsWith('/') || path.includes('://')) throw createError({ statusCode: 400, statusMessage: 'Models path tidak valid.' })
    const endpoint = new URL(`${base.toString().replace(/\/$/, '')}${path}`)
    const response = await safeProviderFetch(endpoint, { signal, headers: { Authorization: `Bearer ${apiKey}` } })
    if (!response.ok) await failure(response)
    const data = await response.json() as any
    const models = (data?.data ?? data?.models ?? [])
      .map((item: any) => ({ id: item.id || item.name, name: item.name || item.id }))
      .filter((item: any) => item.id)
      .map((item: any) => ({ ...item, capabilities: resolveCapabilities(item.id) }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
    return { provider: provider.id, strategy: 'endpoint', models }
  }

  if (provider.protocol === 'anthropic') {
    const response = await safeProviderFetch(new URL(`${provider.defaultBaseUrl}/models?limit=100`), {
      signal,
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    })
    if (!response.ok) await failure(response)
    const data = await response.json() as any
    const models = (data?.data ?? []).map((item: any) => ({
      id: item.id,
      name: item.display_name || item.id,
      capabilities: resolveCapabilities(item.id),
    }))
    return { provider: provider.id, strategy: 'native', models }
  }

  if (provider.protocol === 'google') {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', {
      signal,
      headers: apiKey
        ? { 'x-goog-api-key': apiKey }
        : {
            Authorization: `Bearer ${googleOAuth!.accessToken}`,
            ...(useRuntimeConfig(event).googleOAuthProjectId ? { 'x-goog-user-project': useRuntimeConfig(event).googleOAuthProjectId } : {}),
          },
    })
    if (!response.ok) await failure(response)
    const data = await response.json() as any
    const models = (data?.models ?? [])
      .filter((item: any) => (item.supportedGenerationMethods ?? []).includes('generateContent'))
      .map((item: any) => {
        const id = String(item.name).replace(/^models\//, '')
        return { id, name: item.displayName || item.name, capabilities: resolveCapabilities(id) }
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name))
    return { provider: provider.id, strategy: 'native', models }
  }

  throw createError({ statusCode: 400, statusMessage: 'Provider tidak dikenali.' })
})
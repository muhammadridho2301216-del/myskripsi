import dns from 'node:dns/promises'
import net from 'node:net'

const BLOCKED_HOST_SUFFIXES = ['.local', '.internal', '.localhost']

function isPrivateAddress(address: string) {
  const kind = net.isIP(address)
  if (kind === 4) {
    const [a, b] = address.split('.').map(Number)
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    )
  }
  if (kind === 6) {
    const value = address.toLowerCase()
    return (
      value === '::1' ||
      value === '::' ||
      value.startsWith('fc') ||
      value.startsWith('fd') ||
      value.startsWith('fe8') ||
      value.startsWith('fe9') ||
      value.startsWith('fea') ||
      value.startsWith('feb') ||
      value.startsWith('ff')
    )
  }
  return true
}

export async function assertSafePublicEndpoint(value: string) {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Endpoint bukan URL yang valid.' })
  }
  if (url.protocol !== 'https:') {
    throw createError({ statusCode: 400, statusMessage: 'Endpoint publik harus memakai HTTPS.' })
  }
  if (url.username || url.password) {
    throw createError({ statusCode: 400, statusMessage: 'Kredensial tidak boleh ditempatkan pada URL.' })
  }
  const host = url.hostname.toLowerCase()
  if (
    host === 'localhost' ||
    host === 'metadata.google.internal' ||
    BLOCKED_HOST_SUFFIXES.some(suffix => host.endsWith(suffix))
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Endpoint lokal atau internal tidak diizinkan.' })
  }

  const literal = net.isIP(host)
  const addresses = literal ? [{ address: host }] : await dns.lookup(host, { all: true }).catch(() => [])
  if (!addresses.length) {
    throw createError({ statusCode: 400, statusMessage: 'Hostname endpoint tidak dapat di-resolve.' })
  }
  if (addresses.some(item => isPrivateAddress(item.address))) {
    throw createError({ statusCode: 400, statusMessage: 'Endpoint mengarah ke jaringan privat atau terlarang.' })
  }
  return url
}

export async function safeProviderFetch(url: URL, init: RequestInit) {
  await assertSafePublicEndpoint(url.toString())
  return fetch(url, {
    ...init,
    redirect: 'error',
    signal: init.signal ?? AbortSignal.timeout(70_000),
  })
}
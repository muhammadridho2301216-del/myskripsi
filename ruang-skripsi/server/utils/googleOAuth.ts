import crypto from 'node:crypto'

interface GoogleTokens {
  access_token: string
  refresh_token?: string
  expires_at: number
  scope?: string
  token_type?: string
  email?: string
}

function keyFromSecret(secret: string) {
  if (!secret || secret.length < 32) throw createError({ statusCode: 503, statusMessage: 'NUXT_OAUTH_SESSION_SECRET minimal 32 karakter belum dikonfigurasi.' })
  return crypto.createHash('sha256').update(secret).digest()
}

export function sealGoogleTokens(tokens: GoogleTokens, secret: string) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', keyFromSecret(secret), iv)
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(tokens), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, encrypted].map(value => value.toString('base64url')).join('.')
}

export function openGoogleTokens(value: string, secret: string): GoogleTokens {
  try {
    const [iv, tag, encrypted] = value.split('.').map(part => Buffer.from(part, 'base64url'))
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyFromSecret(secret), iv)
    decipher.setAuthTag(tag)
    return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'))
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Sesi Google tidak valid. Hubungkan ulang akun.' })
  }
}

export async function getGoogleOAuthAccess(event: any) {
  const config = useRuntimeConfig(event)
  const sealed = getCookie(event, 'rs_google_oauth')
  if (!sealed) return null
  let tokens = openGoogleTokens(sealed, config.oauthSessionSecret)
  if (tokens.expires_at > Date.now() + 60_000) return { accessToken: tokens.access_token, email: tokens.email }
  if (!tokens.refresh_token) return null

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.googleOAuthClientId,
      client_secret: config.googleOAuthClientSecret,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  if (!response.ok) {
    deleteCookie(event, 'rs_google_oauth', { path: '/' })
    throw createError({ statusCode: 401, statusMessage: 'Sesi Google berakhir. Hubungkan ulang akun.' })
  }
  const refreshed = await response.json() as any
  tokens = {
    ...tokens,
    access_token: refreshed.access_token,
    expires_at: Date.now() + Number(refreshed.expires_in || 3600) * 1000,
    scope: refreshed.scope || tokens.scope,
  }
  setCookie(event, 'rs_google_oauth', sealGoogleTokens(tokens, config.oauthSessionSecret), {
    httpOnly: true, secure: getRequestURL(event).protocol === 'https:', sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  })
  return { accessToken: tokens.access_token, email: tokens.email }
}
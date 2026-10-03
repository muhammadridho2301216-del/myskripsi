import crypto from 'node:crypto'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  if (!config.googleOAuthClientId || !config.googleOAuthClientSecret || !config.oauthSessionSecret) {
    throw createError({ statusCode: 503, statusMessage: 'Google OAuth belum dikonfigurasi pada server.' })
  }
  const origin = config.public.siteUrl || getRequestURL(event).origin
  const redirectUri = `${origin.replace(/\/$/, '')}/api/oauth/google/callback`
  const state = crypto.randomBytes(24).toString('base64url')
  const verifier = crypto.randomBytes(48).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  const cookie = { httpOnly: true, secure: redirectUri.startsWith('https://'), sameSite: 'lax' as const, path: '/', maxAge: 600 }
  setCookie(event, 'rs_oauth_state', state, cookie)
  setCookie(event, 'rs_oauth_verifier', verifier, cookie)

  const authorize = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authorize.search = new URLSearchParams({
    client_id: config.googleOAuthClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/generative-language.retriever',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString()
  return sendRedirect(event, authorize.toString())
})
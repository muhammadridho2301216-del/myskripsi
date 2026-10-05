import { sealGoogleTokens } from '../../../utils/googleOAuth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const query = getQuery(event)
  const expectedState = getCookie(event, 'rs_oauth_state')
  const verifier = getCookie(event, 'rs_oauth_verifier')
  deleteCookie(event, 'rs_oauth_state', { path: '/' })
  deleteCookie(event, 'rs_oauth_verifier', { path: '/' })
  if (query.error) return sendRedirect(event, `/app?oauth=google-error&reason=${encodeURIComponent(String(query.error))}`)
  if (!query.code || !query.state || query.state !== expectedState || !verifier) {
    throw createError({ statusCode: 400, statusMessage: 'Callback OAuth tidak valid atau kedaluwarsa.' })
  }
  const origin = config.public.siteUrl || getRequestURL(event).origin
  const redirectUri = `${origin.replace(/\/$/, '')}/api/oauth/google/callback`
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.googleOAuthClientId,
      client_secret: config.googleOAuthClientSecret,
      code: String(query.code),
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  })
  if (!response.ok) throw createError({ statusCode: 502, statusMessage: 'Google menolak pertukaran authorization code.' })
  const token = await response.json() as any
  const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  })
  const user = userResponse.ok ? await userResponse.json() as any : {}
  const sealed = sealGoogleTokens({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expires_at: Date.now() + Number(token.expires_in || 3600) * 1000,
    scope: token.scope,
    token_type: token.token_type,
    email: user.email,
  }, config.oauthSessionSecret)
  setCookie(event, 'rs_google_oauth', sealed, {
    httpOnly: true, secure: redirectUri.startsWith('https://'), sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30,
  })
  return sendRedirect(event, '/app?oauth=google-connected')
})
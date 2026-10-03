import { getGoogleOAuthAccess } from '../../../utils/googleOAuth'

export default defineEventHandler(async (event) => {
  const session = await getGoogleOAuthAccess(event)
  if (session?.accessToken) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(session.accessToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }).catch(() => null)
  }
  deleteCookie(event, 'rs_google_oauth', { path: '/' })
  return { disconnected: true }
})
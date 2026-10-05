import { getGoogleOAuthAccess } from '../../../utils/googleOAuth'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const config = useRuntimeConfig(event)
  const configured = Boolean(config.googleOAuthClientId && config.googleOAuthClientSecret && config.oauthSessionSecret)
  if (!configured) return { configured: false, connected: false }
  const session = await getGoogleOAuthAccess(event)
  return { configured: true, connected: Boolean(session), email: session?.email || null }
})
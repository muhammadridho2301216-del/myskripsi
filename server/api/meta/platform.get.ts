export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const config = useRuntimeConfig(event)
  return {
    clerk: {
      configured: Boolean(config.public.clerkPublishableKey && config.clerkSecretKey),
    },
    appwrite: {
      configured: Boolean(config.public.appwriteEndpoint && config.public.appwriteProjectId && config.appwriteApiKey),
      endpoint: config.public.appwriteEndpoint,
    },
    sandbox: {
      configured: false,
      reason: 'Runner VPS, queue, dan signed-job bridge belum dikonfigurasi.',
    },
  }
})
import { configureAppwriteClient } from '../domain/repository/appwriteClient'

/**
 * Wires runtime config into the framework-agnostic Appwrite client module.
 * Client-only: the writing/revision/bimbingan Appwrite adapter is used from
 * browser-side Vue components (see domain/repository/index.ts), never from
 * server routes, so there is no server-side Appwrite session concern here.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  if (!config.public.appwriteProjectId) return
  configureAppwriteClient({
    endpoint: config.public.appwriteEndpoint,
    projectId: config.public.appwriteProjectId,
  })
})

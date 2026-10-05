import { Client, Databases, Storage, Users } from 'node-appwrite'

export function getAppwriteAdmin(event: any) {
  const config = useRuntimeConfig(event)
  if (!config.public.appwriteEndpoint || !config.public.appwriteProjectId || !config.appwriteApiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Appwrite server belum dikonfigurasi.' })
  }
  const client = new Client()
    .setEndpoint(config.public.appwriteEndpoint)
    .setProject(config.public.appwriteProjectId)
    .setKey(config.appwriteApiKey)
  return {
    client,
    databases: new Databases(client),
    storage: new Storage(client),
    users: new Users(client),
    databaseId: config.appwriteDatabaseId,
  }
}
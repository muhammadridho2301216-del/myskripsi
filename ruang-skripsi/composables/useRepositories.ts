import { createRepositories, type RepositoryBundle } from '../domain/repository'

/**
 * App-wide entry point for the repository layer. Currently always resolves
 * to the local adapter because Appwrite credentials are not available to
 * verify the Appwrite path end-to-end in this environment (see
 * domain/repository/appwrite.ts for what IS implemented but unverified).
 *
 * To switch the whole app over once Appwrite is configured and the
 * anonymous-session auth bridge has been manually verified, change this
 * one function to:
 *
 *   const config = useRuntimeConfig()
 *   return createRepositories({ backend: 'auto', databaseId: config.public.appwriteDatabaseId })
 *
 * Every component already calls `createRepositories()` directly today
 * (Batch 4/5); migrating them to call this composable instead is a
 * mechanical follow-up, not a redesign — tracked as a Batch 6 follow-up
 * rather than done here to avoid changing working, verified Batch 4/5 code
 * paths as a side effect of unverifiable Batch 6 work.
 */
export function useRepositories(): RepositoryBundle {
  return createRepositories({ backend: 'local' })
}

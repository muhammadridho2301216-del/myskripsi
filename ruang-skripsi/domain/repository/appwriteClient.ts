import { Account, Client, TablesDB } from 'appwrite'

/**
 * Lazily-created singleton browser client. This file is the seam between
 * "Appwrite is configured" and "Appwrite adapter can run" — if endpoint/
 * project id are missing, every call throws a clear error instead of
 * silently falling back to local storage (that fallback decision belongs to
 * whoever calls `createRepositories()`, not to this module).
 *
 * AUTH LIMITATION (read before relying on this in production): Clerk
 * identity (EPIC-19) is not wired yet, so there is no durable, cross-device
 * user identity to scope rows to. This module creates an Appwrite
 * ANONYMOUS session as a bridging mechanism — it persists only in the
 * browser's Appwrite session cookie and is lost if cookies are cleared or a
 * different browser/device is used. Once Clerk + the webhook-based profile
 * bootstrap described in EPIC-20 exists, replace `ensureSession()` with a
 * call that exchanges the Clerk session for the Appwrite custom-token flow,
 * and migrate any rows created under an anonymous ownerId.
 */

let client: Client | null = null
let account: Account | null = null
let tablesDB: TablesDB | null = null
let sessionPromise: Promise<string> | null = null
let configuredEndpoint = ''
let configuredProjectId = ''

export class AppwriteNotConfiguredError extends Error {
  constructor() {
    super('Appwrite belum dikonfigurasi (NUXT_PUBLIC_APPWRITE_ENDPOINT / NUXT_PUBLIC_APPWRITE_PROJECT_ID).')
    this.name = 'AppwriteNotConfiguredError'
  }
}

/**
 * Call once at app startup (e.g. a Nuxt plugin) with values read from
 * `useRuntimeConfig().public`. Kept as an explicit setter rather than
 * calling `useRuntimeConfig()` directly in here because this module lives
 * under `domain/`, which is outside Nuxt's auto-import scan dirs
 * (components/composables/utils) — it must not assume Nuxt auto-imports are
 * available, so it stays usable from plain Node scripts and unit tests too.
 */
export function configureAppwriteClient(options: { endpoint: string, projectId: string }): void {
  if (options.endpoint === configuredEndpoint && options.projectId === configuredProjectId) return
  configuredEndpoint = options.endpoint
  configuredProjectId = options.projectId
  client = null
  account = null
  tablesDB = null
  sessionPromise = null
}

function getClient(): Client {
  if (client) return client
  if (!configuredEndpoint || !configuredProjectId) throw new AppwriteNotConfiguredError()
  client = new Client().setEndpoint(configuredEndpoint).setProject(configuredProjectId)
  return client
}

export function getAccount(): Account {
  if (!account) account = new Account(getClient())
  return account
}

export function getTablesDB(): TablesDB {
  if (!tablesDB) tablesDB = new TablesDB(getClient())
  return tablesDB
}

/**
 * Ensures a session exists and returns the Appwrite Account $id to use as
 * `ownerId` on every row. Memoized per page load so repeated repository
 * calls do not race to create multiple anonymous sessions.
 */
export async function ensureOwnerId(): Promise<string> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const acc = getAccount()
      try {
        const identity = await acc.get()
        return identity.$id
      } catch {
        const session = await acc.createAnonymousSession()
        return session.userId
      }
    })().catch((error) => {
      sessionPromise = null
      throw error
    })
  }
  return sessionPromise
}

/** Test-only hook to reset module-level singletons between unit tests. */
export function __resetAppwriteClientForTests(): void {
  client = null
  account = null
  tablesDB = null
  sessionPromise = null
}

import { createAppwriteBimbinganRepository, createAppwriteRevisionRepository, createAppwriteWritingRepository } from './appwrite'
import { createLocalBimbinganRepository, createLocalRevisionRepository, createLocalWritingRepository } from './local'
import { DATABASE_NAME } from './appwriteSchema'
import type { RepositoryBundle } from './types'

export type { BimbinganRepository, RepositoryBundle, RevisionRepository, WritingRepository } from './types'

export interface CreateRepositoriesOptions {
  /**
   * 'local' (default) uses localStorage. 'appwrite' switches to the
   * Appwrite TablesDB adapter — see domain/repository/appwrite.ts for the
   * current limitations (anonymous-session auth, unverified against a real
   * project). When omitted, pass `backend: 'auto'` to pick 'appwrite'
   * only when `databaseId` is provided and non-empty.
   */
  backend?: 'local' | 'appwrite' | 'auto'
  /** Required when backend resolves to 'appwrite'. Typically runtimeConfig.appwriteDatabaseId. */
  databaseId?: string
}

/**
 * Single factory the app calls to get its data layer. Defaults to the local
 * adapter so existing call sites (`createRepositories()` with no arguments,
 * used throughout Batch 4/5 components) keep working unchanged. Pass
 * `{ backend: 'appwrite', databaseId }` once Appwrite is configured —
 * callers in pages/app.vue and the writing/revision/bimbingan components
 * never need to change beyond that call site.
 */
export function createRepositories(options: CreateRepositoriesOptions = {}): RepositoryBundle {
  const backend = options.backend === 'auto'
    ? (options.databaseId ? 'appwrite' : 'local')
    : (options.backend ?? 'local')

  if (backend === 'appwrite') {
    const databaseId = options.databaseId || DATABASE_NAME
    return {
      backend,
      writing: createAppwriteWritingRepository(databaseId),
      revisions: createAppwriteRevisionRepository(databaseId),
      bimbingan: createAppwriteBimbinganRepository(databaseId),
    }
  }
  return {
    backend: 'local',
    writing: createLocalWritingRepository(),
    revisions: createLocalRevisionRepository(),
    bimbingan: createLocalBimbinganRepository(),
  }
}

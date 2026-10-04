import { createAppwriteBimbinganRepository, createAppwriteRevisionRepository, createAppwriteWritingRepository } from './appwrite'
import { createLocalBimbinganRepository, createLocalRevisionRepository, createLocalWritingRepository } from './local'
import type { RepositoryBundle } from './types'

export type { BimbinganRepository, RepositoryBundle, RevisionRepository, WritingRepository } from './types'

/**
 * Single factory the app calls to get its data layer. `backend` defaults to
 * 'local' for the prototype. Once Appwrite credentials exist (Batch 6), pass
 * `'appwrite'` here — call sites in pages/app.vue and future features never
 * need to change.
 */
export function createRepositories(backend: 'local' | 'appwrite' = 'local'): RepositoryBundle {
  if (backend === 'appwrite') {
    return {
      backend,
      writing: createAppwriteWritingRepository(),
      revisions: createAppwriteRevisionRepository(),
      bimbingan: createAppwriteBimbinganRepository(),
    }
  }
  return {
    backend,
    writing: createLocalWritingRepository(),
    revisions: createLocalRevisionRepository(),
    bimbingan: createLocalBimbinganRepository(),
  }
}

import type { BimbinganRepository, RevisionRepository, WritingRepository } from './types'

/**
 * Placeholder for Batch 6 (Appwrite Persistence). Collections, schema, and
 * sync strategy are intentionally not designed yet — see TASKS.md EPIC-20.
 * This file exists now so `domain/repository/index.ts` has a real seam to
 * switch on, instead of the UI importing the local adapter directly.
 */

function notImplemented(method: string): never {
  throw new Error(`Appwrite ${method} belum diimplementasikan (Batch 6 — lihat docs/TASKS.md EPIC-20).`)
}

export function createAppwriteWritingRepository(): WritingRepository {
  return {
    getDocument: () => notImplemented('WritingRepository.getDocument'),
    saveDocument: () => notImplemented('WritingRepository.saveDocument'),
    listDocuments: () => notImplemented('WritingRepository.listDocuments'),
  }
}

export function createAppwriteRevisionRepository(): RevisionRepository {
  return {
    list: () => notImplemented('RevisionRepository.list'),
    save: () => notImplemented('RevisionRepository.save'),
    remove: () => notImplemented('RevisionRepository.remove'),
  }
}

export function createAppwriteBimbinganRepository(): BimbinganRepository {
  return {
    list: () => notImplemented('BimbinganRepository.list'),
    save: () => notImplemented('BimbinganRepository.save'),
    remove: () => notImplemented('BimbinganRepository.remove'),
  }
}

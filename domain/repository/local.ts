import type { BimbinganEntry } from '../bimbingan/model'
import type { Revision } from '../revision/model'
import type { DocumentState } from '../writing/store'
import type { BimbinganRepository, RevisionRepository, WritingRepository } from './types'

/**
 * localStorage-backed adapter for development/prototype use. Mirrors the
 * pattern already used elsewhere in the app (`ruang-outline-v2`,
 * `ruang-sources-v1`, `ruang-claims-v1`) so there is one obvious place to look
 * for "what gets persisted and under which key".
 */

function readJSON<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

const WRITING_KEY = 'ruang-writing-v1'
const REVISIONS_KEY = 'ruang-revisions-v1'
const BIMBINGAN_KEY = 'ruang-bimbingan-v1'

export function createLocalWritingRepository(): WritingRepository {
  return {
    async getDocument(nodeId) {
      const all = readJSON<Record<string, DocumentState>>(WRITING_KEY, {})
      return all[nodeId] ?? null
    },
    async saveDocument(state) {
      const all = readJSON<Record<string, DocumentState>>(WRITING_KEY, {})
      all[state.document.nodeId] = state
      writeJSON(WRITING_KEY, all)
    },
    async listDocuments() {
      const all = readJSON<Record<string, DocumentState>>(WRITING_KEY, {})
      return Object.values(all)
    },
  }
}

export function createLocalRevisionRepository(): RevisionRepository {
  return {
    async list() {
      return readJSON<Revision[]>(REVISIONS_KEY, [])
    },
    async save(revision) {
      const all = readJSON<Revision[]>(REVISIONS_KEY, [])
      const index = all.findIndex(item => item.id === revision.id)
      if (index === -1) all.push(revision)
      else all[index] = revision
      writeJSON(REVISIONS_KEY, all)
    },
    async remove(id) {
      const all = readJSON<Revision[]>(REVISIONS_KEY, [])
      writeJSON(REVISIONS_KEY, all.filter(item => item.id !== id))
    },
  }
}

export function createLocalBimbinganRepository(): BimbinganRepository {
  return {
    async list() {
      return readJSON<BimbinganEntry[]>(BIMBINGAN_KEY, [])
    },
    async save(entry) {
      const all = readJSON<BimbinganEntry[]>(BIMBINGAN_KEY, [])
      const index = all.findIndex(item => item.id === entry.id)
      if (index === -1) all.push(entry)
      else all[index] = entry
      writeJSON(BIMBINGAN_KEY, all)
    },
    async remove(id) {
      const all = readJSON<BimbinganEntry[]>(BIMBINGAN_KEY, [])
      writeJSON(BIMBINGAN_KEY, all.filter(item => item.id !== id))
    },
  }
}

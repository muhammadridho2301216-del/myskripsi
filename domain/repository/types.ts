import type { BimbinganEntry } from '../bimbingan/model'
import type { Revision } from '../revision/model'
import type { DocumentState } from '../writing/store'

/**
 * Repository Interface (PERENCANAAN.md §4 "Persistence Layer"). The UI layer
 * (pages/app.vue, future `features/writing`) talks only to these interfaces.
 * Today `createRepositories()` wires the Local adapter; Batch 6 swaps in the
 * Appwrite adapter without any caller needing to change.
 */

export interface WritingRepository {
  /** Returns the stored state for an outline node, or null if nothing was saved yet. */
  getDocument(nodeId: string): Promise<DocumentState | null>
  saveDocument(state: DocumentState): Promise<void>
  listDocuments(): Promise<DocumentState[]>
}

export interface RevisionRepository {
  list(): Promise<Revision[]>
  save(revision: Revision): Promise<void>
  remove(id: string): Promise<void>
}

export interface BimbinganRepository {
  list(): Promise<BimbinganEntry[]>
  save(entry: BimbinganEntry): Promise<void>
  remove(id: string): Promise<void>
}

export interface RepositoryBundle {
  writing: WritingRepository
  revisions: RevisionRepository
  bimbingan: BimbinganRepository
  /** 'local' during the prototype phase, 'appwrite' once Batch 6 lands. */
  backend: 'local' | 'appwrite'
}

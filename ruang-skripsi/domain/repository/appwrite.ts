import { ID, Permission, Query, Role } from 'appwrite'
import { ensureOwnerId, getTablesDB } from './appwriteClient'
import { TABLES } from './appwriteSchema'
import {
  bimbinganToRow,
  documentStateToRow,
  revisionToRow,
  rowToBimbingan,
  rowToDocumentState,
  rowToRevision,
  type BimbinganRow,
  type RevisionRow,
  type WritingDocumentRow,
} from './mapping'
import type { BimbinganRepository, RevisionRepository, WritingRepository } from './types'

/**
 * Appwrite TablesDB-backed adapter — Batch 6.
 *
 * HONESTY NOTE: this has been written against the documented node/browser
 * Appwrite SDK v29 API and is structurally consistent with
 * `appwriteSchema.ts` and `mapping.ts` (which ARE unit-tested), but it has
 * never been executed against a real Appwrite project. There is no Appwrite
 * instance available in this environment to verify against. Treat this as
 * "reviewed, not yet integration-tested" — run `scripts/setupAppwriteSchema.ts`
 * against a staging project, then exercise this adapter manually before any
 * production use. See domain/repository/appwriteClient.ts for the current
 * anonymous-session auth limitation (no durable identity until Clerk/EPIC-19
 * lands).
 *
 * All rows carry `ownerId` and are created with row-level permissions scoped
 * to that owner only — this is the "ownership filter on every read/write"
 * requirement from EPIC-20, enforced by Appwrite itself via row security,
 * not just by application-level query filters.
 */

function ownerPermissions(ownerId: string): string[] {
  const role = Role.user(ownerId)
  return [Permission.read(role), Permission.update(role), Permission.delete(role)]
}

export function createAppwriteWritingRepository(databaseId: string): WritingRepository {
  const tablesDB = getTablesDB()

  return {
    async getDocument(nodeId) {
      const ownerId = await ensureOwnerId()
      const result = await tablesDB.listRows<WritingDocumentRow>({
        databaseId,
        tableId: TABLES.writingDocuments,
        queries: [Query.equal('ownerId', ownerId), Query.equal('nodeId', nodeId), Query.limit(1)],
      })
      const row = result.rows[0]
      return row ? rowToDocumentState(row) : null
    },

    async saveDocument(state) {
      const ownerId = await ensureOwnerId()
      const existing = await tablesDB.listRows<WritingDocumentRow>({
        databaseId,
        tableId: TABLES.writingDocuments,
        queries: [Query.equal('ownerId', ownerId), Query.equal('nodeId', state.document.nodeId), Query.limit(1)],
      })
      const data = documentStateToRow(ownerId, state)
      if (existing.rows[0]) {
        await tablesDB.updateRow({ databaseId, tableId: TABLES.writingDocuments, rowId: existing.rows[0].$id, data })
      } else {
        // nodeId alone is not globally unique (every user has a "1.1"), so the
        // row id must still be Appwrite-generated; uniqueness per user is
        // enforced by the idx_owner_node unique index on (ownerId, nodeId).
        await tablesDB.createRow({
          databaseId,
          tableId: TABLES.writingDocuments,
          rowId: ID.unique(),
          data,
          permissions: ownerPermissions(ownerId),
        })
      }
    },

    async listDocuments() {
      const ownerId = await ensureOwnerId()
      const result = await tablesDB.listRows<WritingDocumentRow>({
        databaseId,
        tableId: TABLES.writingDocuments,
        queries: [Query.equal('ownerId', ownerId), Query.limit(500)],
      })
      return result.rows.map(rowToDocumentState)
    },
  }
}

export function createAppwriteRevisionRepository(databaseId: string): RevisionRepository {
  const tablesDB = getTablesDB()

  return {
    async list() {
      const ownerId = await ensureOwnerId()
      const result = await tablesDB.listRows<RevisionRow>({
        databaseId,
        tableId: TABLES.revisions,
        queries: [Query.equal('ownerId', ownerId), Query.limit(500)],
      })
      return result.rows.map(rowToRevision)
    },

    async save(revision) {
      const ownerId = await ensureOwnerId()
      const data = revisionToRow(ownerId, revision)
      const existing = await tablesDB.listRows<RevisionRow>({
        databaseId,
        tableId: TABLES.revisions,
        queries: [Query.equal('ownerId', ownerId), Query.equal('logicalId', revision.id), Query.limit(1)],
      })
      if (existing.rows[0]) {
        await tablesDB.updateRow({ databaseId, tableId: TABLES.revisions, rowId: existing.rows[0].$id, data })
      } else {
        await tablesDB.createRow({
          databaseId,
          tableId: TABLES.revisions,
          rowId: ID.unique(),
          data,
          permissions: ownerPermissions(ownerId),
        })
      }
    },

    async remove(id) {
      const ownerId = await ensureOwnerId()
      const existing = await tablesDB.listRows<RevisionRow>({
        databaseId,
        tableId: TABLES.revisions,
        queries: [Query.equal('ownerId', ownerId), Query.equal('logicalId', id), Query.limit(1)],
      })
      if (existing.rows[0]) await tablesDB.deleteRow({ databaseId, tableId: TABLES.revisions, rowId: existing.rows[0].$id })
    },
  }
}

export function createAppwriteBimbinganRepository(databaseId: string): BimbinganRepository {
  const tablesDB = getTablesDB()

  return {
    async list() {
      const ownerId = await ensureOwnerId()
      const result = await tablesDB.listRows<BimbinganRow>({
        databaseId,
        tableId: TABLES.bimbinganEntries,
        queries: [Query.equal('ownerId', ownerId), Query.orderDesc('meetingDate'), Query.limit(500)],
      })
      return result.rows.map(rowToBimbingan)
    },

    async save(entry) {
      const ownerId = await ensureOwnerId()
      const data = bimbinganToRow(ownerId, entry)
      const existing = await tablesDB.listRows<BimbinganRow>({
        databaseId,
        tableId: TABLES.bimbinganEntries,
        queries: [Query.equal('ownerId', ownerId), Query.equal('logicalId', entry.id), Query.limit(1)],
      })
      if (existing.rows[0]) {
        await tablesDB.updateRow({ databaseId, tableId: TABLES.bimbinganEntries, rowId: existing.rows[0].$id, data })
      } else {
        await tablesDB.createRow({
          databaseId,
          tableId: TABLES.bimbinganEntries,
          rowId: ID.unique(),
          data,
          permissions: ownerPermissions(ownerId),
        })
      }
    },

    async remove(id) {
      const ownerId = await ensureOwnerId()
      const existing = await tablesDB.listRows<BimbinganRow>({
        databaseId,
        tableId: TABLES.bimbinganEntries,
        queries: [Query.equal('ownerId', ownerId), Query.equal('logicalId', id), Query.limit(1)],
      })
      if (existing.rows[0]) await tablesDB.deleteRow({ databaseId, tableId: TABLES.bimbinganEntries, rowId: existing.rows[0].$id })
    },
  }
}

/**
 * Appwrite TablesDB schema for Batch 6 persistence.
 *
 * IMPORTANT — honesty note: this schema has been written against the
 * node-appwrite v29 TablesDB API surface (the modern replacement for the
 * deprecated Databases/Documents API) and is internally consistent with the
 * adapters in `appwrite.ts`, but it has NEVER been run against a real
 * Appwrite project — there are no Appwrite credentials available in this
 * environment. Treat `ensureSchema()` as a reviewed-but-unverified setup
 * script: run it once against a real staging project and watch for errors
 * before trusting it in production.
 *
 * Design choices:
 * - One table per aggregate (writing documents, version snapshots, change
 *   ledger entries, revisions, bimbingan entries) rather than one giant
 *   table, so row-level permissions and indexes stay simple.
 * - Every row carries `ownerId` (the Appwrite Account $id). Row security is
 *   enabled on every table and `ensureSchema` grants permissions scoped to
 *   `Role.user(ownerId)` per row at write time (see appwrite.ts) — there is
 *   no cross-user read path, by design (see PRD §4 "Secure by default").
 * - JSON-shaped fields (version history, status history, ledger entries)
 *   are stored as `string` columns holding JSON, not as native Appwrite
 *   relationships. This keeps the local and Appwrite adapters structurally
 *   identical (same DocumentState/Revision/BimbinganEntry shape in and out)
 *   and avoids relationship-attribute complexity for a prototype-stage
 *   schema. Revisit if row-level querying into snapshot/ledger history is
 *   ever needed — right now the UI always loads a whole aggregate at once.
 */

export const DATABASE_NAME = 'ruang_skripsi'

export const TABLES = {
  writingDocuments: 'writing_documents',
  revisions: 'revisions',
  bimbinganEntries: 'bimbingan_entries',
} as const

/**
 * Column definitions, intentionally expressed as plain data (not SDK calls)
 * so they can be unit-tested for internal consistency (unique keys, no
 * column over Appwrite's 128-char limits, etc.) without an Appwrite client.
 */
export interface ColumnDef {
  key: string
  type: 'string' | 'boolean' | 'integer' | 'datetime' | 'enum'
  size?: number
  required: boolean
  array?: boolean
  elements?: string[]
}

export interface IndexDef {
  key: string
  type: 'key' | 'unique' | 'fulltext'
  columns: string[]
}

export interface TableSchema {
  tableId: string
  name: string
  rowSecurity: true
  columns: ColumnDef[]
  indexes: IndexDef[]
}

const col = (key: string, type: ColumnDef['type'], required: boolean, extra: Partial<ColumnDef> = {}): ColumnDef => ({
  key, type, required, ...extra,
})

/**
 * `writing_documents` stores one row per WritingDocument, with its
 * VersionSnapshot[] and ChangeLedgerEntry[] serialized as JSON columns.
 * `nodeId` + `ownerId` together are the natural key (one document per
 * outline node per user); `ownerId` alone backs the "list my documents"
 * query used by `listDocuments()`.
 */
export const writingDocumentsTable: TableSchema = {
  tableId: TABLES.writingDocuments,
  name: 'Writing Documents',
  rowSecurity: true,
  columns: [
    col('ownerId', 'string', true, { size: 64 }),
    // nodeId doubles as the natural key for this table; it comes from the
    // outline engine (e.g. "1.1") and is short/stable enough to also be
    // used directly as the row's $id, unlike the UUID-based ids below.
    col('nodeId', 'string', true, { size: 64 }),
    col('content', 'string', true, { size: 200_000 }),
    col('notes', 'string', false, { size: 20_000 }),
    col('wordCount', 'integer', true),
    col('rev', 'integer', true),
    col('status', 'enum', true, { elements: ['not-started', 'drafting', 'review', 'complete'] }),
    col('versionsJson', 'string', true, { size: 1_000_000 }),
    col('ledgerJson', 'string', true, { size: 1_000_000 }),
    col('createdAt', 'datetime', true),
    col('updatedAt', 'datetime', true),
  ],
  indexes: [
    { key: 'idx_owner', type: 'key', columns: ['ownerId'] },
    { key: 'idx_owner_node', type: 'unique', columns: ['ownerId', 'nodeId'] },
  ],
}

/**
 * `revisions` mirrors domain/revision/model.ts#Revision almost 1:1.
 * `statusHistoryJson` is JSON because its shape (array of {from, to, at,
 * note}) has no simple flat column representation.
 */
export const revisionsTable: TableSchema = {
  tableId: TABLES.revisions,
  name: 'Revisions',
  rowSecurity: true,
  columns: [
    col('ownerId', 'string', true, { size: 64 }),
    // The domain layer generates ids like "rev_<uuid>" (createRevision,
    // newId()) BEFORE any repository is involved, and that id is reused
    // elsewhere (BimbinganEntry.generatedRevisionIds, revision-count
    // lookups by outline node). That id can exceed Appwrite's 36-char
    // custom-$id limit, so it is stored here as a plain column
    // ("logicalId") and the row's own $id is Appwrite-generated
    // (ID.unique()) instead. rowToRevision maps row.logicalId -> Revision.id.
    col('logicalId', 'string', true, { size: 64 }),
    col('author', 'string', true, { size: 200 }),
    col('sourceType', 'enum', true, { elements: ['pembimbing-1', 'pembimbing-2', 'penguji', 'mandiri'] }),
    col('meetingId', 'string', false, { size: 64 }),
    col('outlineNodeId', 'string', false, { size: 64 }),
    col('outlineNodeTitle', 'string', false, { size: 200 }),
    col('priority', 'enum', true, { elements: ['low', 'medium', 'high', 'blocking'] }),
    col('deadline', 'datetime', false),
    col('status', 'enum', true, { elements: ['baru', 'dipahami', 'dikerjakan', 'perlu-konfirmasi', 'selesai'] }),
    col('requestText', 'string', true, { size: 10_000 }),
    col('textBefore', 'string', false, { size: 10_000 }),
    col('textAfter', 'string', false, { size: 10_000 }),
    col('evidenceVersionIdsJson', 'string', true, { size: 5_000 }),
    col('confirmationNote', 'string', false, { size: 5_000 }),
    col('statusHistoryJson', 'string', true, { size: 50_000 }),
    col('createdAt', 'datetime', true),
    col('updatedAt', 'datetime', true),
  ],
  indexes: [
    { key: 'idx_owner', type: 'key', columns: ['ownerId'] },
    { key: 'idx_owner_logical', type: 'unique', columns: ['ownerId', 'logicalId'] },
    { key: 'idx_owner_status', type: 'key', columns: ['ownerId', 'status'] },
    { key: 'idx_owner_node', type: 'key', columns: ['ownerId', 'outlineNodeId'] },
  ],
}

/**
 * `bimbingan_entries` mirrors domain/bimbingan/model.ts#BimbinganEntry.
 * Arrays (decisions, generatedRevisionIds, nextMeetingTargets, attachments)
 * are JSON for the same reason as above.
 */
export const bimbinganEntriesTable: TableSchema = {
  tableId: TABLES.bimbinganEntries,
  name: 'Bimbingan Entries',
  rowSecurity: true,
  columns: [
    col('ownerId', 'string', true, { size: 64 }),
    // See the comment on revisionsTable.logicalId — same reasoning.
    col('logicalId', 'string', true, { size: 64 }),
    col('meetingDate', 'datetime', true),
    col('supervisor', 'string', true, { size: 200 }),
    col('agenda', 'string', true, { size: 5_000 }),
    col('decisionsJson', 'string', true, { size: 20_000 }),
    col('generatedRevisionIdsJson', 'string', true, { size: 5_000 }),
    col('nextMeetingTargetsJson', 'string', true, { size: 20_000 }),
    col('attachmentsJson', 'string', true, { size: 20_000 }),
    col('createdAt', 'datetime', true),
    col('updatedAt', 'datetime', true),
  ],
  indexes: [
    { key: 'idx_owner', type: 'key', columns: ['ownerId'] },
    { key: 'idx_owner_logical', type: 'unique', columns: ['ownerId', 'logicalId'] },
    { key: 'idx_owner_date', type: 'key', columns: ['ownerId', 'meetingDate'] },
  ],
}

export const allTables: TableSchema[] = [writingDocumentsTable, revisionsTable, bimbinganEntriesTable]

/** Appwrite column key limit; used by the self-check test, not enforced at runtime. */
const MAX_COLUMN_SIZE = 1_000_000

export function validateSchema(tables: TableSchema[] = allTables): string[] {
  const errors: string[] = []
  const seenTableIds = new Set<string>()
  for (const table of tables) {
    if (seenTableIds.has(table.tableId)) errors.push(`Duplicate tableId: ${table.tableId}`)
    seenTableIds.add(table.tableId)

    const seenColumns = new Set<string>()
    for (const column of table.columns) {
      if (seenColumns.has(column.key)) errors.push(`${table.tableId}: duplicate column key "${column.key}"`)
      seenColumns.add(column.key)
      if (column.type === 'string' && (!column.size || column.size <= 0)) {
        errors.push(`${table.tableId}.${column.key}: string column requires a positive size`)
      }
      if (column.type === 'string' && column.size && column.size > MAX_COLUMN_SIZE) {
        errors.push(`${table.tableId}.${column.key}: size ${column.size} exceeds assumed max ${MAX_COLUMN_SIZE}`)
      }
      if (column.type === 'enum' && (!column.elements || column.elements.length === 0)) {
        errors.push(`${table.tableId}.${column.key}: enum column requires elements`)
      }
    }
    for (const index of table.indexes) {
      for (const columnKey of index.columns) {
        if (!seenColumns.has(columnKey) && columnKey !== '$id') {
          errors.push(`${table.tableId}: index "${index.key}" references unknown column "${columnKey}"`)
        }
      }
    }
  }
  return errors
}

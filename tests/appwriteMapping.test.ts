import assert from 'node:assert/strict'
import test from 'node:test'
import {
  allTables,
  validateSchema,
  writingDocumentsTable,
  revisionsTable,
  bimbinganEntriesTable,
} from '../domain/repository/appwriteSchema'
import {
  bimbinganToRow,
  documentStateToRow,
  revisionToRow,
  rowToBimbingan,
  rowToDocumentState,
  rowToRevision,
} from '../domain/repository/mapping'
import { createDocument, applyEdit, commitAutosave, type DocumentState } from '../domain/writing/store'
import { createRevision, transitionRevision } from '../domain/revision/store'
import { createBimbinganEntry, linkRevisionToMeeting, toggleTarget } from '../domain/bimbingan/model'

/**
 * These tests verify the ONE part of Batch 6 that does not require a live
 * Appwrite project: that converting a domain object to a row and back is
 * lossless, and that the declared schema is internally consistent. They do
 * NOT prove the adapter in appwrite.ts works against a real Appwrite
 * instance — no credentials are available in this environment to test that.
 */

/**
 * JSON.stringify drops keys whose value is `undefined` (e.g. { label:
 * undefined } becomes {}), which is exactly what happens to versionsJson/
 * ledgerJson/statusHistoryJson when they pass through Appwrite's string
 * columns. That's a real, expected property of this persistence layer, not
 * a bug — so round-trip assertions compare the JSON-normalized shape
 * instead of the pre-serialization object.
 */
function jsonNormalized<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

function fakeRowMeta(tableId: string) {
  return {
    $id: 'row_fake_id',
    $sequence: '1',
    $tableId: tableId,
    $databaseId: 'ruang_skripsi',
    $createdAt: '2026-01-01T00:00:00.000Z',
    $updatedAt: '2026-01-01T00:00:00.000Z',
    $permissions: [],
  }
}

test('appwriteSchema: all declared tables pass self-validation', () => {
  assert.deepEqual(validateSchema(allTables), [])
})

test('appwriteSchema: catches a duplicate column key', () => {
  const broken = {
    ...writingDocumentsTable,
    columns: [...writingDocumentsTable.columns, { key: 'ownerId', type: 'string' as const, required: true, size: 64 }],
  }
  const errors = validateSchema([broken])
  assert.ok(errors.some(error => error.includes('duplicate column key "ownerId"')))
})

test('appwriteSchema: catches an index referencing an unknown column', () => {
  const broken = {
    ...revisionsTable,
    indexes: [...revisionsTable.indexes, { key: 'bad_index', type: 'key' as const, columns: ['doesNotExist'] }],
  }
  const errors = validateSchema([broken])
  assert.ok(errors.some(error => error.includes('unknown column "doesNotExist"')))
})

test('appwriteSchema: every string column that is not an enum/int/bool declares a size', () => {
  for (const table of allTables) {
    for (const column of table.columns.filter(item => item.type === 'string')) {
      assert.ok(column.size && column.size > 0, `${table.tableId}.${column.key} must declare a positive size`)
    }
  }
})

test('appwriteSchema: logicalId indexes exist for revisions and bimbingan (needed by appwrite.ts save/remove)', () => {
  assert.ok(revisionsTable.indexes.some(index => index.columns.includes('logicalId')))
  assert.ok(bimbinganEntriesTable.indexes.some(index => index.columns.includes('logicalId')))
})

test('mapping: WritingDocument state round-trips through documentStateToRow/rowToDocumentState losslessly', () => {
  let state: DocumentState = { document: createDocument('1.1'), versions: [], ledger: [] }
  state = { ...state, document: applyEdit(state.document, 'Isi naskah percobaan.') }
  state = commitAutosave(state)

  const fields = documentStateToRow('owner-1', state)
  const row = { ...fields, ...fakeRowMeta(writingDocumentsTable.tableId) }
  const restored = rowToDocumentState(row)

  assert.equal(restored.document.nodeId, state.document.nodeId)
  assert.equal(restored.document.content, state.document.content)
  assert.equal(restored.document.wordCount, state.document.wordCount)
  assert.equal(restored.document.rev, state.document.rev)
  assert.equal(restored.document.status, state.document.status)
  assert.deepEqual(restored.versions, jsonNormalized(state.versions))
  assert.deepEqual(restored.ledger, jsonNormalized(state.ledger))
})

test('mapping: rowToDocumentState tolerates corrupted JSON columns instead of throwing', () => {
  const fields = documentStateToRow('owner-1', { document: createDocument('1.2'), versions: [], ledger: [] })
  const row = { ...fields, versionsJson: '{not valid json', ledgerJson: 'null', ...fakeRowMeta(writingDocumentsTable.tableId) }
  const restored = rowToDocumentState(row)
  assert.deepEqual(restored.versions, [])
  assert.deepEqual(restored.ledger, [])
})

test('mapping: Revision round-trips through revisionToRow/rowToRevision, including status history', () => {
  const understood = transitionRevision(createRevision({ author: 'Bu Diana', sourceType: 'pembimbing-1', requestText: 'Perjelas X.' }), 'dipahami')
  const fields = revisionToRow('owner-1', understood)
  const row = { ...fields, ...fakeRowMeta(revisionsTable.tableId) }
  const restored = rowToRevision(row)

  // id comes from logicalId (the domain-generated id), NOT the Appwrite row $id.
  assert.equal(restored.id, understood.id)
  assert.notEqual(restored.id, row.$id)
  assert.equal(restored.status, 'dipahami')
  assert.deepEqual(restored.statusHistory, jsonNormalized(understood.statusHistory))
})

test('mapping: BimbinganEntry round-trips, including nested target checklist', () => {
  let entry = createBimbinganEntry({ meetingDate: '2026-09-20', supervisor: 'Bu Diana', agenda: 'Review Bab 1', nextMeetingTargets: ['Selesaikan Bab 1'] })
  entry = linkRevisionToMeeting(entry, 'rev_abc')
  entry = toggleTarget(entry, entry.nextMeetingTargets[0].id)

  const fields = bimbinganToRow('owner-1', entry)
  const row = { ...fields, ...fakeRowMeta(bimbinganEntriesTable.tableId) }
  const restored = rowToBimbingan(row)

  assert.equal(restored.id, entry.id)
  assert.notEqual(restored.id, row.$id)
  assert.deepEqual(restored.generatedRevisionIds, ['rev_abc'])
  assert.equal(restored.nextMeetingTargets[0].done, true)
})

test('mapping: ownerId is always attached and never read back into the domain object (it is a persistence-only field)', () => {
  const fields = documentStateToRow('owner-xyz', { document: createDocument('1.3'), versions: [], ledger: [] })
  assert.equal(fields.ownerId, 'owner-xyz')
  const restored = rowToDocumentState({ ...fields, ...fakeRowMeta(writingDocumentsTable.tableId) })
  assert.ok(!('ownerId' in restored.document))
})

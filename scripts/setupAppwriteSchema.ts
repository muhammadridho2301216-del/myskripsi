/**
 * One-time setup script: creates the database and all tables/columns/
 * indexes described in domain/repository/appwriteSchema.ts.
 *
 * NOT RUN AS PART OF ANY TEST OR BUILD. This script talks to a real
 * Appwrite project and has never been executed — there is no Appwrite
 * instance available in this development environment. Review it carefully
 * before running against your own project; prefer running it once against
 * a staging project first.
 *
 * Usage:
 *   NUXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1 \
 *   NUXT_PUBLIC_APPWRITE_PROJECT_ID=... \
 *   NUXT_APPWRITE_API_KEY=... \
 *   npx tsx scripts/setupAppwriteSchema.ts
 */
import { Client, TablesDB } from 'node-appwrite'
import { allTables, DATABASE_NAME, validateSchema, type ColumnDef, type TableSchema } from '../domain/repository/appwriteSchema'

async function main() {
  const endpoint = process.env.NUXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
  const projectId = process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID
  const apiKey = process.env.NUXT_APPWRITE_API_KEY
  const databaseId = process.env.NUXT_APPWRITE_DATABASE_ID || DATABASE_NAME

  if (!projectId || !apiKey) {
    console.error('NUXT_PUBLIC_APPWRITE_PROJECT_ID and NUXT_APPWRITE_API_KEY are required.')
    process.exitCode = 1
    return
  }

  const schemaErrors = validateSchema(allTables)
  if (schemaErrors.length) {
    console.error('Schema failed self-check, aborting before touching Appwrite:')
    schemaErrors.forEach(error => console.error(` - ${error}`))
    process.exitCode = 1
    return
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
  const tablesDB = new TablesDB(client)

  console.log(`Ensuring database "${databaseId}" exists...`)
  await tablesDB.create({ databaseId, name: DATABASE_NAME, enabled: true }).catch(swallowAlreadyExists)

  for (const table of allTables) {
    console.log(`Ensuring table "${table.tableId}"...`)
    await tablesDB.createTable({
      databaseId,
      tableId: table.tableId,
      name: table.name,
      rowSecurity: table.rowSecurity,
      enabled: true,
    }).catch(swallowAlreadyExists)

    for (const column of table.columns) {
      console.log(`  column ${column.key} (${column.type})`)
      await createColumn(tablesDB, databaseId, table.tableId, column).catch(swallowAlreadyExists)
    }

    for (const index of table.indexes) {
      console.log(`  index ${index.key}`)
      await tablesDB.createIndex({
        databaseId,
        tableId: table.tableId,
        key: index.key,
        type: index.type as any,
        columns: index.columns,
      }).catch(swallowAlreadyExists)
    }
  }

  console.log('Done. Review the Appwrite console to confirm attribute/index status is "available" before relying on this schema.')
}

async function createColumn(tablesDB: TablesDB, databaseId: string, tableId: string, column: ColumnDef) {
  const base = { databaseId, tableId, key: column.key, required: column.required, array: column.array ?? false }
  switch (column.type) {
    case 'string':
      return tablesDB.createStringColumn({ ...base, size: column.size ?? 255 })
    case 'boolean':
      return tablesDB.createBooleanColumn(base)
    case 'integer':
      return tablesDB.createIntegerColumn(base)
    case 'datetime':
      return tablesDB.createDatetimeColumn(base)
    case 'enum':
      return tablesDB.createEnumColumn({ ...base, elements: column.elements ?? [] })
    default:
      throw new Error(`Unsupported column type: ${column.type}`)
  }
}

function swallowAlreadyExists(error: any) {
  if (error?.code === 409 || /already exists/i.test(error?.message ?? '')) return
  throw error
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

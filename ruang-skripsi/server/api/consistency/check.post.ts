import { evaluateConsistency, type ConsistencyInput } from '../../utils/consistency/engine'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const body = await readBody<ConsistencyInput>(event)
  if (!Array.isArray(body?.outlineNodes) || !Array.isArray(body?.claims)) {
    throw createError({ statusCode: 400, statusMessage: 'Payload consistency check tidak valid.' })
  }
  if (JSON.stringify(body).length > 1_000_000) throw createError({ statusCode: 413, statusMessage: 'Konteks pemeriksaan terlalu besar.' })
  return evaluateConsistency(body)
})
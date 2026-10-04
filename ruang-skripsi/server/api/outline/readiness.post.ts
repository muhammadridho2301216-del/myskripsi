import { evaluateOutlineReadiness, type ReadinessInput } from '../../utils/outline/engine'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const body = await readBody<ReadinessInput>(event)
  if (!Array.isArray(body?.nodes)) throw createError({ statusCode: 400, statusMessage: 'Struktur outline tidak valid.' })
  if (JSON.stringify(body).length > 500_000) throw createError({ statusCode: 413, statusMessage: 'Outline terlalu besar.' })
  return evaluateOutlineReadiness(body)
})
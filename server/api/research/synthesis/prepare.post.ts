import { prepareSynthesisPacket, type MatrixSource, type ResearchClaim } from '../../../utils/research/evidence'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const body = await readBody<{ sources: MatrixSource[]; claims: ResearchClaim[] }>(event)
  if (!Array.isArray(body?.sources) || !Array.isArray(body?.claims)) {
    throw createError({ statusCode: 400, statusMessage: 'Sumber atau klaim tidak valid.' })
  }
  if (body.sources.length > 100 || body.claims.length > 250) {
    throw createError({ statusCode: 413, statusMessage: 'Paket sintesis melebihi batas.' })
  }
  return prepareSynthesisPacket(body.sources, body.claims)
})
import { evaluateClaimLedger, type ResearchClaim } from '../../../utils/research/evidence'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const body = await readBody<{ claims: ResearchClaim[] }>(event)
  if (!Array.isArray(body?.claims)) throw createError({ statusCode: 400, statusMessage: 'Claim ledger tidak valid.' })
  if (body.claims.length > 250) throw createError({ statusCode: 413, statusMessage: 'Jumlah klaim melebihi batas.' })
  return evaluateClaimLedger(body.claims)
})
export type EvidenceLevel = 'metadata' | 'snippet' | 'abstract' | 'full-text' | 'user-file'
export type EvidenceStance = 'supports' | 'contradicts' | 'context'
export type ClaimSupportStatus = 'unsupported' | 'weak' | 'supported' | 'conflicting'

export interface ClaimEvidenceLink {
  sourceId: string
  sourceTitle: string
  evidenceLevel: EvidenceLevel
  stance: EvidenceStance
  verified: boolean
  excerpt?: string
}

export interface ResearchClaim {
  id: string
  text: string
  outlineNodeId?: string
  evidence: ClaimEvidenceLink[]
}

const strongLevels = new Set<EvidenceLevel>(['abstract', 'full-text', 'user-file'])

export function evaluateClaimSupport(claim: ResearchClaim) {
  const verified = claim.evidence.filter(link => link.verified)
  const supports = verified.filter(link => link.stance === 'supports')
  const contradicts = verified.filter(link => link.stance === 'contradicts')
  const strongSupports = supports.filter(link => strongLevels.has(link.evidenceLevel))
  const strongContradictions = contradicts.filter(link => strongLevels.has(link.evidenceLevel))

  let status: ClaimSupportStatus = 'unsupported'
  if (supports.length && contradicts.length) status = 'conflicting'
  else if (strongSupports.length >= 2) status = 'supported'
  else if (supports.length) status = 'weak'

  return {
    claimId: claim.id,
    status,
    counts: {
      verified: verified.length,
      supports: supports.length,
      contradicts: contradicts.length,
      strongSupports: strongSupports.length,
      strongContradictions: strongContradictions.length,
    },
    warnings: [
      ...(claim.text.trim() ? [] : ['claim-text-empty']),
      ...(verified.length ? [] : ['no-verified-evidence']),
      ...(supports.some(link => link.evidenceLevel === 'metadata') ? ['metadata-cannot-prove-claim'] : []),
      ...(supports.some(link => link.evidenceLevel === 'snippet') ? ['snippet-is-weak-evidence'] : []),
      ...(status === 'conflicting' ? ['conflicting-evidence-must-be-discussed'] : []),
    ],
  }
}

export function evaluateClaimLedger(claims: ResearchClaim[]) {
  const results = claims.map(evaluateClaimSupport)
  const countByStatus = results.reduce<Record<ClaimSupportStatus, number>>((acc, result) => {
    acc[result.status] += 1
    return acc
  }, { unsupported: 0, weak: 0, supported: 0, conflicting: 0 })
  const weighted = results.reduce((sum, result) => {
    if (result.status === 'supported') return sum + 1
    if (result.status === 'weak' || result.status === 'conflicting') return sum + 0.5
    return sum
  }, 0)
  return {
    score: results.length ? Math.round((weighted / results.length) * 100) : 0,
    countByStatus,
    results,
  }
}

export interface MatrixSource {
  id: string
  title: string
  url?: string
  evidenceLevel: EvidenceLevel
  verified: boolean
  objective?: string
  method?: string
  finding?: string
  limitation?: string
}

export function prepareSynthesisPacket(sources: MatrixSource[], claims: ResearchClaim[]) {
  const verifiedSources = sources.filter(source => source.verified)
  const ledger = evaluateClaimLedger(claims)
  const traceableClaims = claims.filter((claim, index) => ledger.results[index]?.status !== 'unsupported')
  const warnings = [
    ...(verifiedSources.length < 3 ? ['minimum-three-verified-sources-required'] : []),
    ...(verifiedSources.some(source => source.evidenceLevel === 'metadata') ? ['metadata-only-sources-present'] : []),
    ...(ledger.countByStatus.unsupported ? [`${ledger.countByStatus.unsupported}-unsupported-claims-excluded`] : []),
    ...(ledger.countByStatus.conflicting ? [`${ledger.countByStatus.conflicting}-conflicting-claims-must-remain-visible`] : []),
  ]
  return {
    canSynthesize: verifiedSources.length >= 3 && traceableClaims.length > 0,
    sources: verifiedSources.map(source => ({
      ...source,
      objective: source.objective?.trim() || null,
      method: source.method?.trim() || null,
      finding: source.finding?.trim() || null,
      limitation: source.limitation?.trim() || null,
    })),
    claims: traceableClaims,
    excludedClaimIds: claims.filter(claim => !traceableClaims.some(item => item.id === claim.id)).map(claim => claim.id),
    warnings,
    instruction: 'Synthesis must distinguish source facts, conflicts, unknown fields, and AI interpretation. Never invent missing values.',
  }
}
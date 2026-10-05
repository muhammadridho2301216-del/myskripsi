import type { OutlineNode } from '../outline/engine'
import { flattenOutline } from '../outline/engine'
import type { ResearchClaim } from '../research/evidence'
import { evaluateClaimLedger } from '../research/evidence'

export interface ConsistencyInput {
  title?: string
  problemStatements: Array<{ id: string; text: string }>
  objectives: Array<{ id: string; text: string; problemId?: string }>
  methodology?: string
  outlineNodes: OutlineNode[]
  claims: ResearchClaim[]
  conclusions?: Array<{ text: string; objectiveId?: string; claimIds?: string[] }>
}

export interface ConsistencyCheck {
  id: string
  category: 'structure' | 'alignment' | 'evidence' | 'conclusion'
  passed: boolean
  severity: 'critical' | 'warning'
  message: string
  relatedIds: string[]
}

function normalized(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

export function evaluateConsistency(input: ConsistencyInput) {
  const allNodes = flattenOutline(input.outlineNodes)
  const normalizedTitles = allNodes.map(item => normalized(item.title))
  const duplicateTitles = normalizedTitles.filter((title, index) => title && normalizedTitles.indexOf(title) !== index)
  const unlinkedObjectives = input.objectives.filter(objective => !objective.problemId || !input.problemStatements.some(problem => problem.id === objective.problemId))
  const unlinkedConclusions = (input.conclusions ?? []).filter(conclusion => !conclusion.objectiveId || !input.objectives.some(objective => objective.id === conclusion.objectiveId))
  const unknownClaimIds = new Set(
    (input.conclusions ?? []).flatMap(conclusion => conclusion.claimIds ?? []).filter(id => !input.claims.some(claim => claim.id === id)),
  )
  const ledger = evaluateClaimLedger(input.claims)

  const checks: ConsistencyCheck[] = [
    {
      id: 'research-title',
      category: 'structure',
      passed: Boolean(input.title?.trim()),
      severity: 'critical',
      message: input.title?.trim() ? 'Judul penelitian tersedia.' : 'Judul penelitian belum tersedia.',
      relatedIds: [],
    },
    {
      id: 'problem-objective-count',
      category: 'alignment',
      passed: input.problemStatements.length > 0 && input.problemStatements.length === input.objectives.length,
      severity: 'critical',
      message: input.problemStatements.length === input.objectives.length && input.problemStatements.length
        ? 'Jumlah rumusan masalah dan tujuan selaras.'
        : 'Jumlah rumusan masalah dan tujuan tidak selaras.',
      relatedIds: [...input.problemStatements.map(item => item.id), ...input.objectives.map(item => item.id)],
    },
    {
      id: 'objective-links',
      category: 'alignment',
      passed: unlinkedObjectives.length === 0 && input.objectives.length > 0,
      severity: 'critical',
      message: unlinkedObjectives.length ? `${unlinkedObjectives.length} tujuan belum dipetakan ke rumusan masalah.` : 'Setiap tujuan dipetakan ke rumusan masalah.',
      relatedIds: unlinkedObjectives.map(item => item.id),
    },
    {
      id: 'methodology',
      category: 'alignment',
      passed: Boolean(input.methodology?.trim()),
      severity: 'critical',
      message: input.methodology?.trim() ? 'Metodologi telah ditetapkan.' : 'Metodologi belum ditetapkan.',
      relatedIds: [],
    },
    {
      id: 'duplicate-sections',
      category: 'structure',
      passed: duplicateTitles.length === 0,
      severity: 'warning',
      message: duplicateTitles.length ? `Ditemukan ${new Set(duplicateTitles).size} judul bagian duplikat.` : 'Tidak ada judul bagian duplikat.',
      relatedIds: allNodes.filter(item => duplicateTitles.includes(normalized(item.title))).map(item => item.id),
    },
    {
      id: 'claim-support',
      category: 'evidence',
      passed: ledger.countByStatus.unsupported === 0 && input.claims.length > 0,
      severity: 'warning',
      message: input.claims.length
        ? `${ledger.countByStatus.unsupported} klaim belum memiliki dukungan terverifikasi.`
        : 'Belum ada klaim yang dicatat.',
      relatedIds: ledger.results.filter(item => item.status === 'unsupported').map(item => item.claimId),
    },
    {
      id: 'conflicting-evidence',
      category: 'evidence',
      passed: ledger.countByStatus.conflicting === 0,
      severity: 'warning',
      message: ledger.countByStatus.conflicting
        ? `${ledger.countByStatus.conflicting} klaim memiliki bukti yang saling bertentangan dan wajib dibahas.`
        : 'Tidak ada konflik bukti yang tercatat.',
      relatedIds: ledger.results.filter(item => item.status === 'conflicting').map(item => item.claimId),
    },
    {
      id: 'conclusion-links',
      category: 'conclusion',
      passed: Boolean(input.conclusions?.length) && unlinkedConclusions.length === 0,
      severity: 'warning',
      message: !input.conclusions?.length
        ? 'Kesimpulan belum tersedia.'
        : unlinkedConclusions.length
          ? `${unlinkedConclusions.length} kesimpulan belum dipetakan ke tujuan.`
          : 'Kesimpulan dipetakan ke tujuan.',
      relatedIds: unlinkedConclusions.map((_, index) => `conclusion-${index}`),
    },
    {
      id: 'conclusion-claims',
      category: 'conclusion',
      passed: unknownClaimIds.size === 0,
      severity: 'warning',
      message: unknownClaimIds.size ? `${unknownClaimIds.size} referensi klaim pada kesimpulan tidak dikenal.` : 'Referensi klaim pada kesimpulan valid.',
      relatedIds: [...unknownClaimIds],
    },
  ]

  const weight = { critical: 2, warning: 1 }
  const total = checks.reduce((sum, item) => sum + weight[item.severity], 0)
  const earned = checks.reduce((sum, item) => sum + (item.passed ? weight[item.severity] : 0), 0)
  return {
    score: Math.round((earned / total) * 100),
    criticalPassed: checks.filter(item => item.severity === 'critical').every(item => item.passed),
    checks,
    claimLedger: ledger,
  }
}
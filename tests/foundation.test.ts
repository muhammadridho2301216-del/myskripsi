import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canAccessProtectedWorkspace,
  initialAdmissionStatus,
  matchCampusDomain,
  normalizeEmailDomain,
} from '../server/utils/admission/policy'
import { getProvider, resolveCapabilities } from '../server/utils/ai/catalog'
import { estimateModelCost } from '../server/utils/ai/pricing'
import { evaluateOffer, verifiedStudentTrial } from '../server/utils/offers/engine'
import { hasFeature } from '../server/utils/billing/plans'
import { deduplicateSources, normalizeDoi } from '../server/utils/research/sources'
import { evaluateOutlineReadiness, getOutlineTemplate } from '../server/utils/outline/engine'
import { evaluateClaimLedger, prepareSynthesisPacket, type ResearchClaim } from '../server/utils/research/evidence'
import { evaluateConsistency } from '../server/utils/consistency/engine'

const domains = [
  { domain: 'student.example.ac.id', type: 'student' as const, verified: true },
  { domain: 'example.ac.id', type: 'mixed' as const, verified: true, allowSubdomains: true },
]

test('normalizes and matches verified campus email domains', () => {
  assert.equal(normalizeEmailDomain(' Mahasiswa@Student.Example.ac.id '), 'student.example.ac.id')
  assert.equal(matchCampusDomain('mhs@student.example.ac.id', domains)?.type, 'student')
  assert.equal(matchCampusDomain('mhs@dept.example.ac.id', domains)?.type, 'mixed')
})

test('public Gmail remains pending while campus email is admitted', () => {
  assert.equal(initialAdmissionStatus('student@gmail.com', domains), 'PENDING_STUDENT_VERIFICATION')
  assert.equal(initialAdmissionStatus('student@student.example.ac.id', domains), 'VERIFIED_STUDENT')
  assert.equal(canAccessProtectedWorkspace('PENDING_STUDENT_VERIFICATION'), false)
  assert.equal(canAccessProtectedWorkspace('VERIFIED_STUDENT'), true)
})

test('provider registry exposes native and compatible providers', () => {
  assert.equal(getProvider('openrouter')?.protocol, 'openai')
  assert.equal(getProvider('custom')?.customBaseUrl, true)
  assert.equal(getProvider('bedrock')?.status, 'planned')
})

test('unknown model gets conservative capabilities', () => {
  const unknown = resolveCapabilities('unknown-model')
  assert.equal(unknown.toolCalling, false)
  assert.deepEqual(unknown.thinking, { mode: 'unsupported' })
  const deepseek = resolveCapabilities('deepseek-flash')
  assert.equal(deepseek.toolCalling, true)
  assert.equal(deepseek.thinking.mode, 'toggle')
})

test('estimates a catalogued model request cost', () => {
  const result = estimateModelCost('openai', 'gpt-6-luna', 100_000, 10_000)
  assert.ok(result)
  assert.ok(Math.abs(result.estimatedUsd - 0.015) < 1e-10)
})

test('plans enforce sandbox as a paid entitlement', () => {
  assert.equal(hasFeature('free', 'sandbox'), false)
  assert.equal(hasFeature('student-pro', 'sandbox'), true)
})

test('verified student trial rejects pending, risky, and repeat accounts', () => {
  const eligible = evaluateOffer({
    userId: 'user-1',
    admissionStatus: 'VERIFIED_STUDENT',
    accountAgeDays: 2,
    priorOfferIds: [],
    riskScore: 10,
  }, verifiedStudentTrial)
  assert.equal(eligible.eligible, true)

  const blocked = evaluateOffer({
    userId: 'user-2',
    admissionStatus: 'PENDING_STUDENT_VERIFICATION',
    accountAgeDays: 2,
    priorOfferIds: [verifiedStudentTrial.id],
    riskScore: 80,
  }, verifiedStudentTrial)
  assert.equal(blocked.eligible, false)
  assert.deepEqual(blocked.reasons.sort(), [
    'already-redeemed',
    'risk-score-too-high',
    'student-verification-required',
  ])
})

test('normalizes DOI and deduplicates alternate source routes', () => {
  assert.equal(normalizeDoi('https://doi.org/10.1000/Example.123'), '10.1000/example.123')
  const sources = deduplicateSources([
    { id: '1', title: 'Paper', url: 'https://doi.org/10.1000/example.123', doi: '10.1000/example.123', evidenceLevel: 'metadata' },
    { id: '2', title: 'Paper mirror', url: 'https://publisher.test/paper', doi: '10.1000/EXAMPLE.123', evidenceLevel: 'metadata' },
  ])
  assert.equal(sources.length, 1)
})

test('ships complete outline templates for six research types', () => {
  const quantitative = getOutlineTemplate('quantitative')
  assert.ok(quantitative)
  assert.equal(quantitative.nodes.length, 5)
  assert.ok(getOutlineTemplate('qualitative'))
  assert.ok(getOutlineTemplate('mixed-method'))
  assert.ok(getOutlineTemplate('rnd'))
  assert.ok(getOutlineTemplate('literature-review'))
  assert.ok(getOutlineTemplate('engineering'))
})

test('readiness blocks final export until critical context is complete', () => {
  const template = getOutlineTemplate('quantitative')!
  const incomplete = evaluateOutlineReadiness({ nodes: template.nodes })
  assert.equal(incomplete.readyForFinalExport, false)

  const complete = evaluateOutlineReadiness({
    title: 'Pengaruh X terhadap Y',
    problemStatements: ['Apakah X memengaruhi Y?'],
    objectives: ['Menguji pengaruh X terhadap Y.'],
    methodology: 'Kuantitatif',
    nodes: template.nodes,
  })
  assert.equal(complete.readyForFinalExport, true)
  assert.equal(complete.summary.chapters, 5)
})

test('claim ledger distinguishes weak, supported, conflicting, and unsupported evidence', () => {
  const claims: ResearchClaim[] = [
    { id: 'unsupported', text: 'Belum ada bukti', evidence: [] },
    {
      id: 'weak',
      text: 'Didukung snippet',
      evidence: [{ sourceId: 's1', sourceTitle: 'S1', evidenceLevel: 'snippet', stance: 'supports', verified: true }],
    },
    {
      id: 'supported',
      text: 'Didukung dua abstrak',
      evidence: [
        { sourceId: 's1', sourceTitle: 'S1', evidenceLevel: 'abstract', stance: 'supports', verified: true },
        { sourceId: 's2', sourceTitle: 'S2', evidenceLevel: 'full-text', stance: 'supports', verified: true },
      ],
    },
    {
      id: 'conflict',
      text: 'Temuan berbeda',
      evidence: [
        { sourceId: 's1', sourceTitle: 'S1', evidenceLevel: 'abstract', stance: 'supports', verified: true },
        { sourceId: 's2', sourceTitle: 'S2', evidenceLevel: 'abstract', stance: 'contradicts', verified: true },
      ],
    },
  ]
  const ledger = evaluateClaimLedger(claims)
  assert.deepEqual(ledger.countByStatus, { unsupported: 1, weak: 1, supported: 1, conflicting: 1 })
})

test('synthesis packet excludes unsupported claims and requires three verified sources', () => {
  const packet = prepareSynthesisPacket([
    { id: 's1', title: 'S1', evidenceLevel: 'abstract', verified: true },
    { id: 's2', title: 'S2', evidenceLevel: 'abstract', verified: true },
    { id: 's3', title: 'S3', evidenceLevel: 'full-text', verified: true },
  ], [
    { id: 'c1', text: 'Claim', evidence: [{ sourceId: 's1', sourceTitle: 'S1', evidenceLevel: 'abstract', stance: 'supports', verified: true }] },
    { id: 'c2', text: 'Unsupported', evidence: [] },
  ])
  assert.equal(packet.canSynthesize, true)
  assert.deepEqual(packet.excludedClaimIds, ['c2'])
  assert.equal(packet.claims.length, 1)
})

test('consistency engine reports explicit alignment and evidence gaps', () => {
  const template = getOutlineTemplate('qualitative')!
  const result = evaluateConsistency({
    title: 'Studi pengalaman mahasiswa',
    problemStatements: [{ id: 'p1', text: 'Bagaimana pengalaman mahasiswa?' }],
    objectives: [{ id: 'o1', text: 'Memahami pengalaman mahasiswa', problemId: 'p1' }],
    methodology: 'Studi kasus kualitatif',
    outlineNodes: template.nodes,
    claims: [{ id: 'c1', text: 'Klaim tanpa sumber', evidence: [] }],
    conclusions: [],
  })
  assert.equal(result.criticalPassed, true)
  assert.equal(result.claimLedger.countByStatus.unsupported, 1)
  assert.ok(result.checks.some(check => check.id === 'claim-support' && !check.passed))
})
import type { AdmissionStatus } from '../admission/policy'
import type { PlanId } from '../billing/plans'

export interface OfferContext {
  userId: string
  admissionStatus: AdmissionStatus
  accountAgeDays: number
  priorOfferIds: string[]
  riskScore: number
}

export interface OfferDefinition {
  id: string
  requiredAdmission: AdmissionStatus[]
  maxAccountAgeDays: number
  maxRiskScore: number
  grantPlan: PlanId
  durationDays: number
  aiCredits: number
  sandboxMinutes: number
}

export const verifiedStudentTrial: OfferDefinition = {
  id: 'verified-student-pro-trial-v1',
  requiredAdmission: ['VERIFIED_STUDENT', 'VERIFIED_INSTITUTION'],
  maxAccountAgeDays: 30,
  maxRiskScore: 39,
  grantPlan: 'student-pro',
  durationDays: 14,
  aiCredits: 300,
  sandboxMinutes: 30,
}

export function evaluateOffer(context: OfferContext, offer: OfferDefinition) {
  const reasons: string[] = []
  if (!offer.requiredAdmission.includes(context.admissionStatus)) reasons.push('student-verification-required')
  if (context.accountAgeDays > offer.maxAccountAgeDays) reasons.push('account-too-old')
  if (context.riskScore > offer.maxRiskScore) reasons.push('risk-score-too-high')
  if (context.priorOfferIds.includes(offer.id)) reasons.push('already-redeemed')
  return { eligible: reasons.length === 0, reasons }
}
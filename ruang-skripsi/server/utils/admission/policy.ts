export type AdmissionStatus =
  | 'PENDING_EMAIL'
  | 'PENDING_STUDENT_VERIFICATION'
  | 'VERIFIED_STUDENT'
  | 'VERIFIED_INSTITUTION'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'ALUMNI'

export interface CampusDomain {
  domain: string
  type: 'student' | 'staff' | 'mixed'
  verified: boolean
  allowSubdomains?: boolean
}

export function normalizeEmailDomain(email: string) {
  const value = email.trim().toLowerCase()
  const index = value.lastIndexOf('@')
  return index > 0 && index < value.length - 1 ? value.slice(index + 1) : null
}

export function matchCampusDomain(email: string, domains: CampusDomain[]) {
  const emailDomain = normalizeEmailDomain(email)
  if (!emailDomain) return null
  return domains.find(item => {
    if (!item.verified) return false
    const domain = item.domain.trim().toLowerCase().replace(/^@/, '')
    return emailDomain === domain || Boolean(item.allowSubdomains && emailDomain.endsWith(`.${domain}`))
  }) ?? null
}

export function initialAdmissionStatus(email: string, domains: CampusDomain[]): AdmissionStatus {
  const match = matchCampusDomain(email, domains)
  if (match?.type === 'student' || match?.type === 'mixed') return 'VERIFIED_STUDENT'
  return 'PENDING_STUDENT_VERIFICATION'
}

export function canAccessProtectedWorkspace(status: AdmissionStatus) {
  return status === 'VERIFIED_STUDENT' || status === 'VERIFIED_INSTITUTION' || status === 'ALUMNI'
}
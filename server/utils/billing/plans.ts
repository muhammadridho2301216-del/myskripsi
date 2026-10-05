export type PlanId = 'free' | 'student-pro' | 'student-semester' | 'builder' | 'institution'

export interface PlanDefinition {
  id: PlanId
  label: string
  priceIdr: number | null
  billingPeriod: 'month' | 'semester' | 'contract'
  aiCredits: number
  sandboxMinutes: number
  activeProjects: number | null
  features: string[]
  experimental: boolean
}

export const plans: PlanDefinition[] = [
  {
    id: 'free',
    label: 'Free',
    priceIdr: 0,
    billingPeriod: 'month',
    aiCredits: 50,
    sandboxMinutes: 0,
    activeProjects: 1,
    features: ['byok', 'journal-search-basic', 'outline-basic', 'draft-export'],
    experimental: false,
  },
  {
    id: 'student-pro',
    label: 'Student Pro',
    priceIdr: 39_000,
    billingPeriod: 'month',
    aiCredits: 1_000,
    sandboxMinutes: 60,
    activeProjects: 3,
    features: ['managed-ai', 'journal-search', 'research-synthesis', 'final-blueprint', 'sandbox'],
    experimental: true,
  },
  {
    id: 'student-semester',
    label: 'Student Pro Semester',
    priceIdr: 179_000,
    billingPeriod: 'semester',
    aiCredits: 1_000,
    sandboxMinutes: 60,
    activeProjects: 3,
    features: ['managed-ai', 'journal-search', 'research-synthesis', 'final-blueprint', 'sandbox'],
    experimental: true,
  },
  {
    id: 'builder',
    label: 'Builder',
    priceIdr: 99_000,
    billingPeriod: 'month',
    aiCredits: 3_000,
    sandboxMinutes: 300,
    activeProjects: 10,
    features: ['managed-ai', 'deep-research', 'builder-model', 'sandbox', 'prototype-preview', 'long-artifact-retention'],
    experimental: true,
  },
  {
    id: 'institution',
    label: 'Institution',
    priceIdr: null,
    billingPeriod: 'contract',
    aiCredits: 0,
    sandboxMinutes: 0,
    activeProjects: null,
    features: ['campus-sso', 'campus-templates', 'central-policy', 'audit-log', 'custom-quota'],
    experimental: true,
  },
]

export function getPlan(planId: PlanId) {
  return plans.find(plan => plan.id === planId)
}

export function hasFeature(planId: PlanId, feature: string) {
  return Boolean(getPlan(planId)?.features.includes(feature))
}
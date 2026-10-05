import type { ModelCapabilities } from '../../server/utils/ai/catalog'
import { conservativeCapabilities, curatedCapabilities } from '../../server/utils/ai/catalog'

/**
 * Capability resolution chain (TASK-12.02). Each resolver layer may
 * override fields from the previous layer; the chain always ends at
 * `conservativeCapabilities`, so an unknown model never silently gets
 * tool-calling or thinking enabled.
 *
 * Order (highest priority last — Object.assign semantics):
 *   1. conservative fallback (base)
 *   2. curated registry (server/utils/ai/catalog.ts — admin-curated)
 *   3. provider metadata (what the discovery response itself claims, if any)
 *   4. connection override (per-BYOK-connection admin/user override — not
 *      persisted anywhere yet since there is no connection storage, but the
 *      resolver accepts it so callers have a seam to pass one through)
 *   5. admin override (platform-wide, e.g. "disable tool calling globally
 *      during an incident") — highest priority
 *
 * Every override is recorded in the returned `audit` trail (SUBTASK-12.02.07)
 * so a conflicting override is visible, not silently swallowed.
 */

export interface CapabilityAuditEntry {
  source: 'conservative' | 'curated' | 'provider-metadata' | 'connection-override' | 'admin-override'
  fields: string[]
}

export interface CapabilityResolutionInput {
  modelId: string
  /** Fields the provider's own discovery/model-info response claims, if known. */
  providerMetadata?: Partial<ModelCapabilities>
  connectionOverride?: Partial<ModelCapabilities>
  adminOverride?: Partial<ModelCapabilities>
}

export interface CapabilityResolutionResult {
  capabilities: ModelCapabilities
  audit: CapabilityAuditEntry[]
}

function changedFields(before: ModelCapabilities, patch: Partial<ModelCapabilities>): string[] {
  return Object.keys(patch).filter(key => {
    const k = key as keyof ModelCapabilities
    return JSON.stringify(before[k]) !== JSON.stringify(patch[k])
  })
}

export function resolveCapabilitiesWithAudit(input: CapabilityResolutionInput): CapabilityResolutionResult {
  const audit: CapabilityAuditEntry[] = [{ source: 'conservative', fields: Object.keys(conservativeCapabilities) }]
  let capabilities: ModelCapabilities = { ...conservativeCapabilities }

  const curated = curatedCapabilities[input.modelId]
  if (curated) {
    audit.push({ source: 'curated', fields: changedFields(capabilities, curated) })
    capabilities = { ...capabilities, ...curated }
  }
  if (input.providerMetadata) {
    const fields = changedFields(capabilities, input.providerMetadata)
    if (fields.length) audit.push({ source: 'provider-metadata', fields })
    capabilities = { ...capabilities, ...input.providerMetadata }
  }
  if (input.connectionOverride) {
    const fields = changedFields(capabilities, input.connectionOverride)
    if (fields.length) audit.push({ source: 'connection-override', fields })
    capabilities = { ...capabilities, ...input.connectionOverride }
  }
  if (input.adminOverride) {
    const fields = changedFields(capabilities, input.adminOverride)
    if (fields.length) audit.push({ source: 'admin-override', fields })
    capabilities = { ...capabilities, ...input.adminOverride }
  }
  return { capabilities, audit: audit.filter(entry => entry.fields.length > 0) }
}

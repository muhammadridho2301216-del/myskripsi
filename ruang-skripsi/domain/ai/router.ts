import { logicalModels } from '../../server/utils/ai/catalog'

/**
 * Feature model assignment / routing (TASK-12.04). `logicalModels` in
 * server/utils/ai/catalog.ts already declares the purpose/primary/fallbacks
 * triples (added in Batch 1) but nothing consumed them yet — this module is
 * the first actual router.
 *
 * This only covers MANAGED routing (platform picks the model for a logical
 * alias like 'ruang-research'). BYOK users who pick their own provider/model
 * in Settings bypass this entirely — see pages/app.vue `provider` state —
 * which is correct: a user's own key should always use the model they
 * explicitly chose, never be silently rerouted.
 */

export type LogicalModelId = keyof typeof logicalModels

export interface ModelAttempt {
  /** "provider:model", matching the primary/fallbacks string format in logicalModels. */
  target: string
  provider: string
  model: string
}

export interface RoutingPlan {
  logicalModel: LogicalModelId
  purpose: string
  attempts: ModelAttempt[]
}

function parseTarget(target: string): ModelAttempt {
  const [provider, model] = target.split(':')
  return { target, provider, model }
}

/** Builds the ordered primary -> fallback attempt list for a logical model alias. */
export function buildRoutingPlan(logicalModel: LogicalModelId): RoutingPlan {
  const definition = logicalModels[logicalModel]
  return {
    logicalModel,
    purpose: definition.purpose,
    attempts: [definition.primary, ...definition.fallbacks].map(parseTarget),
  }
}

export interface RoutingOutcome {
  attempt: ModelAttempt
  attemptIndex: number
  usedFallback: boolean
}

export type AttemptRunner = (attempt: ModelAttempt) => Promise<{ ok: true, value: unknown } | { ok: false, retryable: boolean }>

/**
 * Runs attempts in order, stopping at the first success. Only continues to
 * the next fallback when the runner reports `retryable: true` (e.g.
 * provider-unavailable, rate-limit) — an auth or invalid-request error on
 * the primary model should surface immediately rather than silently trying
 * a different model with potentially different behavior (SUBTASK-12.04.08
 * "display actual model used" depends on callers always knowing exactly
 * which attempt produced the result, including on failure).
 */
export async function runWithFallback(plan: RoutingPlan, run: AttemptRunner): Promise<{ result: unknown, outcome: RoutingOutcome }> {
  let lastError: unknown
  for (let index = 0; index < plan.attempts.length; index += 1) {
    const attempt = plan.attempts[index]
    const outcome = await run(attempt)
    if (outcome.ok) {
      return { result: outcome.value, outcome: { attempt, attemptIndex: index, usedFallback: index > 0 } }
    }
    lastError = outcome
    if (!outcome.retryable) {
      throw new RoutingExhaustedError(plan, index, attempt)
    }
  }
  throw new RoutingExhaustedError(plan, plan.attempts.length - 1, plan.attempts[plan.attempts.length - 1], lastError)
}

export class RoutingExhaustedError extends Error {
  public readonly plan: RoutingPlan
  public readonly failedAtIndex: number
  public readonly failedAttempt: ModelAttempt
  public readonly lastOutcome?: unknown

  constructor(plan: RoutingPlan, failedAtIndex: number, failedAttempt: ModelAttempt, lastOutcome?: unknown) {
    super(`Semua model untuk "${plan.logicalModel}" gagal (berhenti pada ${failedAttempt.target}).`)
    this.name = 'RoutingExhaustedError'
    this.plan = plan
    this.failedAtIndex = failedAtIndex
    this.failedAttempt = failedAttempt
    this.lastOutcome = lastOutcome
  }
}

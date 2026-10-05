/**
 * Minimal shim for Nuxt/Nitro auto-imports used by server/utils/*.ts, so
 * those files can be imported and exercised directly in a plain `tsx --test`
 * run (no Nuxt dev/build context). This tests the REAL implementation in
 * server/utils/network/safeEndpoint.ts — not a reimplementation of its
 * logic — which is the whole point of tests/ssrfProtection.test.ts.
 *
 * Import this file FIRST (side-effect only) before importing anything from
 * server/utils/.
 */

export class ShimH3Error extends Error {
  statusCode: number
  statusMessage: string
  data?: unknown
  constructor(input: { statusCode: number, statusMessage: string, data?: unknown }) {
    super(input.statusMessage)
    this.statusCode = input.statusCode
    this.statusMessage = input.statusMessage
    this.data = input.data
  }
}

if (typeof (globalThis as any).createError !== 'function') {
  ;(globalThis as any).createError = (input: { statusCode: number, statusMessage: string, data?: unknown }) => new ShimH3Error(input)
}

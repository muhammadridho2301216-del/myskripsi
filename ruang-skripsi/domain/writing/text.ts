/**
 * Pure text helpers shared by the writing workspace. No framework or DOM
 * dependencies so the same code runs in the browser, in SSR, and in tests.
 */

const CITATION_PLACEHOLDER = /\[\[cite:[^\]]*\]\]/g

/** Counts words. Citation placeholders are markup, not prose, so they are excluded. */
export function countWords(text: string): number {
  const prose = text.replace(CITATION_PLACEHOLDER, ' ').trim()
  if (!prose) return 0
  return prose.split(/\s+/).length
}

/** 32-bit FNV-1a. Used only to detect "has the text changed", never for security. */
export function hashText(text: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

const SECRET_PATTERNS: RegExp[] = [
  /\bsk-(?:ant-|proj-|or-v1-)?[A-Za-z0-9_-]{16,}/g, // OpenAI / Anthropic / OpenRouter style
  /\bsk_(?:live|test)_[A-Za-z0-9]{10,}/g, // Clerk / Stripe style secret keys
  /\bAIza[0-9A-Za-z_-]{30,}/g, // Google API keys
  /\bxai-[A-Za-z0-9]{16,}/g,
  /\bgsk_[A-Za-z0-9]{16,}/g,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{16,}/gi,
  /\b(api[_-]?key|secret|token|password)\s*[:=]\s*\S+/gi,
]

/**
 * Removes anything that looks like a credential. Applied to every free-text
 * field that is written to the change ledger so secrets cannot leak into history.
 */
export function redactSecrets(text: string): string {
  return SECRET_PATTERNS.reduce((value, pattern) => value.replace(pattern, '[disamarkan]'), text)
}

export function newId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}_${random}`
}

export function clip(text: string, max: number): string {
  const single = text.replace(/\s+/g, ' ').trim()
  return single.length > max ? `${single.slice(0, max - 1)}…` : single
}

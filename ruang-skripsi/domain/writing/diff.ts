/**
 * Word-level diff used for AI suggestion previews, version comparison and
 * revision before/after views.
 */

export type DiffOpType = 'equal' | 'add' | 'remove'
export interface DiffOp { type: DiffOpType, text: string }
export interface DiffResult {
  ops: DiffOp[]
  stats: { addedWords: number, removedWords: number, unchangedWords: number }
  /** True when the texts were too large for an exact diff and a coarse one was used. */
  coarse: boolean
}

/** Upper bound for the LCS table (cells). 4M cells is ~16 MB and finishes in a few ms. */
const MAX_LCS_CELLS = 4_000_000

function tokenize(text: string): string[] {
  return text.match(/\s+|\S+/g) ?? []
}

function pushOp(ops: DiffOp[], type: DiffOpType, text: string) {
  if (!text) return
  const last = ops[ops.length - 1]
  if (last && last.type === type) last.text += text
  else ops.push({ type, text })
}

function wordsIn(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

export function diffText(before: string, after: string): DiffResult {
  const a = tokenize(before)
  const b = tokenize(after)

  let prefix = 0
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix += 1
  let suffix = 0
  while (
    suffix < a.length - prefix
    && suffix < b.length - prefix
    && a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  ) suffix += 1

  const midA = a.slice(prefix, a.length - suffix)
  const midB = b.slice(prefix, b.length - suffix)
  const ops: DiffOp[] = []
  pushOp(ops, 'equal', a.slice(0, prefix).join(''))

  let coarse = false
  if (!midA.length || !midB.length || midA.length * midB.length > MAX_LCS_CELLS) {
    coarse = Boolean(midA.length && midB.length)
    pushOp(ops, 'remove', midA.join(''))
    pushOp(ops, 'add', midB.join(''))
  } else {
    const n = midA.length
    const m = midB.length
    const width = m + 1
    const table = new Uint32Array((n + 1) * width)
    for (let i = n - 1; i >= 0; i -= 1) {
      for (let j = m - 1; j >= 0; j -= 1) {
        table[i * width + j] = midA[i] === midB[j]
          ? table[(i + 1) * width + j + 1] + 1
          : Math.max(table[(i + 1) * width + j], table[i * width + j + 1])
      }
    }
    let i = 0
    let j = 0
    while (i < n && j < m) {
      if (midA[i] === midB[j]) {
        pushOp(ops, 'equal', midA[i])
        i += 1
        j += 1
      } else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) {
        pushOp(ops, 'remove', midA[i])
        i += 1
      } else {
        pushOp(ops, 'add', midB[j])
        j += 1
      }
    }
    while (i < n) { pushOp(ops, 'remove', midA[i]); i += 1 }
    while (j < m) { pushOp(ops, 'add', midB[j]); j += 1 }
  }

  pushOp(ops, 'equal', a.slice(a.length - suffix).join(''))

  return {
    ops,
    coarse,
    stats: {
      addedWords: ops.filter(op => op.type === 'add').reduce((sum, op) => sum + wordsIn(op.text), 0),
      removedWords: ops.filter(op => op.type === 'remove').reduce((sum, op) => sum + wordsIn(op.text), 0),
      unchangedWords: ops.filter(op => op.type === 'equal').reduce((sum, op) => sum + wordsIn(op.text), 0),
    },
  }
}

/** Rebuilds one side of a diff. `after` = equal + add, `before` = equal + remove. */
export function opsToText(ops: DiffOp[], side: 'before' | 'after'): string {
  const skip: DiffOpType = side === 'before' ? 'add' : 'remove'
  return ops.filter(op => op.type !== skip).map(op => op.text).join('')
}

export function hasChanges(result: DiffResult): boolean {
  return result.ops.some(op => op.type !== 'equal')
}

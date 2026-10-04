import type { OutlineNode } from '../../server/utils/outline/engine'
import type { BibliographySource, CitationStyle } from '../citation-style/types'
import type { ReadinessCheck } from '../../server/utils/outline/engine'
import type { ConsistencyCheck } from '../../server/utils/consistency/engine'

export type ExportKind = 'draft' | 'final-blueprint'

export interface ExportTemplate {
  id: string
  label: string
  fontFamily: string
  fontSizePt: number
  lineSpacing: number
  marginsCm: { top: number, bottom: number, left: number, right: number }
  headingNumbering: boolean
  pageNumbering: boolean
}

export const defaultTemplates: ExportTemplate[] = [
  {
    id: 'generic-id',
    label: 'Umum (Times New Roman 12, spasi 1.5)',
    fontFamily: 'Times New Roman',
    fontSizePt: 12,
    lineSpacing: 1.5,
    marginsCm: { top: 4, bottom: 3, left: 4, right: 3 },
    headingNumbering: true,
    pageNumbering: true,
  },
  {
    id: 'compact',
    label: 'Ringkas (Calibri 11, spasi tunggal)',
    fontFamily: 'Calibri',
    fontSizePt: 11,
    lineSpacing: 1,
    marginsCm: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
    headingNumbering: true,
    pageNumbering: true,
  },
]

export function getTemplate(id: string): ExportTemplate {
  return defaultTemplates.find(item => item.id === id) ?? defaultTemplates[0]
}

export interface ExportMatrixRow {
  title: string
  evidenceLevel?: string
  objective?: string
  method?: string
  finding?: string
  limitation?: string
  verified: boolean
}

export interface ExportSectionDoc {
  nodeId: string
  content: string
  wordCount: number
  status: string
  notes: string
}

/**
 * Everything the renderer needs, frozen at the moment the user clicks
 * export. "Frozen" matters: if sources or outline change after this object
 * is built, the already-generated DOCX must not silently drift (SUBTASK
 * 09.01.03) — callers build a fresh snapshot per export, never a live ref.
 */
export interface ExportSnapshot {
  kind: ExportKind
  generatedAt: string
  thesisTitle: string
  profile: { name: string, university: string, program: string, stage: string }
  researchType: string
  outlineNodes: OutlineNode[]
  sections: ExportSectionDoc[]
  sources: BibliographySource[]
  matrix: ExportMatrixRow[]
  citationStyle: CitationStyle
  template: ExportTemplate
  readiness?: { score: number, readyForFinalExport: boolean, checks: ReadinessCheck[] }
  consistency?: { score: number, criticalPassed: boolean, checks: ConsistencyCheck[] }
  aiAssistedSectionIds: string[]
}

export type ExportWarningCode =
  | 'empty-section'
  | 'below-target-words'
  | 'unverified-citation'
  | 'missing-citation-source'
  | 'incomplete-bibliography-entry'
  | 'outline-not-ready'
  | 'consistency-not-ready'
  | 'ai-assisted-section'

export interface ExportWarning {
  code: ExportWarningCode
  severity: 'critical' | 'notice'
  message: string
  nodeId?: string
  sourceId?: string
}

export interface ArtifactMetadata {
  id: string
  kind: ExportKind
  fileName: string
  generatedAt: string
  /** SHA-256-ish content hash (see domain/writing/text.ts#hashText) so re-downloads can be verified unchanged. */
  contentHash: string
  sizeBytes: number
  warningCount: number
  criticalWarningCount: number
  /** Local prototype: artifacts are not stored server-side, so there is nothing to expire yet. Kept for the Appwrite/export-service migration. */
  expiresAt: null
}

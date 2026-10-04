import { Packer } from 'docx'
import { hashText } from '../writing/text'
import { buildDocxDocument } from './docxRenderer'
import { evaluateExportReadiness } from './gate'
import type { ArtifactMetadata, ExportSnapshot } from './model'

export class ExportBlockedError extends Error {
  constructor(public readonly warnings: ReturnType<typeof evaluateExportReadiness>['warnings']) {
    super('Final Blueprint belum dapat diekspor: ada syarat kritis yang belum terpenuhi.')
    this.name = 'ExportBlockedError'
  }
}

function slugify(value: string): string {
  const slug = value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return slug || 'naskah'
}

export interface GenerateResult {
  buffer: Buffer
  metadata: ArtifactMetadata
  warnings: ReturnType<typeof evaluateExportReadiness>['warnings']
}

/**
 * Draft exports always proceed (warnings attached but non-blocking). Final
 * Blueprint exports throw ExportBlockedError if any critical warning exists
 * — callers must surface `evaluateExportReadiness` to the user BEFORE
 * calling this, so the throw path should be rare in practice, not the
 * primary way users learn about blockers.
 */
export async function generateDocx(snapshot: ExportSnapshot): Promise<GenerateResult> {
  const { allowed, warnings } = evaluateExportReadiness(snapshot)
  if (!allowed) throw new ExportBlockedError(warnings)

  const document = buildDocxDocument(snapshot)
  const buffer = await Packer.toBuffer(document)

  const fileName = `${slugify(snapshot.thesisTitle || 'naskah')}-${snapshot.kind}-${snapshot.generatedAt.slice(0, 10)}.docx`
  const metadata: ArtifactMetadata = {
    id: `exp_${hashText(fileName + buffer.length)}`,
    kind: snapshot.kind,
    fileName,
    generatedAt: snapshot.generatedAt,
    contentHash: hashText(buffer.toString('base64')),
    sizeBytes: buffer.length,
    warningCount: warnings.length,
    criticalWarningCount: warnings.filter(item => item.severity === 'critical').length,
    expiresAt: null,
  }
  return { buffer, metadata, warnings }
}

/**
 * Minimal structural validation (SUBTASK-09.02.08) without pulling in a full
 * DOCX-parsing dependency: a .docx is a ZIP, so a valid one must start with
 * the ZIP local-file-header magic bytes and must contain the mandatory
 * OOXML parts. docx's own JSZip dependency is reused here instead of adding
 * a new package.
 */
export async function validateDocxBuffer(buffer: Buffer): Promise<{ valid: boolean, errors: string[] }> {
  const errors: string[] = []
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    return { valid: false, errors: ['File tidak dimulai dengan signature ZIP yang valid.'] }
  }
  const { default: JSZip } = await import('jszip')
  try {
    const zip = await JSZip.loadAsync(buffer)
    for (const required of ['[Content_Types].xml', 'word/document.xml', '_rels/.rels']) {
      if (!zip.file(required)) errors.push(`Bagian wajib "${required}" tidak ditemukan dalam arsip.`)
    }
    const documentXml = await zip.file('word/document.xml')?.async('string')
    if (!documentXml?.includes('<w:body')) errors.push('word/document.xml tidak memiliki elemen <w:body>.')
  } catch (error) {
    errors.push(`Arsip ZIP tidak dapat dibuka: ${(error as Error).message}`)
  }
  return { valid: errors.length === 0, errors }
}

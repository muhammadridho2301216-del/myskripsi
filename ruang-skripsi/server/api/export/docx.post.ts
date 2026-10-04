import { generateDocx, ExportBlockedError } from '../../../domain/export/generate'
import { getTemplate } from '../../../domain/export/model'
import type { ExportSnapshot } from '../../../domain/export/model'

/**
 * Renders a DOCX from a snapshot the client assembled from its own state
 * (outline, writing documents, sources, readiness/consistency results —
 * all already computed client-side or via other /api endpoints). This
 * endpoint does not read or write any persisted project state; it is a pure
 * render step, matching "Sandbox tidak boleh menjadi bagian dari process
 * aplikasi utama" / keep heavy, stateless work in a dedicated handler.
 */
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const body = await readBody<Omit<ExportSnapshot, 'template'> & { templateId: string }>(event)

  if (body?.kind !== 'draft' && body?.kind !== 'final-blueprint') {
    throw createError({ statusCode: 400, statusMessage: 'Jenis export tidak dikenali.' })
  }
  if (!Array.isArray(body.outlineNodes) || !Array.isArray(body.sections) || !Array.isArray(body.sources)) {
    throw createError({ statusCode: 400, statusMessage: 'Payload export tidak lengkap.' })
  }
  if (JSON.stringify(body).length > 3_000_000) {
    throw createError({ statusCode: 413, statusMessage: 'Payload export terlalu besar.' })
  }

  const snapshot: ExportSnapshot = {
    ...body,
    generatedAt: new Date().toISOString(),
    template: getTemplate(body.templateId),
    citationStyle: body.citationStyle === 'ieee' ? 'ieee' : 'apa',
    aiAssistedSectionIds: Array.isArray(body.aiAssistedSectionIds) ? body.aiAssistedSectionIds : [],
    matrix: Array.isArray(body.matrix) ? body.matrix : [],
  }

  try {
    const result = await generateDocx(snapshot)
    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    setHeader(event, 'Content-Disposition', `attachment; filename="${result.metadata.fileName}"`)
    setHeader(event, 'X-Export-Warnings', String(result.warnings.length))
    setHeader(event, 'X-Export-Critical-Warnings', String(result.metadata.criticalWarningCount))
    return result.buffer
  } catch (error) {
    if (error instanceof ExportBlockedError) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Final Blueprint belum dapat diekspor.',
        data: { warnings: error.warnings },
      })
    }
    throw error
  }
})

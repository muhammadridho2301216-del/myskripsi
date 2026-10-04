import { evaluateExportReadiness, citationSummaryForSnapshot } from '../../../domain/export/gate'
import { getTemplate } from '../../../domain/export/model'
import type { ExportSnapshot } from '../../../domain/export/model'

/**
 * Lets the UI show the warning list and ask for acknowledgement BEFORE the
 * user commits to a (potentially large) DOCX render — see TASK-09.04
 * "Final readiness dialog" / "Warning acknowledgement".
 */
export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  const body = await readBody<Omit<ExportSnapshot, 'template'> & { templateId: string }>(event)
  if (body?.kind !== 'draft' && body?.kind !== 'final-blueprint') {
    throw createError({ statusCode: 400, statusMessage: 'Jenis export tidak dikenali.' })
  }
  if (JSON.stringify(body).length > 3_000_000) throw createError({ statusCode: 413, statusMessage: 'Payload terlalu besar.' })

  const snapshot: ExportSnapshot = {
    ...body,
    generatedAt: new Date().toISOString(),
    template: getTemplate(body.templateId),
    citationStyle: body.citationStyle === 'ieee' ? 'ieee' : 'apa',
    aiAssistedSectionIds: Array.isArray(body.aiAssistedSectionIds) ? body.aiAssistedSectionIds : [],
    matrix: Array.isArray(body.matrix) ? body.matrix : [],
  }
  const { allowed, warnings } = evaluateExportReadiness(snapshot)
  return { allowed, warnings, citations: citationSummaryForSnapshot(snapshot) }
})

import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IStylesOptions,
} from 'docx'
import { flattenOutline } from '../../server/utils/outline/engine'
import { extractCitations } from '../writing/citations'
import { buildBibliography, buildCitationOrder, inTextFor } from '../citation-style/bibliography'
import { sectionStatusLabels, type SectionStatus } from '../writing/model'
import type { ExportSnapshot } from './model'

const CM_TO_TWIP = 566.929
const PT_TO_HALF_POINTS = 2

function cm(value: number): number {
  return Math.round(value * CM_TO_TWIP)
}

function docStyles(snapshot: ExportSnapshot): IStylesOptions {
  const size = snapshot.template.fontSizePt * PT_TO_HALF_POINTS
  return {
    default: {
      document: {
        run: { font: snapshot.template.fontFamily, size },
        paragraph: { spacing: { line: Math.round(snapshot.template.lineSpacing * 240) } },
      },
    },
  }
}

/**
 * Renders text containing [[cite:key|label]] placeholders into TextRuns,
 * swapping each placeholder for the real in-text citation form. Anything
 * that isn't a recognized placeholder is rendered verbatim — the renderer
 * never invents or drops prose.
 */
function renderInlineCitations(text: string, sources: ExportSnapshot['sources'], bibliography: ReturnType<typeof buildBibliography>): TextRun[] {
  const refs = extractCitations(text, sources)
  if (!refs.length) return [new TextRun(text)]
  const runs: TextRun[] = []
  let cursor = 0
  for (const ref of refs) {
    if (ref.index > cursor) runs.push(new TextRun(text.slice(cursor, ref.index)))
    const inText = ref.source ? inTextFor(bibliography, ref.source.id) : null
    runs.push(new TextRun({ text: inText ?? `[sitasi tidak ditemukan: ${ref.label}]`, italics: !inText }))
    cursor = ref.index + ref.raw.length
  }
  if (cursor < text.length) runs.push(new TextRun(text.slice(cursor)))
  return runs
}

function paragraphsFromPlainText(text: string, sources: ExportSnapshot['sources'], bibliography: ReturnType<typeof buildBibliography>): Paragraph[] {
  const blocks = text.split(/\n{2,}/).map(block => block.trim()).filter(Boolean)
  if (!blocks.length) return [new Paragraph({ children: [new TextRun({ text: '[Bagian ini belum berisi tulisan.]', italics: true })] })]
  return blocks.map(block => new Paragraph({ children: renderInlineCitations(block, sources, bibliography) }))
}

function titlePage(snapshot: ExportSnapshot): Paragraph[] {
  return [
    new Paragraph({ text: '', spacing: { after: 800 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: snapshot.thesisTitle || '(Judul belum diisi)', bold: true, size: 32 })] }),
    new Paragraph({ text: '', spacing: { after: 400 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(snapshot.kind === 'final-blueprint' ? 'Final Blueprint' : 'Draf')] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(snapshot.profile.name)] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(snapshot.profile.program)] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(snapshot.profile.university)] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(new Date(snapshot.generatedAt).toLocaleDateString('id-ID', { dateStyle: 'long' }))] }),
    new Paragraph({ children: [], pageBreakBefore: true }),
  ]
}

function matrixTable(snapshot: ExportSnapshot): (Paragraph | Table)[] {
  if (!snapshot.matrix.length) {
    return [new Paragraph({ children: [new TextRun({ text: 'Belum ada sumber pada research matrix.', italics: true })] })]
  }
  const header = ['Sumber', 'Tujuan', 'Metode', 'Temuan', 'Keterbatasan', 'Verifikasi'] as const
  const headerRow = new TableRow({
    children: header.map(label => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })] })),
  })
  const rows = snapshot.matrix.map(row => new TableRow({
    children: [row.title, row.objective, row.method, row.finding, row.limitation, row.verified ? 'Ditinjau' : 'Belum ditinjau']
      .map(value => new TableCell({ children: [new Paragraph(value?.trim() || '—')] })),
  }))
  return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...rows] })]
}

export function buildDocxDocument(snapshot: ExportSnapshot): Document {
  const sectionNodes = flattenOutline(snapshot.outlineNodes)
  const byNodeId = new Map(snapshot.sections.map(doc => [doc.nodeId, doc]))
  const bodyTexts = sectionNodes.filter(node => node.level > 1).map(node => byNodeId.get(node.id)?.content ?? '')
  const citedOrder = buildCitationOrder(bodyTexts, snapshot.sources)
  const bibliography = buildBibliography(citedOrder, snapshot.sources, snapshot.citationStyle)

  const children: (Paragraph | Table)[] = [...titlePage(snapshot)]

  for (const node of sectionNodes) {
    const heading = node.level === 1 ? HeadingLevel.HEADING_1 : node.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3
    children.push(new Paragraph({ heading, children: [new TextRun(node.title)] }))
    if (node.level === 1) continue
    children.push(new Paragraph({ children: [new TextRun({ text: `Tujuan: ${node.objective || '(belum diisi)'}`, italics: true })] }))
    const doc = byNodeId.get(node.id)
    children.push(...paragraphsFromPlainText(doc?.content ?? '', snapshot.sources, bibliography))
    children.push(new Paragraph({
      children: [new TextRun({
        text: `[Status: ${sectionStatusLabels[(doc?.status as SectionStatus) || 'not-started']} · ${doc?.wordCount ?? 0}/${node.targetWords} kata target]`,
        size: 18,
        color: '888888',
      })],
    }))
  }

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Research Matrix')], pageBreakBefore: true }))
  children.push(...matrixTable(snapshot))

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Daftar Pustaka')], pageBreakBefore: true }))
  if (!bibliography.length) {
    children.push(new Paragraph({ children: [new TextRun({ text: 'Belum ada sumber yang disitasi dalam naskah.', italics: true })] }))
  }
  for (const entry of bibliography) {
    children.push(new Paragraph({
      children: [
        new TextRun(entry.full),
        ...(entry.complete ? [] : [new TextRun({ text: `  [tidak lengkap: ${entry.missing.join(', ')}]`, italics: true, color: 'B23B2E' })]),
        ...(entry.verified ? [] : [new TextRun({ text: '  [belum diverifikasi]', italics: true, color: '9A6518' })]),
      ],
    }))
  }

  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Keterangan Bantuan AI')], pageBreakBefore: true }))
  children.push(new Paragraph({ children: [new TextRun('Dokumen ini dibantu AI pada bagian berikut. Semua saran AI telah ditinjau dan disetujui secara manual oleh penulis sebelum diterapkan; AI tidak pernah mengubah naskah tanpa persetujuan ini.')] }))
  const aiNodes = sectionNodes.filter(node => snapshot.aiAssistedSectionIds.includes(node.id))
  if (!aiNodes.length) {
    children.push(new Paragraph({ children: [new TextRun({ text: 'Tidak ada bagian yang menggunakan saran AI pada naskah ini.', italics: true })] }))
  } else {
    for (const node of aiNodes) children.push(new Paragraph({ children: [new TextRun({ text: `• ${node.title}` })] }))
  }

  return new Document({
    creator: 'Ruang Skripsi',
    title: snapshot.thesisTitle || 'Naskah Skripsi',
    styles: docStyles(snapshot),
    sections: [{
      properties: {
        page: {
          margin: {
            top: cm(snapshot.template.marginsCm.top),
            bottom: cm(snapshot.template.marginsCm.bottom),
            left: cm(snapshot.template.marginsCm.left),
            right: cm(snapshot.template.marginsCm.right),
          },
        },
      },
      footers: snapshot.template.pageNumbering
        ? {
            default: new Footer({
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Halaman ' }), new TextRun({ children: [PageNumber.CURRENT] })],
              })],
            }),
          }
        : undefined,
      children,
    }],
  })
}

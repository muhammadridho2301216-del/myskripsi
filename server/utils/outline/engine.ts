export type ResearchType = 'quantitative' | 'qualitative' | 'mixed-method' | 'rnd' | 'literature-review' | 'engineering'

export interface OutlineNode {
  id: string
  title: string
  level: 1 | 2 | 3
  objective: string
  guidingQuestions: string[]
  targetWords: number
  requiresEvidence: boolean
  sourceIds: string[]
  status: 'not-started' | 'drafting' | 'review' | 'complete'
  children: OutlineNode[]
}

export interface OutlineTemplate {
  researchType: ResearchType
  label: string
  description: string
  nodes: OutlineNode[]
}

const node = (
  id: string,
  title: string,
  level: 1 | 2 | 3,
  objective: string,
  targetWords: number,
  requiresEvidence = false,
  children: OutlineNode[] = [],
): OutlineNode => ({
  id,
  title,
  level,
  objective,
  guidingQuestions: [],
  targetWords,
  requiresEvidence,
  sourceIds: [],
  status: 'not-started',
  children,
})

const chapter1 = () => node('bab-1', 'BAB I — Pendahuluan', 1, 'Menetapkan masalah, batas, dan arah penelitian.', 2500, true, [
  node('1.1', 'Latar Belakang', 2, 'Menjelaskan konteks, gejala, bukti masalah, dan urgensi penelitian.', 1200, true),
  node('1.2', 'Identifikasi dan Batasan Masalah', 2, 'Menentukan ruang lingkup yang realistis.', 350),
  node('1.3', 'Rumusan Masalah', 2, 'Merumuskan pertanyaan yang dapat dijawab oleh penelitian.', 250),
  node('1.4', 'Tujuan Penelitian', 2, 'Menyelaraskan tujuan dengan rumusan masalah.', 250),
  node('1.5', 'Manfaat Penelitian', 2, 'Menjelaskan manfaat teoretis dan praktis.', 300),
])

const chapter2 = (extra: OutlineNode[] = []) => node('bab-2', 'BAB II — Tinjauan Pustaka', 1, 'Membangun dasar teori dan posisi penelitian.', 5000, true, [
  node('2.1', 'Landasan Teori', 2, 'Menjelaskan teori dan konsep utama yang digunakan.', 2200, true),
  node('2.2', 'Penelitian Terdahulu', 2, 'Membandingkan penelitian relevan dan menemukan pola.', 1400, true),
  node('2.3', 'Research Gap', 2, 'Menjelaskan ruang penelitian yang belum terjawab.', 600, true),
  ...extra,
  node('2.9', 'Kerangka Berpikir', 2, 'Menjelaskan hubungan konsep dan logika penelitian.', 800, true),
])

const closingChapters = () => [
  node('bab-4', 'BAB IV — Hasil dan Pembahasan', 1, 'Menyajikan hasil dan menjawab rumusan masalah menggunakan bukti.', 6500, true, [
    node('4.1', 'Gambaran Objek Penelitian', 2, 'Memberi konteks terhadap data dan objek.', 800),
    node('4.2', 'Hasil Penelitian', 2, 'Menyajikan temuan secara sistematis.', 2700),
    node('4.3', 'Pembahasan', 2, 'Menafsirkan hasil dan membandingkannya dengan teori serta penelitian terdahulu.', 3000, true),
  ]),
  node('bab-5', 'BAB V — Penutup', 1, 'Merangkum jawaban penelitian dan implikasinya.', 1800, false, [
    node('5.1', 'Kesimpulan', 2, 'Menjawab rumusan masalah tanpa menambahkan klaim baru.', 900),
    node('5.2', 'Keterbatasan Penelitian', 2, 'Menjelaskan batas validitas dan proses penelitian.', 350),
    node('5.3', 'Saran', 2, 'Memberikan saran yang diturunkan dari hasil dan keterbatasan.', 550),
  ]),
]

export const outlineTemplates: OutlineTemplate[] = [
  {
    researchType: 'quantitative',
    label: 'Kuantitatif',
    description: 'Variabel, hipotesis, populasi, instrumen, dan analisis statistik.',
    nodes: [
      chapter1(),
      chapter2([node('2.4', 'Hipotesis Penelitian', 2, 'Menetapkan dugaan yang dapat diuji.', 350, true)]),
      node('bab-3', 'BAB III — Metode Penelitian', 1, 'Menetapkan desain pengujian yang terukur.', 3500, true, [
        node('3.1', 'Desain Penelitian', 2, 'Menjelaskan desain dan alasan pemilihannya.', 500, true),
        node('3.2', 'Populasi dan Sampel', 2, 'Menetapkan unit analisis dan teknik sampling.', 650, true),
        node('3.3', 'Variabel dan Definisi Operasional', 2, 'Mengubah konsep menjadi indikator terukur.', 800, true),
        node('3.4', 'Instrumen dan Pengujian', 2, 'Menjelaskan instrumen, validitas, dan reliabilitas.', 800, true),
        node('3.5', 'Teknik Analisis Data', 2, 'Menjelaskan prosedur statistik untuk menjawab hipotesis.', 750, true),
      ]),
      ...closingChapters(),
    ],
  },
  {
    researchType: 'qualitative',
    label: 'Kualitatif',
    description: 'Fokus fenomena, informan, pengumpulan data, dan analisis tematik.',
    nodes: [
      chapter1(),
      chapter2(),
      node('bab-3', 'BAB III — Metode Penelitian', 1, 'Menjelaskan proses memahami fenomena secara mendalam.', 3500, true, [
        node('3.1', 'Pendekatan dan Jenis Penelitian', 2, 'Menjelaskan pendekatan serta alasan pemilihannya.', 600, true),
        node('3.2', 'Lokasi, Konteks, dan Informan', 2, 'Menetapkan konteks dan strategi pemilihan informan.', 650),
        node('3.3', 'Teknik Pengumpulan Data', 2, 'Menjelaskan wawancara, observasi, atau dokumentasi.', 750, true),
        node('3.4', 'Teknik Analisis Data', 2, 'Menjelaskan coding, kategorisasi, dan pembentukan tema.', 800, true),
        node('3.5', 'Keabsahan Data dan Etika', 2, 'Menjelaskan triangulasi, refleksivitas, dan perlindungan partisipan.', 700, true),
      ]),
      ...closingChapters(),
    ],
  },
  {
    researchType: 'mixed-method',
    label: 'Mixed Method',
    description: 'Menggabungkan data kuantitatif dan kualitatif dengan desain integrasi.',
    nodes: [
      chapter1(),
      chapter2(),
      node('bab-3', 'BAB III — Metode Penelitian', 1, 'Menetapkan desain, urutan, dan integrasi dua pendekatan.', 4300, true, [
        node('3.1', 'Desain Mixed Method', 2, 'Menjelaskan desain convergent, explanatory, atau exploratory.', 700, true),
        node('3.2', 'Fase Kuantitatif', 2, 'Menjelaskan populasi, instrumen, dan analisis kuantitatif.', 1100, true),
        node('3.3', 'Fase Kualitatif', 2, 'Menjelaskan informan, pengumpulan, dan analisis kualitatif.', 1100, true),
        node('3.4', 'Strategi Integrasi', 2, 'Menjelaskan kapan dan bagaimana dua jenis hasil digabungkan.', 800, true),
        node('3.5', 'Etika dan Keabsahan', 2, 'Menjelaskan validitas, trustworthiness, dan etika.', 600, true),
      ]),
      ...closingChapters(),
    ],
  },
  {
    researchType: 'rnd',
    label: 'Research & Development',
    description: 'Analisis kebutuhan, desain, pengembangan, validasi, dan evaluasi produk.',
    nodes: [
      chapter1(),
      chapter2(),
      node('bab-3', 'BAB III — Metode Pengembangan', 1, 'Menjelaskan model dan tahapan pengembangan produk.', 4000, true, [
        node('3.1', 'Model Pengembangan', 2, 'Menjelaskan model seperti ADDIE/4D dan alasannya.', 650, true),
        node('3.2', 'Analisis Kebutuhan', 2, 'Menjelaskan pengguna, masalah, dan kebutuhan produk.', 800, true),
        node('3.3', 'Desain dan Pengembangan', 2, 'Menjelaskan rancangan dan implementasi produk.', 1100, true),
        node('3.4', 'Validasi Ahli dan Uji Coba', 2, 'Menetapkan evaluator, instrumen, dan skenario uji.', 850, true),
        node('3.5', 'Teknik Evaluasi', 2, 'Menjelaskan analisis kelayakan dan efektivitas.', 600, true),
      ]),
      ...closingChapters(),
    ],
  },
  {
    researchType: 'literature-review',
    label: 'Studi Literatur',
    description: 'Protokol pencarian, seleksi, appraisal, ekstraksi, dan sintesis sumber.',
    nodes: [
      chapter1(),
      node('bab-2', 'BAB II — Landasan dan Studi Terdahulu', 1, 'Menetapkan konsep dan konteks kajian.', 4000, true, [
        node('2.1', 'Konsep Utama', 2, 'Menjelaskan konsep yang menjadi lensa analisis.', 1800, true),
        node('2.2', 'Kajian Terdahulu', 2, 'Memetakan review atau sintesis sebelumnya.', 1500, true),
        node('2.3', 'Kerangka Sintesis', 2, 'Menetapkan kategori analisis.', 700, true),
      ]),
      node('bab-3', 'BAB III — Metode Kajian', 1, 'Membuat proses pencarian dan seleksi yang dapat direplikasi.', 3000, true, [
        node('3.1', 'Pertanyaan dan Protokol Kajian', 2, 'Menetapkan pertanyaan serta protokol.', 600, true),
        node('3.2', 'Strategi Pencarian', 2, 'Menjelaskan database/search tool, query, dan rentang.', 650),
        node('3.3', 'Kriteria Inklusi dan Eksklusi', 2, 'Menetapkan aturan seleksi sumber.', 500),
        node('3.4', 'Quality Appraisal', 2, 'Menilai kualitas dan risiko bias sumber.', 550, true),
        node('3.5', 'Ekstraksi dan Sintesis Data', 2, 'Menjelaskan matrix dan metode sintesis.', 700, true),
      ]),
      ...closingChapters(),
    ],
  },
  {
    researchType: 'engineering',
    label: 'Teknik/Informatika',
    description: 'Kebutuhan, perancangan, implementasi sistem, pengujian, dan evaluasi.',
    nodes: [
      chapter1(),
      chapter2(),
      node('bab-3', 'BAB III — Perancangan dan Metodologi', 1, 'Menetapkan kebutuhan, rancangan, data, dan metode evaluasi.', 4200, true, [
        node('3.1', 'Analisis Kebutuhan', 2, 'Menetapkan pengguna, fungsi, batas, dan risiko.', 750),
        node('3.2', 'Arsitektur dan Perancangan', 2, 'Menjelaskan komponen, alur, data, dan keputusan desain.', 1300, true),
        node('3.3', 'Implementasi', 2, 'Menjelaskan teknologi dan proses implementasi.', 900, true),
        node('3.4', 'Skenario Pengujian', 2, 'Menetapkan metrik, dataset, baseline, dan prosedur uji.', 750, true),
        node('3.5', 'Etika, Privasi, dan Keamanan', 2, 'Menjelaskan perlindungan data dan risiko sistem.', 500, true),
      ]),
      ...closingChapters(),
    ],
  },
]

export interface ReadinessInput {
  title?: string
  problemStatements?: string[]
  objectives?: string[]
  methodology?: string
  nodes: OutlineNode[]
}

export interface ReadinessCheck {
  id: string
  label: string
  passed: boolean
  severity: 'critical' | 'warning'
  message: string
}

export function flattenOutline(nodes: OutlineNode[]): OutlineNode[] {
  return nodes.flatMap(item => [item, ...flattenOutline(item.children)])
}

export function evaluateOutlineReadiness(input: ReadinessInput) {
  const all = flattenOutline(input.nodes)
  const chapters = all.filter(item => item.level === 1)
  const evidenceNodes = all.filter(item => item.requiresEvidence && item.level > 1)
  const checks: ReadinessCheck[] = [
    {
      id: 'title',
      label: 'Judul penelitian',
      passed: Boolean(input.title?.trim()),
      severity: 'critical',
      message: input.title?.trim() ? 'Judul penelitian tersedia.' : 'Judul penelitian belum tersedia.',
    },
    {
      id: 'chapters',
      label: 'Struktur bab',
      passed: chapters.length >= 5,
      severity: 'critical',
      message: chapters.length >= 5 ? `${chapters.length} bab utama tersedia.` : 'Struktur utama belum lengkap.',
    },
    {
      id: 'objectives',
      label: 'Rumusan dan tujuan',
      passed: Boolean(input.problemStatements?.length && input.problemStatements.length === input.objectives?.length),
      severity: 'critical',
      message: input.problemStatements?.length === input.objectives?.length && input.problemStatements?.length
        ? 'Setiap rumusan masalah memiliki tujuan.'
        : 'Jumlah rumusan masalah dan tujuan belum selaras.',
    },
    {
      id: 'methodology',
      label: 'Metodologi',
      passed: Boolean(input.methodology?.trim()),
      severity: 'critical',
      message: input.methodology?.trim() ? 'Metodologi telah ditetapkan.' : 'Metodologi belum ditetapkan.',
    },
    {
      id: 'objectives-per-node',
      label: 'Tujuan setiap bagian',
      passed: all.every(item => Boolean(item.objective.trim())),
      severity: 'warning',
      message: all.every(item => Boolean(item.objective.trim())) ? 'Semua bagian mempunyai tujuan.' : 'Ada bagian tanpa tujuan.',
    },
    {
      id: 'targets',
      label: 'Target penulisan',
      passed: all.filter(item => item.level > 1).every(item => item.targetWords > 0),
      severity: 'warning',
      message: 'Setiap subbagian harus mempunyai target kata.',
    },
    {
      id: 'evidence',
      label: 'Dukungan sumber',
      passed: evidenceNodes.length > 0 && evidenceNodes.every(item => item.sourceIds.length > 0),
      severity: 'warning',
      message: evidenceNodes.every(item => item.sourceIds.length > 0)
        ? 'Bagian berbasis teori telah mempunyai sumber.'
        : `${evidenceNodes.filter(item => !item.sourceIds.length).length} bagian masih membutuhkan sumber.`,
    },
  ]
  const weights = { critical: 2, warning: 1 }
  const total = checks.reduce((sum, check) => sum + weights[check.severity], 0)
  const earned = checks.reduce((sum, check) => sum + (check.passed ? weights[check.severity] : 0), 0)
  return {
    score: Math.round((earned / total) * 100),
    readyForFinalExport: checks.filter(item => item.severity === 'critical').every(item => item.passed),
    checks,
    summary: {
      chapters: chapters.length,
      sections: all.filter(item => item.level > 1).length,
      targetWords: all.filter(item => item.level > 1).reduce((sum, item) => sum + item.targetWords, 0),
      missingEvidenceSections: evidenceNodes.filter(item => !item.sourceIds.length).length,
    },
  }
}

export function getOutlineTemplate(researchType: ResearchType) {
  return outlineTemplates.find(template => template.researchType === researchType)
}
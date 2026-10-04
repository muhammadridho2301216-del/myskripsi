<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { AlertTriangle, Download, FileCheck2, Loader2 } from 'lucide-vue-next'
import { createRepositories } from '../domain/repository'
import { defaultTemplates } from '../domain/export/model'
import type { ExportKind, ExportWarning } from '../domain/export/model'
import type { CitationStyle } from '../domain/citation-style/types'

interface OutlineNodeLike {
  id: string
  title: string
  level: 1 | 2 | 3
  objective: string
  targetWords: number
  requiresEvidence: boolean
  sourceIds: string[]
  status: string
  children: OutlineNodeLike[]
}

interface SourceLike { id: string, title: string, url?: string, verified: boolean, meta?: string, evidenceLevel?: string, objective?: string, method?: string, finding?: string, limitation?: string }

const props = defineProps<{
  outlineNodes: OutlineNodeLike[]
  sources: SourceLike[]
  thesisTitle: string
  researchType: string
  profile: { name: string, university: string, program: string, stage: string }
  readiness: { score: number, readyForFinalExport: boolean, checks: any[] } | null
  consistency: { score: number, criticalPassed: boolean, checks: any[] } | null
}>()

const repo = createRepositories()
const citationStyle = ref<CitationStyle>('apa')
const templateId = ref(defaultTemplates[0].id)
const kind = ref<ExportKind>('draft')
const checking = ref(false)
const exporting = ref(false)
const error = ref('')
const readinessResult = ref<{ allowed: boolean, warnings: ExportWarning[], citations: any } | null>(null)
const acknowledged = ref(false)

function parseMetaInline(meta?: string): { author?: string, year?: string } {
  if (!meta) return {}
  const parts = meta.split('·').map(part => part.trim()).filter(Boolean)
  const year = parts.find(part => /^\d{4}$/.test(part))
  const author = parts.find(part => part !== year && part.toLowerCase() !== 'metadata dari hasil pencarian')
  return { author, year }
}

async function buildSnapshotBase() {
  const documents = await repo.writing.listDocuments()
  const sections = documents.map(state => ({
    nodeId: state.document.nodeId,
    content: state.document.content,
    wordCount: state.document.wordCount,
    status: state.document.status,
    notes: state.document.notes,
  }))
  const aiAssistedSectionIds = documents
    .filter(state => state.ledger.some(entry => entry.kind === 'ai-apply'))
    .map(state => state.document.nodeId)

  const bibliographySources = props.sources.map(source => ({
    id: source.id,
    title: source.title,
    url: source.url,
    verified: source.verified,
    ...parseMetaInline(source.meta),
  }))

  const matrix = props.sources.map(source => ({
    title: source.title,
    evidenceLevel: source.evidenceLevel,
    objective: source.objective,
    method: source.method,
    finding: source.finding,
    limitation: source.limitation,
    verified: source.verified,
  }))

  return {
    thesisTitle: props.thesisTitle,
    profile: props.profile,
    researchType: props.researchType,
    outlineNodes: props.outlineNodes,
    sections,
    sources: bibliographySources,
    matrix,
    citationStyle: citationStyle.value,
    templateId: templateId.value,
    aiAssistedSectionIds,
  }
}

async function checkReadiness() {
  error.value = ''
  checking.value = true
  acknowledged.value = false
  try {
    const base = await buildSnapshotBase()
    readinessResult.value = await $fetch<{ allowed: boolean, warnings: ExportWarning[], citations: any }>('/api/export/readiness', {
      method: 'POST',
      body: { ...base, kind: kind.value, readiness: props.readiness, consistency: props.consistency },
    })
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.statusMessage || 'Gagal memeriksa kesiapan export.'
  } finally {
    checking.value = false
  }
}

onMounted(checkReadiness)
watch([kind, citationStyle, templateId], checkReadiness)

const criticalWarnings = computed(() => readinessResult.value?.warnings.filter(item => item.severity === 'critical') ?? [])
const noticeWarnings = computed(() => readinessResult.value?.warnings.filter(item => item.severity === 'notice') ?? [])
const canExport = computed(() => kind.value === 'draft' || (readinessResult.value?.allowed && (criticalWarnings.value.length === 0 || acknowledged.value)))

async function runExport() {
  error.value = ''
  exporting.value = true
  try {
    const base = await buildSnapshotBase()
    const response = await fetch('/api/export/docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...base, kind: kind.value, readiness: props.readiness, consistency: props.consistency }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      throw new Error(data?.statusMessage || 'Export gagal.')
    }
    const disposition = response.headers.get('Content-Disposition') || ''
    const fileNameMatch = disposition.match(/filename="([^"]+)"/)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileNameMatch?.[1] || 'naskah.docx'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  } catch (err: any) {
    error.value = err?.message || 'Export gagal.'
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <section class="export-panel">
    <div class="block-head">
      <div><b>Export naskah</b><span>Draft kapan saja; Final Blueprint setelah syarat kritis terpenuhi.</span></div>
    </div>

    <div class="export-controls">
      <label>Jenis export
        <select v-model="kind">
          <option value="draft">Draft</option>
          <option value="final-blueprint">Final Blueprint</option>
        </select>
      </label>
      <label>Gaya sitasi
        <select v-model="citationStyle">
          <option value="apa">APA 7th</option>
          <option value="ieee">IEEE</option>
        </select>
      </label>
      <label>Template
        <select v-model="templateId">
          <option v-for="template in defaultTemplates" :key="template.id" :value="template.id">{{ template.label }}</option>
        </select>
      </label>
      <button class="app-secondary" :disabled="checking" @click="checkReadiness">
        <Loader2 v-if="checking" :size="15" class="spin" /><FileCheck2 v-else :size="15" /> Periksa kesiapan
      </button>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <div v-if="readinessResult" class="export-readiness">
      <div class="export-citation-summary">
        <span>{{ readinessResult.citations.total }} sitasi dalam teks</span>
        <span>{{ readinessResult.citations.verified }} sumber terverifikasi</span>
        <span v-if="readinessResult.citations.unverified" class="check-warning">{{ readinessResult.citations.unverified }} belum diverifikasi</span>
        <span v-if="readinessResult.citations.missing" class="check-critical">{{ readinessResult.citations.missing }} sumber hilang</span>
      </div>

      <div v-if="criticalWarnings.length" class="export-warning-list critical">
        <div class="export-warning-head"><AlertTriangle :size="15" /> {{ criticalWarnings.length }} syarat kritis belum terpenuhi</div>
        <p v-for="(warning, index) in criticalWarnings" :key="index">{{ warning.message }}</p>
      </div>
      <div v-if="noticeWarnings.length" class="export-warning-list notice">
        <div class="export-warning-head">{{ noticeWarnings.length }} catatan</div>
        <p v-for="(warning, index) in noticeWarnings" :key="index">{{ warning.message }}</p>
      </div>
      <div v-if="!readinessResult.warnings.length" class="export-warning-list ok">Tidak ada catatan. Naskah siap diekspor.</div>

      <label v-if="kind === 'final-blueprint' && criticalWarnings.length" class="export-ack">
        <input v-model="acknowledged" type="checkbox">
        <span>Saya memahami syarat kritis belum terpenuhi dan tetap ingin melanjutkan (tidak disarankan untuk Final Blueprint).</span>
      </label>
    </div>

    <button class="app-primary export-button" :disabled="exporting || !canExport" @click="runExport">
      <Loader2 v-if="exporting" :size="16" class="spin" /><Download v-else :size="16" />
      {{ exporting ? 'Menyiapkan dokumen…' : kind === 'draft' ? 'Unduh draft (.docx)' : 'Unduh Final Blueprint (.docx)' }}
    </button>
  </section>
</template>

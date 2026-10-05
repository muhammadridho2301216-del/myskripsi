<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { AlignLeft, Check, Clock, History, Maximize2, Minimize2, Quote, RotateCcw, Sparkles, X } from 'lucide-vue-next'
import { createRepositories } from '../domain/repository'
import {
  evidenceCoverage,
  extractCitations,
  buildCitationPlaceholder,
  checkCompletion,
  type CitationSource,
} from '../domain/writing/citations'
import {
  sectionStatusLabels,
  sectionStatusOrder,
  TransitionBlockedError,
  StaleSuggestionError,
  type SectionStatus,
} from '../domain/writing/model'
import {
  applyAISuggestion,
  changeStatus,
  commitAutosave,
  applyEdit,
  createDocument,
  manualSnapshot,
  restoreVersion,
  undoAIChange,
  type DocumentState,
} from '../domain/writing/store'
import { buildAIActionRequest, type AIActionContext } from '../domain/writing/prompts'
import { actionLabels, buildSuggestion, rewriteActions, type Suggestion } from '../domain/writing/suggestions'
import { describeAiError, requestAICompletion, type AiCompletionProvider, type AiCompletionThinking } from '../composables/useAiCompletion'
import DiffPreview from './DiffPreview.vue'

interface WritingNode { id: string, title: string, objective: string, targetWords: number, level: 1 | 2 | 3 }
interface WritingClaim { id: string, text: string, outlineNodeId?: string, sourceIds: string[] }
interface WritingClaimResult { claimId: string, status: string, warnings?: string[] }

const props = defineProps<{
  nodes: WritingNode[]
  sources: CitationSource[]
  claims: WritingClaim[]
  claimResults: WritingClaimResult[]
  openRevisionCounts: Record<string, number>
  provider: AiCompletionProvider
  thinking: AiCompletionThinking
  thesisTopic: string
  program?: string
  university?: string
  providerReady: boolean
  initialNodeId?: string
}>()

const emit = defineEmits<{ 'status-changed': [nodeId: string, status: SectionStatus] }>()

const repo = createRepositories()
const sections = computed(() => props.nodes.filter(item => item.level > 1))
const selectedNodeId = ref(props.initialNodeId || sections.value[0]?.id || '')

watch(() => props.initialNodeId, id => {
  if (id && sections.value.some(item => item.id === id)) selectedNodeId.value = id
})
const selectedNode = computed(() => sections.value.find(item => item.id === selectedNodeId.value) || null)

const state = ref<DocumentState | null>(null)
const sectionStatuses = ref<Record<string, SectionStatus>>({})
const loading = ref(false)
const saveState = ref<'idle' | 'pending' | 'saving' | 'saved'>('idle')
const focusMode = ref(false)
const showVersions = ref(false)
let autosaveTimer: ReturnType<typeof setTimeout> | null = null

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const selectionRange = ref<{ start: number, end: number } | null>(null)

const aiBusy = ref(false)
const aiError = ref('')
const aiAction = ref<'improve-clarity' | 'critique-argument' | 'find-unsupported-claims' | 'check-terminology' | ''>('')
const commentaryResult = ref('')
const pendingSuggestion = ref<Suggestion | null>(null)
const lastApplyEntryId = ref<string | null>(null)

const linkedClaims = computed(() => props.claims.filter(claim => claim.outlineNodeId === selectedNodeId.value))
const linkableSources = computed(() => {
  const ids = new Set(linkedClaims.value.flatMap(claim => claim.sourceIds))
  return props.sources.filter(source => ids.has(source.id))
})
const coverage = computed(() => {
  if (!state.value || !selectedNode.value) return null
  return evidenceCoverage(selectedNode.value.id, state.value.document.content, linkedClaims.value, props.claimResults, props.sources)
})
const citationCount = computed(() => state.value ? extractCitations(state.value.document.content, props.sources).length : 0)
const openRevisionCount = computed(() => props.openRevisionCounts[selectedNodeId.value] || 0)

async function loadNode(nodeId: string) {
  if (!nodeId) { state.value = null; return }
  loading.value = true
  pendingSuggestion.value = null
  commentaryResult.value = ''
  aiError.value = ''
  try {
    const existing = await repo.writing.getDocument(nodeId)
    state.value = existing ?? { document: createDocument(nodeId), versions: [], ledger: [] }
  } finally {
    loading.value = false
    saveState.value = 'idle'
  }
}

watch(selectedNodeId, id => loadNode(id), { immediate: true })

onMounted(async () => {
  const documents = await repo.writing.listDocuments()
  const statuses: Record<string, SectionStatus> = {}
  for (const doc of documents) statuses[doc.document.nodeId] = doc.document.status
  sectionStatuses.value = statuses
})

function queueAutosave() {
  saveState.value = 'pending'
  if (autosaveTimer) clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(flushAutosave, 1200)
}

async function flushAutosave() {
  if (!state.value) return
  saveState.value = 'saving'
  state.value = commitAutosave(state.value)
  await repo.writing.saveDocument(state.value)
  saveState.value = 'saved'
}

onBeforeUnmount(() => { if (autosaveTimer) clearTimeout(autosaveTimer) })

function onContentInput(event: Event) {
  if (!state.value) return
  const content = (event.target as HTMLTextAreaElement).value
  state.value = { ...state.value, document: applyEdit(state.value.document, content) }
  queueAutosave()
}

function onNotesInput(event: Event) {
  if (!state.value) return
  const notes = (event.target as HTMLTextAreaElement).value
  state.value = { ...state.value, document: { ...state.value.document, notes } }
  queueAutosave()
}

function trackSelection() {
  const el = textareaRef.value
  if (!el) return
  selectionRange.value = el.selectionStart !== el.selectionEnd ? { start: el.selectionStart, end: el.selectionEnd } : null
}

async function manualSave(label: string) {
  if (!state.value) return
  state.value = manualSnapshot(state.value, label || 'Snapshot manual')
  await repo.writing.saveDocument(state.value)
}

async function setStatus(to: SectionStatus) {
  if (!state.value || !selectedNode.value) return
  try {
    state.value = changeStatus(state.value, to, to === 'complete'
      ? {
          completion: {
            content: state.value.document.content,
            wordCount: state.value.document.wordCount,
            targetWords: selectedNode.value.targetWords,
            sources: props.sources,
            hasUnreviewedAI: Boolean(pendingSuggestion.value),
            openRevisionCount: openRevisionCount.value,
            coverage: coverage.value ?? undefined,
          },
        }
      : {})
    await repo.writing.saveDocument(state.value)
    sectionStatuses.value = { ...sectionStatuses.value, [selectedNodeId.value]: to }
    emit('status-changed', selectedNodeId.value, to)
  } catch (error) {
    if (error instanceof TransitionBlockedError) {
      aiError.value = error.blockers.map(item => item.message).join(' ')
    } else {
      throw error
    }
  }
}

async function restore(versionId: string) {
  if (!state.value) return
  state.value = restoreVersion(state.value, versionId)
  await repo.writing.saveDocument(state.value)
}

function insertCitation(source: CitationSource) {
  const el = textareaRef.value
  if (!el || !state.value) return
  const placeholder = buildCitationPlaceholder(source)
  const start = el.selectionStart ?? state.value.document.content.length
  const end = el.selectionEnd ?? start
  const content = state.value.document.content
  const next = `${content.slice(0, start)}${placeholder}${content.slice(end)}`
  state.value = { ...state.value, document: applyEdit(state.value.document, next) }
  queueAutosave()
  nextTick(() => { el.focus(); el.selectionStart = el.selectionEnd = start + placeholder.length })
}

function actionContext(): AIActionContext {
  return {
    thesisTopic: props.thesisTopic,
    sectionTitle: selectedNode.value?.title || '',
    sectionObjective: selectedNode.value?.objective || '',
    program: props.program,
    university: props.university,
  }
}

async function runAIAction(action: typeof aiAction.value) {
  if (!state.value || !action) return
  if (!props.providerReady) { aiError.value = 'Hubungkan provider AI terlebih dahulu di Pengaturan.'; return }
  const content = state.value.document.content
  const range = selectionRange.value ?? { start: 0, end: content.length }
  if (range.start >= range.end) { aiError.value = 'Tulis atau pilih teks terlebih dahulu.'; return }
  aiError.value = ''
  aiAction.value = action
  aiBusy.value = true
  commentaryResult.value = ''
  pendingSuggestion.value = null
  try {
    const { system, prompt } = buildAIActionRequest({ actionType: action, segment: content.slice(range.start, range.end), context: actionContext() })
    const text = await requestAICompletion({ provider: props.provider, thinking: props.thinking, system, prompt })
    if (rewriteActions.has(action)) {
      pendingSuggestion.value = buildSuggestion({
        documentId: state.value.document.id,
        content,
        range,
        proposedSegment: text,
        actionType: action,
        provider: props.provider.type,
        model: props.provider.model,
      })
    } else {
      commentaryResult.value = text
    }
  } catch (error) {
    aiError.value = describeAiError(error)
  } finally {
    aiBusy.value = false
  }
}

async function applySuggestion() {
  if (!state.value || !pendingSuggestion.value) return
  try {
    state.value = applyAISuggestion(state.value, pendingSuggestion.value)
    await repo.writing.saveDocument(state.value)
    lastApplyEntryId.value = state.value.ledger.at(-1)?.id || null
    pendingSuggestion.value = null
  } catch (error) {
    aiError.value = error instanceof StaleSuggestionError ? error.message : describeAiError(error)
  }
}

function discardSuggestion() {
  pendingSuggestion.value = null
}

async function undoLastAI() {
  if (!state.value || !lastApplyEntryId.value) return
  state.value = undoAIChange(state.value, lastApplyEntryId.value)
  await repo.writing.saveDocument(state.value)
  lastApplyEntryId.value = null
}

const commentaryLabel = computed(() => aiAction.value ? actionLabels[aiAction.value] : '')

const saveStateLabel = computed(() => ({
  idle: 'Belum ada perubahan',
  pending: 'Draf belum disimpan…',
  saving: 'Menyimpan…',
  saved: 'Tersimpan',
}[saveState.value]))
</script>

<template>
  <div class="writing-workspace" :class="{ 'focus-mode': focusMode }">
    <aside class="writing-nodes" v-if="!focusMode">
      <span>BAGIAN</span>
      <button v-for="node in sections" :key="node.id" :class="{ active: node.id === selectedNodeId }" @click="selectedNodeId = node.id">
        <b>{{ node.title }}</b>
        <small>{{ sectionStatusLabels[node.id === selectedNodeId && state ? state.document.status : (sectionStatuses[node.id] || 'not-started')] }}</small>
      </button>
    </aside>

    <div class="writing-main" v-if="selectedNode && state">
      <div class="writing-toolbar">
        <div class="writing-toolbar-info">
          <b>{{ selectedNode.title }}</b>
          <small>{{ state.document.wordCount.toLocaleString('id-ID') }} / {{ selectedNode.targetWords.toLocaleString('id-ID') }} kata · {{ saveStateLabel }}</small>
        </div>
        <div class="writing-toolbar-actions">
          <select :value="state.document.status" @change="setStatus(($event.target as HTMLSelectElement).value as any)">
            <option v-for="status in sectionStatusOrder" :key="status" :value="status">{{ sectionStatusLabels[status] }}</option>
          </select>
          <button title="Snapshot manual" @click="manualSave('Snapshot manual')"><Clock :size="16" /></button>
          <button title="Riwayat versi" :class="{ active: showVersions }" @click="showVersions = !showVersions"><History :size="16" /></button>
          <button title="Mode fokus" @click="focusMode = !focusMode"><component :is="focusMode ? Minimize2 : Maximize2" :size="16" /></button>
        </div>
      </div>

      <textarea
        ref="textareaRef"
        class="writing-editor"
        :value="state.document.content"
        placeholder="Mulai menulis bagian ini…"
        @input="onContentInput"
        @keyup="trackSelection"
        @mouseup="trackSelection"
      />

      <div class="writing-ai-bar">
        <button v-for="action in (['improve-clarity','critique-argument','find-unsupported-claims','check-terminology'] as const)" :key="action"
          :disabled="aiBusy" :class="{ active: aiAction === action }" @click="runAIAction(action)">
          <Sparkles :size="14" /> {{ actionLabels[action] }}
        </button>
        <small v-if="selectionRange">Berlaku pada teks terpilih</small>
        <small v-else>Berlaku pada seluruh naskah bagian ini</small>
      </div>
      <p v-if="aiBusy" class="writing-ai-loading">Memproses permintaan AI…</p>
      <p v-if="aiError" class="form-error">{{ aiError }}</p>

      <div v-if="pendingSuggestion" class="suggestion-preview">
        <div class="suggestion-head"><b>Pratinjau saran — {{ actionLabels[pendingSuggestion.actionType] }}</b><span>Tidak diterapkan sampai Anda menekan Terapkan.</span></div>
        <DiffPreview :ops="pendingSuggestion.diff.ops" />
        <p v-for="warning in pendingSuggestion.warnings" :key="warning.code" class="suggestion-warning">{{ warning.message }}</p>
        <div class="suggestion-actions">
          <button class="app-secondary" @click="discardSuggestion"><X :size="14" /> Tolak</button>
          <button class="app-primary" @click="applySuggestion"><Check :size="14" /> Terapkan</button>
        </div>
      </div>
      <div v-else-if="commentaryResult" class="suggestion-preview commentary">
        <div class="suggestion-head"><b>Hasil — {{ commentaryLabel }}</b></div>
        <p class="commentary-text">{{ commentaryResult }}</p>
      </div>
      <button v-if="lastApplyEntryId" class="app-secondary undo-ai" @click="undoLastAI"><RotateCcw :size="14" /> Batalkan saran AI terakhir</button>

      <div class="writing-side-row">
        <section class="writing-citations">
          <div class="block-head"><b><Quote :size="14" /> Referensi bagian ini</b><span>{{ citationCount }} sitasi dalam teks</span></div>
          <div v-if="coverage" class="coverage-bar">
            <span>{{ coverage.linkedClaims }} klaim ditautkan</span>
            <span v-if="coverage.supportedPercent !== null">{{ coverage.supportedPercent }}% didukung kuat</span>
            <span v-if="coverage.uncitedSources.length" class="check-warning">{{ coverage.uncitedSources.length }} sumber belum disitasi dalam teks</span>
          </div>
          <div v-if="!linkableSources.length" class="matrix-empty">Belum ada sumber yang ditautkan lewat Claim Ledger untuk bagian ini.</div>
          <label v-for="source in linkableSources" :key="source.id" class="citation-row">
            <span><b>{{ source.title }}</b><small>{{ source.verified ? 'terverifikasi' : 'belum diverifikasi' }}</small></span>
            <button @click="insertCitation(source)">Sisipkan</button>
          </label>
        </section>

        <section class="writing-notes">
          <div class="block-head"><b><AlignLeft :size="14" /> Catatan pribadi</b></div>
          <textarea class="notes-area" :value="state.document.notes" placeholder="Catatan ini tidak masuk ke naskah." @input="onNotesInput" />
        </section>
      </div>

      <aside v-if="showVersions" class="version-panel">
        <div class="block-head"><b>Riwayat versi</b><button @click="showVersions = false"><X :size="14" /></button></div>
        <article v-for="version in [...state.versions].sort((a,b) => b.seq - a.seq)" :key="version.id">
          <div><b>#{{ version.seq }} · {{ version.label || version.reason }}</b><small>{{ new Date(version.createdAt).toLocaleString('id-ID') }} · {{ version.wordCount }} kata · {{ version.actor }}</small></div>
          <button @click="restore(version.id)">Pulihkan</button>
        </article>
      </aside>
    </div>
    <div v-else-if="loading" class="matrix-empty">Memuat naskah…</div>
    <div v-else class="matrix-empty">Pilih bagian kerangka untuk mulai menulis.</div>
  </div>
</template>

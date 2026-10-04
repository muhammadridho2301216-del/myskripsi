<script setup lang="ts">
import {
  ArrowRight, BookOpen, Check, ChevronRight, FileText, Home, KeyRound,
  Library, LogOut, Menu, MessageSquareText, Plus, Search, Send, Settings, X
} from 'lucide-vue-next'
import WritingWorkspace from '../components/WritingWorkspace.vue'
import RevisionBoard from '../components/RevisionBoard.vue'
import BimbinganJournal from '../components/BimbinganJournal.vue'
import ExportPanel from '../components/ExportPanel.vue'

useHead({ title: 'Workspace — Ruang Skripsi', bodyAttrs: { class: 'workspace-body' } })
const router = useRouter()
const active = ref('dashboard')
const mobileNav = ref(false)
const profile = reactive({
  name: 'Mahasiswa', university: 'Universitas Anda', program: 'Program Studi',
  topic: 'Pengaruh ruang belajar digital terhadap konsistensi mahasiswa', stage: 'Menyusun proposal',
  target: '',
})
const provider = reactive({
  type: 'openai',
  name: 'OpenAI',
  apiKey: '',
  model: '',
  baseUrl: 'https://api.openai.com/v1',
  temperature: 0.35,
})
const keyVisible = ref(false)
const configSaved = ref(false)
const connectionNotice = ref('')
type ThinkingInfo =
  | { mode: 'unsupported' | 'fixed' }
  | { mode: 'toggle', defaultEnabled: boolean }
  | { mode: 'levels', levels: string[], defaultLevel: string }
  | { mode: 'budget', minTokens: number, maxTokens: number, defaultTokens: number }
  | { mode: 'provider-native', schema: string }
type ModelOption = { id: string, name: string, capabilities?: { thinking: ThinkingInfo, toolCalling: boolean, structuredOutput: boolean } }
const availableModels = ref<ModelOption[]>([])
const modelsLoading = ref(false)
const modelsLoaded = ref(false)
const thinkingEnabled = ref(true)
const thinkingLevel = ref('medium')
const thinkingBudget = ref(4096)
const selectedModel = computed(() => availableModels.value.find(item => item.id === provider.model))
const thinkingCapability = computed<ThinkingInfo>(() => selectedModel.value?.capabilities?.thinking ?? { mode: 'unsupported' })
const googleOAuth = reactive({ configured: false, connected: false, email: '' })
const hasCredential = computed(() => Boolean(provider.apiKey.trim()) || (provider.type === 'google' && googleOAuth.connected))
const prompt = ref('Tinjau rumusan masalah saya. Sebutkan bagian yang terlalu luas dan berikan satu versi yang lebih terukur.')
const answer = ref('')
const aiLoading = ref(false)
const aiError = ref('')
const selectedMode = ref('Bedah argumen')
type OutlineNode = {
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
type OutlineTemplate = { researchType: string, label: string, description: string, nodes: OutlineNode[] }
const outlineTemplates = ref<OutlineTemplate[]>([])
const selectedResearchType = ref('quantitative')
const outlineNodes = ref<OutlineNode[]>([])
const researchContext = reactive({
  problemStatement: '',
  objective: '',
  methodology: '',
})
const readiness = ref<null | {
  score: number
  readyForFinalExport: boolean
  checks: Array<{ id: string, label: string, passed: boolean, severity: string, message: string }>
  summary: { chapters: number, sections: number, targetWords: number, missingEvidenceSections: number }
}>(null)
const outlineLoading = ref(false)
const outline = computed(() => {
  const flatten = (nodes: OutlineNode[]): OutlineNode[] => nodes.flatMap(item => [item, ...flatten(item.children)])
  return flatten(outlineNodes.value).map(item => ({
    ...item,
    words: item.targetWords,
    statusLabel: item.status === 'complete' ? 'Selesai' : item.status === 'drafting' ? 'Ditulis' : item.status === 'review' ? 'Ditinjau' : 'Belum mulai',
  }))
})
const outlineOptions = computed(() => outline.value.filter(item => item.level > 1).map(item => ({ id: item.id, title: item.title })))
const openRevisionCounts = ref<Record<string, number>>({})
async function refreshOpenRevisionCounts() {
  const { createRepositories } = await import('../domain/repository')
  const { openRevisionCountForNode } = await import('../domain/revision/store')
  const all = await createRepositories().revisions.list()
  const counts: Record<string, number> = {}
  for (const node of outlineOptions.value) counts[node.id] = openRevisionCountForNode(all, node.id)
  openRevisionCounts.value = counts
}
const journals = ref([
  { title: 'Digital learning environments and undergraduate persistence', meta: 'Journal of Learning Research · 2025', saved: true, url: '', evidenceLevel: 'demo' },
  { title: 'Study routines, digital tools, and completion rates', meta: 'Higher Education Review · 2024', saved: false, url: '', evidenceLevel: 'demo' },
  { title: 'Academic self-regulation in online learning spaces', meta: 'Computers & Education · 2023', saved: false, url: '', evidenceLevel: 'demo' },
])
const journalQuery = ref('')
const journalLoading = ref(false)
const journalError = ref('')
const savedSources = ref<Array<{
  id: string
  title: string
  url: string
  meta: string
  evidenceLevel: string
  objective: string
  method: string
  finding: string
  limitation: string
  verified: boolean
}>>([])
type ClaimDraft = {
  id: string
  text: string
  outlineNodeId: string
  sourceIds: string[]
  stance: 'supports' | 'contradicts' | 'context'
}
const claims = ref<ClaimDraft[]>([])
const claimLedger = ref<null | {
  score: number
  countByStatus: Record<'unsupported' | 'weak' | 'supported' | 'conflicting', number>
  results: Array<{ claimId: string, status: string, warnings: string[] }>
}>(null)
const synthesisState = ref<null | { canSynthesize: boolean, warnings: string[], excludedClaimIds: string[] }>(null)
const consistency = ref<null | { score: number, criticalPassed: boolean, checks: Array<{ id: string, passed: boolean, message: string }> }>(null)

const nav = [
  { id: 'dashboard', label: 'Ringkasan', index: '01' },
  { id: 'outline', label: 'Kerangka', index: '02' },
  { id: 'writing', label: 'Naskah', index: '03' },
  { id: 'ai', label: 'AI Lab', index: '04' },
  { id: 'revision', label: 'Ruang revisi', index: '05' },
  { id: 'library', label: 'Jurnal', index: '06' },
  { id: 'settings', label: 'Pengaturan', index: '07' },
]
const writingTargetNodeId = ref('')
function openWritingNode(nodeId: string) {
  writingTargetNodeId.value = nodeId
  setActive('writing')
}
function onWritingStatusChanged(nodeId: string, status: string) {
  const apply = (nodes: OutlineNode[]): boolean => {
    for (const node of nodes) {
      if (node.id === nodeId) { node.status = status as OutlineNode['status']; return true }
      if (apply(node.children)) return true
    }
    return false
  }
  apply(outlineNodes.value)
  localStorage.setItem('ruang-outline-v2', JSON.stringify({ researchType: selectedResearchType.value, nodes: outlineNodes.value }))
  refreshReadiness()
}

const providerDefaults: Record<string, { name: string, baseUrl: string }> = {
  openai: { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
  anthropic: { name: 'Anthropic', baseUrl: '' },
  google: { name: 'Google Gemini', baseUrl: '' },
  openrouter: { name: 'OpenRouter', baseUrl: '' },
  deepseek: { name: 'DeepSeek', baseUrl: '' },
  groq: { name: 'Groq', baseUrl: '' },
  mistral: { name: 'Mistral', baseUrl: '' },
  together: { name: 'Together AI', baseUrl: '' },
  fireworks: { name: 'Fireworks AI', baseUrl: '' },
  cerebras: { name: 'Cerebras', baseUrl: '' },
  xai: { name: 'xAI', baseUrl: '' },
  custom: { name: 'OpenAI-compatible', baseUrl: '' },
}

const connectors = [
  { name: 'OpenAI', mode: 'openai', baseUrl: '', note: 'Model OpenAI dari akun Anda' },
  { name: 'Anthropic', mode: 'anthropic', baseUrl: '', note: 'Claude melalui Messages API' },
  { name: 'Google Gemini', mode: 'google', baseUrl: '', note: 'Gemini melalui Generative Language API' },
  { name: 'OpenRouter', mode: 'openrouter', baseUrl: '', note: 'Model lintas provider dalam satu akun' },
  { name: 'DeepSeek', mode: 'deepseek', baseUrl: '', note: 'Model DeepSeek langsung' },
  { name: 'Groq', mode: 'groq', baseUrl: '', note: 'Inferensi cepat untuk model open-weight' },
  { name: 'Mistral', mode: 'mistral', baseUrl: '', note: 'Model Mistral langsung' },
  { name: 'Together AI', mode: 'together', baseUrl: '', note: 'Model open-source terkelola' },
  { name: 'Fireworks AI', mode: 'fireworks', baseUrl: '', note: 'Serverless inference' },
  { name: 'Cerebras', mode: 'cerebras', baseUrl: '', note: 'Inferensi berkecepatan tinggi' },
  { name: 'xAI', mode: 'xai', baseUrl: '', note: 'Model Grok langsung' },
  { name: 'Custom endpoint', mode: 'custom', baseUrl: '', note: 'Endpoint HTTPS kompatibel OpenAI' },
]

onMounted(async () => {
  const savedProfile = localStorage.getItem('ruang-profile')
  if (savedProfile) Object.assign(profile, JSON.parse(savedProfile))
  const savedResearchSources = localStorage.getItem('ruang-sources-v1')
  if (savedResearchSources) savedSources.value = JSON.parse(savedResearchSources)
  const savedClaims = localStorage.getItem('ruang-claims-v1')
  if (savedClaims) claims.value = JSON.parse(savedClaims)
  const savedProvider = localStorage.getItem('ruang-ai-config')
  if (savedProvider) {
    const parsed = JSON.parse(savedProvider)
    if (parsed.type === 'router') {
      localStorage.removeItem('ruang-ai-config')
      return
    }
    Object.assign(provider, parsed, { apiKey: parsed.apiKey || '' })
    if (parsed.model) availableModels.value = [{ id: parsed.model, name: parsed.model }]
    configSaved.value = Boolean(provider.apiKey)
  }
  await loadGoogleOAuthStatus()
  await loadOutlineTemplates()
  await refreshClaimLedger()
  await refreshOpenRevisionCounts()
  if (useRoute().query.oauth === 'google-connected') {
    setProvider('google')
    connectionNotice.value = 'Akun Google berhasil dihubungkan. Ambil daftar model untuk melanjutkan.'
    configSaved.value = true
  } else if (useRoute().query.oauth === 'google-error') {
    aiError.value = 'Koneksi Google dibatalkan atau ditolak.'
  }
})

async function loadOutlineTemplates() {
  try {
    const result = await $fetch<{ templates: OutlineTemplate[] }>('/api/outline/templates')
    outlineTemplates.value = result.templates
    const saved = localStorage.getItem('ruang-outline-v2')
    if (saved) {
      const parsed = JSON.parse(saved)
      selectedResearchType.value = parsed.researchType || 'quantitative'
      outlineNodes.value = parsed.nodes || []
    }
    const savedContext = localStorage.getItem('ruang-research-context')
    if (savedContext) Object.assign(researchContext, JSON.parse(savedContext))
    if (!outlineNodes.value.length) applyOutlineTemplate()
    await refreshReadiness()
  } catch {
    outlineNodes.value = []
  }
}

function applyOutlineTemplate() {
  const template = outlineTemplates.value.find(item => item.researchType === selectedResearchType.value)
  if (!template) return
  outlineNodes.value = structuredClone(template.nodes)
  localStorage.setItem('ruang-outline-v2', JSON.stringify({
    researchType: selectedResearchType.value,
    nodes: outlineNodes.value,
  }))
  refreshReadiness()
}

async function refreshReadiness() {
  if (!outlineNodes.value.length) return
  outlineLoading.value = true
  try {
    readiness.value = await $fetch<typeof readiness.value>('/api/outline/readiness', {
      method: 'POST',
      body: {
        title: profile.topic,
        problemStatements: researchContext.problemStatement.trim() ? [researchContext.problemStatement.trim()] : [],
        objectives: researchContext.objective.trim() ? [researchContext.objective.trim()] : [],
        methodology: researchContext.methodology.trim(),
        nodes: outlineNodes.value,
      },
    })
    await refreshConsistency()
  } finally {
    outlineLoading.value = false
  }
}

function saveResearchContext() {
  localStorage.setItem('ruang-research-context', JSON.stringify(researchContext))
  refreshReadiness()
}

function setActive(id: string) {
  active.value = id
  mobileNav.value = false
  if (id === 'writing' || id === 'revision') refreshOpenRevisionCounts()
}

function setProvider(type: string) {
  provider.type = type
  provider.name = providerDefaults[type]?.name || type
  provider.model = ''
  provider.baseUrl = providerDefaults[type]?.baseUrl || ''
  availableModels.value = []
  modelsLoaded.value = false
  configSaved.value = false
}

function chooseConnector(connector: any) {
  setProvider(connector.mode)
  provider.name = connector.name
  provider.baseUrl = connector.baseUrl
  connectionNotice.value = `${connector.name} dipilih. Masukkan API key; Ruang Skripsi akan mengambil daftar model yang tersedia pada akun tersebut.`
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function fetchModels() {
  aiError.value = ''
  if (!hasCredential.value) {
    aiError.value = 'Masukkan API key atau hubungkan akun Google terlebih dahulu.'
    return
  }
  modelsLoading.value = true
  try {
    const result = await $fetch<{ models: ModelOption[] }>('/api/ai/models', {
      method: 'POST',
      body: { provider: provider.type, apiKey: provider.apiKey, baseUrl: provider.baseUrl },
    })
    availableModels.value = result.models
    modelsLoaded.value = true
    provider.model = result.models[0]?.id || ''
    if (!result.models.length) aiError.value = 'Koneksi berhasil, tetapi provider tidak mengembalikan model yang dapat dipakai.'
  } catch (error: any) {
    aiError.value = error?.data?.statusMessage || error?.statusMessage || 'Daftar model tidak dapat diambil.'
  } finally {
    modelsLoading.value = false
  }
}

async function loadGoogleOAuthStatus() {
  try {
    const status = await $fetch<{ configured: boolean, connected: boolean, email?: string | null }>('/api/oauth/google/status')
    googleOAuth.configured = status.configured
    googleOAuth.connected = status.connected
    googleOAuth.email = status.email || ''
    if (status.connected && provider.type === 'google') configSaved.value = true
  } catch {
    googleOAuth.configured = false
    googleOAuth.connected = false
  }
}

function connectGoogle() {
  if (!googleOAuth.configured) {
    aiError.value = 'Environment Google OAuth belum dikonfigurasi pada server.'
    return
  }
  window.location.href = '/api/oauth/google/start'
}

async function disconnectGoogle() {
  await $fetch('/api/oauth/google/disconnect', { method: 'POST' })
  googleOAuth.connected = false
  googleOAuth.email = ''
  availableModels.value = []
  provider.model = ''
  modelsLoaded.value = false
  configSaved.value = false
}

function saveProvider() {
  aiError.value = ''
  if (!hasCredential.value || !provider.model.trim()) {
    aiError.value = 'Hubungkan provider dan pilih model terlebih dahulu.'
    return
  }
  localStorage.setItem('ruang-ai-config', JSON.stringify(provider))
  configSaved.value = true
}

async function askAI(test = false) {
  aiError.value = ''
  answer.value = ''
  if (!hasCredential.value) {
    active.value = 'settings'
    aiError.value = 'Hubungkan provider AI terlebih dahulu.'
    return
  }
  aiLoading.value = true
  try {
    const result = await $fetch<{ text: string }>('/api/ai', {
      method: 'POST',
      body: {
        provider: provider.type,
        apiKey: provider.apiKey,
        model: provider.model,
        baseUrl: provider.baseUrl,
        temperature: provider.temperature,
        thinking: {
          enabled: thinkingEnabled.value,
          level: thinkingLevel.value,
          budgetTokens: thinkingBudget.value,
        },
        system: `Anda adalah pendamping skripsi untuk mahasiswa ${profile.program} di ${profile.university}. Topik: ${profile.topic}. Mode: ${selectedMode.value}. Jangan mengarang kutipan atau data. Pisahkan observasi, risiko, dan usulan revisi.`,
        prompt: test ? 'Balas singkat: koneksi berhasil. Sebutkan nama model yang sedang digunakan.' : prompt.value,
      },
    })
    answer.value = result.text
    if (test) configSaved.value = true
  } catch (error: any) {
    aiError.value = error?.data?.statusMessage || error?.statusMessage || 'Permintaan gagal. Periksa key, model, dan endpoint.'
  } finally {
    aiLoading.value = false
  }
}

async function searchJournals() {
  journalError.value = ''
  if (journalQuery.value.trim().length < 4) {
    journalError.value = 'Masukkan minimal empat karakter pencarian.'
    return
  }
  journalLoading.value = true
  try {
    const result = await $fetch<{
      sources: Array<{ title: string, url: string, author?: string, publishedDate?: string, evidenceLevel: string }>
    }>('/api/research/search', {
      method: 'POST',
      body: { query: journalQuery.value, numResults: 10, openAccessOnly: true },
    })
    journals.value = result.sources.map(source => ({
      title: source.title,
      meta: [source.author, source.publishedDate].filter(Boolean).join(' · ') || 'Metadata dari hasil pencarian',
      saved: savedSources.value.some(item => item.id === (source.url || source.title.toLowerCase())),
      url: source.url,
      evidenceLevel: source.evidenceLevel,
    }))
    if (!journals.value.length) journalError.value = 'Belum ada sumber yang ditemukan. Coba variasi kata kunci.'
  } catch (error: any) {
    journalError.value = error?.data?.statusMessage || error?.statusMessage || 'Pencarian jurnal gagal.'
  } finally {
    journalLoading.value = false
  }
}

function toggleSavedSource(journal: { title: string, meta: string, url: string, evidenceLevel: string, saved: boolean }) {
  journal.saved = !journal.saved
  const id = journal.url || journal.title.toLowerCase()
  if (journal.saved && !savedSources.value.some(item => item.id === id)) {
    savedSources.value.push({
      id,
      title: journal.title,
      url: journal.url,
      meta: journal.meta,
      evidenceLevel: journal.evidenceLevel,
      objective: '',
      method: '',
      finding: '',
      limitation: '',
      verified: false,
    })
  } else if (!journal.saved) {
    savedSources.value = savedSources.value.filter(item => item.id !== id)
  }
  saveResearchMatrix()
}

function saveResearchMatrix() {
  localStorage.setItem('ruang-sources-v1', JSON.stringify(savedSources.value))
  refreshClaimLedger()
}

function addClaim() {
  claims.value.push({
    id: globalThis.crypto?.randomUUID?.() || `claim-${Date.now()}`,
    text: '',
    outlineNodeId: '',
    sourceIds: [],
    stance: 'supports',
  })
  saveClaims()
}

function removeClaim(id: string) {
  claims.value = claims.value.filter(item => item.id !== id)
  saveClaims()
}

function claimPayload() {
  return claims.value.map(claim => ({
    id: claim.id,
    text: claim.text,
    outlineNodeId: claim.outlineNodeId || undefined,
    evidence: claim.sourceIds.map(sourceId => {
      const source = savedSources.value.find(item => item.id === sourceId)!
      const level = ['metadata', 'snippet', 'abstract', 'full-text', 'user-file'].includes(source?.evidenceLevel)
        ? source.evidenceLevel
        : 'metadata'
      return {
        sourceId,
        sourceTitle: source?.title || sourceId,
        evidenceLevel: level,
        stance: claim.stance,
        verified: Boolean(source?.verified),
      }
    }),
  }))
}

function saveClaims() {
  localStorage.setItem('ruang-claims-v1', JSON.stringify(claims.value))
  syncClaimEvidenceToOutline()
  refreshClaimLedger()
}

function syncClaimEvidenceToOutline() {
  const byNode = new Map<string, Set<string>>()
  for (const claim of claims.value) {
    if (!claim.outlineNodeId) continue
    const current = byNode.get(claim.outlineNodeId) ?? new Set<string>()
    claim.sourceIds.forEach(id => current.add(id))
    byNode.set(claim.outlineNodeId, current)
  }
  const apply = (nodes: OutlineNode[]) => {
    for (const item of nodes) {
      if (item.level > 1) item.sourceIds = [...(byNode.get(item.id) ?? new Set<string>())]
      apply(item.children)
    }
  }
  apply(outlineNodes.value)
  localStorage.setItem('ruang-outline-v2', JSON.stringify({
    researchType: selectedResearchType.value,
    nodes: outlineNodes.value,
  }))
  refreshReadiness()
}

async function refreshClaimLedger() {
  const payload = claimPayload()
  claimLedger.value = await $fetch<typeof claimLedger.value>('/api/research/claims/evaluate', {
    method: 'POST',
    body: { claims: payload },
  })
  await refreshConsistency()
}

async function prepareSynthesis() {
  synthesisState.value = await $fetch<typeof synthesisState.value>('/api/research/synthesis/prepare', {
    method: 'POST',
    body: {
      sources: savedSources.value,
      claims: claimPayload(),
    },
  })
}

async function refreshConsistency() {
  if (!outlineNodes.value.length) return
  consistency.value = await $fetch<typeof consistency.value>('/api/consistency/check', {
    method: 'POST',
    body: {
      title: profile.topic,
      problemStatements: researchContext.problemStatement.trim() ? [{ id: 'problem-1', text: researchContext.problemStatement }] : [],
      objectives: researchContext.objective.trim() ? [{ id: 'objective-1', text: researchContext.objective, problemId: 'problem-1' }] : [],
      methodology: researchContext.methodology,
      outlineNodes: outlineNodes.value,
      claims: claimPayload(),
      conclusions: [],
    },
  })
}

function logout() {
  localStorage.removeItem('ruang-session')
  router.push('/')
}
</script>

<template>
  <main class="workspace">
    <aside class="workspace-sidebar" :class="{ open: mobileNav }">
      <button class="workspace-brand" @click="setActive('dashboard')"><MotionLogo /><span>Ruang Skripsi</span></button>
      <button class="sidebar-close" aria-label="Tutup menu" @click="mobileNav = false"><X :size="20" /></button>
      <div class="project-switch">
        <span>PROYEK AKTIF</span>
        <b>{{ profile.topic || 'Skripsi pertama' }}</b>
        <small>{{ profile.stage }}</small>
      </div>
      <nav>
        <button v-for="item in nav" :key="item.id" :class="{ active: active === item.id }" @click="setActive(item.id)">
          <span class="nav-index">{{ item.index }}</span><span>{{ item.label }}</span>
        </button>
      </nav>
      <div class="sidebar-foot">
        <div class="user-mini"><span>{{ profile.name.slice(0, 2).toUpperCase() }}</span><div><b>{{ profile.name }}</b><small>{{ profile.program }}</small></div></div>
        <button aria-label="Keluar" @click="logout"><LogOut :size="17" /></button>
      </div>
    </aside>

    <div v-if="mobileNav" class="workspace-overlay" @click="mobileNav = false" />
    <section class="workspace-main">
      <header class="workspace-topbar">
        <button class="workspace-menu" aria-label="Buka menu" @click="mobileNav = true"><Menu :size="21" /></button>
        <div><span>{{ nav.find(n => n.id === active)?.label }}</span><small>Prototype · tersimpan lokal</small></div>
        <button class="provider-status" :class="{ ready: configSaved }" @click="setActive('settings')">
          <span />{{ configSaved ? `${provider.type} terhubung` : 'AI belum terhubung' }}
        </button>
      </header>

      <div class="workspace-content">
        <section v-if="active === 'dashboard'" class="app-view">
          <div class="app-heading">
            <p>RUANG KERJA / {{ profile.stage.toUpperCase() }}</p>
            <h1>{{ profile.topic || 'Skripsi pertama' }}</h1>
          </div>
          <div class="desk-rule"><span>Terakhir disunting hari ini, 09:42</span><b>68% proposal</b></div>
          <div class="dashboard-lead editorial-dashboard">
            <div class="manuscript-index">
              <div class="manuscript-head"><span>NASKAH AKTIF</span><b>BAB 1</b></div>
              <h2>Pendahuluan</h2>
              <div class="manuscript-row"><span>01</span><b>Latar belakang</b><small>642 kata</small><i class="complete" /></div>
              <div class="manuscript-row"><span>02</span><b>Rumusan masalah</b><small>188 kata</small><i /></div>
              <div class="manuscript-row"><span>03</span><b>Tujuan penelitian</b><small>Belum ditulis</small><i /></div>
              <button @click="setActive('outline')">Buka naskah <ArrowRight :size="16" /></button>
            </div>
            <div class="work-queue">
              <span>MEJA KERJA · HARI INI</span>
              <h2>Tiga hal sebelum tutup laptop.</h2>
              <label><input type="checkbox"><span><b>Batasi periode penelitian</b><small>Rumusan masalah · 20 menit</small></span></label>
              <label><input type="checkbox"><span><b>Cari dua sumber pembanding</b><small>Jurnal · 30 menit</small></span></label>
              <label><input type="checkbox"><span><b>Jawab catatan pembimbing</b><small>Ruang revisi · 15 menit</small></span></label>
              <button @click="setActive('ai')">Bedah rumusan di AI Lab <ArrowRight :size="16" /></button>
            </div>
          </div>
          <div class="dashboard-row editorial-row">
            <div class="activity-list activity-ledger">
              <div class="block-head"><b>Jejak kerja</b><span>7 hari terakhir</span></div>
              <article><span>09:42</span><div><b>+188 kata</b><p>Rumusan masalah</p></div></article>
              <article><span>Kemarin</span><div><b>1 revisi selesai</b><p>Batas waktu penelitian</p></div></article>
              <article><span>Senin</span><div><b>1 jurnal disimpan</b><p>Digital learning environments</p></div></article>
            </div>
            <div class="deadline deadline-editorial">
              <span>BATAS PROPOSAL</span><b>{{ profile.target || '30 Nov 2026' }}</b>
              <p>63 hari · 9 pekan kerja</p>
              <div class="week-line"><span v-for="n in 9" :key="n" :class="{ current: n === 1 }">{{ n }}</span></div>
            </div>
          </div>
        </section>

        <section v-else-if="active === 'outline'" class="app-view">
          <div class="view-head">
            <div><p>KERANGKA SKRIPSI · EVIDENCE-BASED</p><h1>{{ outlineTemplates.find(item => item.researchType === selectedResearchType)?.label || 'Kerangka' }}</h1></div>
            <div class="outline-template-actions">
              <select v-model="selectedResearchType">
                <option v-for="template in outlineTemplates" :key="template.researchType" :value="template.researchType">{{ template.label }}</option>
              </select>
              <button class="app-primary" @click="applyOutlineTemplate"><Plus :size="16" /> Gunakan template</button>
            </div>
          </div>
          <p class="outline-template-description">{{ outlineTemplates.find(item => item.researchType === selectedResearchType)?.description }}</p>
          <div class="outline-context-form">
            <label>Rumusan masalah
              <input v-model="researchContext.problemStatement" placeholder="Pertanyaan utama yang harus dijawab penelitian">
            </label>
            <label>Tujuan penelitian
              <input v-model="researchContext.objective" placeholder="Tujuan yang menjawab rumusan masalah">
            </label>
            <label>Metodologi
              <input v-model="researchContext.methodology" placeholder="Contoh: survei kuantitatif, studi kasus">
            </label>
            <button @click="saveResearchContext">Simpan & periksa</button>
          </div>
          <div class="outline-work">
            <div class="outline-items">
              <article v-for="(item, index) in outline" :key="item.id" :class="`outline-level-${item.level}`">
                <span>{{ String(index + 1).padStart(2, '0') }}</span><div><b>{{ item.title }}</b><small>{{ item.words.toLocaleString('id-ID') }} target kata · {{ item.statusLabel }}</small><p>{{ item.objective }}</p></div>
                <button v-if="item.level > 1" @click="openWritingNode(item.id)">Tulis <ChevronRight :size="18" /></button>
                <button v-else><ChevronRight :size="18" /></button>
              </article>
            </div>
            <aside class="outline-inspector">
              <span>KUALITAS KERANGKA</span>
              <b v-if="readiness">{{ readiness.checks.filter(item => !item.passed).length }} catatan</b>
              <div v-if="readiness" class="readiness-score"><strong>{{ readiness.score }}%</strong><small>{{ readiness.readyForFinalExport ? 'Siap melewati gate struktur' : 'Belum siap Final Blueprint' }}</small></div>
              <div v-if="readiness" class="readiness-summary">
                <span>{{ readiness.summary.chapters }} bab</span><span>{{ readiness.summary.sections }} bagian</span><span>{{ readiness.summary.targetWords.toLocaleString('id-ID') }} target kata</span>
              </div>
              <div v-if="consistency" class="consistency-summary">
                <span>KONSISTENSI</span>
                <strong>{{ consistency.score }}%</strong>
                <small>{{ consistency.criticalPassed ? 'Alignment kritis terpenuhi' : 'Alignment kritis belum lengkap' }}</small>
              </div>
              <p v-if="outlineLoading">Memeriksa struktur…</p>
              <template v-else-if="readiness">
                <p v-for="check in readiness.checks.filter(item => !item.passed).slice(0, 4)" :key="check.id" :class="`check-${check.severity}`">{{ check.message }}</p>
              </template>
              <button @click="refreshReadiness">Periksa ulang kerangka</button>
            </aside>
          </div>
          <ExportPanel
            :outline-nodes="outlineNodes"
            :sources="savedSources"
            :thesis-title="profile.topic"
            :research-type="selectedResearchType"
            :profile="profile"
            :readiness="readiness"
            :consistency="consistency"
          />
        </section>

        <section v-else-if="active === 'ai'" class="app-view ai-view">
          <div class="view-head"><div><p>AI LAB</p><h1>Uji tulisan sebelum dikirim.</h1></div><button class="config-link" @click="setActive('settings')"><KeyRound :size="16" /> Konfigurasi model</button></div>
          <div class="ai-layout">
            <aside class="ai-modes">
              <button v-for="mode in ['Bedah argumen','Cari celah riset','Simulasi penguji','Periksa metodologi','Ringkas jurnal']" :key="mode" :class="{ active: selectedMode === mode }" @click="selectedMode = mode">
                {{ mode }}<ChevronRight :size="15" />
              </button>
              <div class="context-box"><span>KONTEKS AKTIF</span><b>{{ profile.topic }}</b><small>Bab 1–3 · {{ profile.program }}</small></div>
            </aside>
            <div class="ai-chat">
              <div class="ai-provider-line"><span :class="{ ready: configSaved }" />{{ configSaved ? `${provider.type} / ${provider.model}` : 'Provider belum dikonfigurasi' }}</div>
              <div class="ai-empty" v-if="!answer && !aiLoading">
                <b>{{ selectedMode }}</b>
                <p>AI akan memakai profil studi dan topik aktif. Jawaban tidak otomatis masuk ke naskah.</p>
              </div>
              <div v-if="aiLoading" class="ai-loading"><i /><i /><i /><span>Sedang membaca konteks…</span></div>
              <div v-if="answer" class="ai-answer"><span>HASIL ANALISIS</span><p>{{ answer }}</p></div>
              <p v-if="aiError" class="form-error ai-error">{{ aiError }}</p>
              <div class="ai-composer">
                <textarea v-model="prompt" rows="4" placeholder="Tulis pertanyaan yang spesifik…" />
                <div><small>Jangan masukkan data pribadi responden.</small><button :disabled="aiLoading" @click="askAI(false)"><Send :size="17" /> Kirim</button></div>
              </div>
            </div>
          </div>
        </section>

        <section v-else-if="active === 'revision'" class="app-view">
          <div class="view-head"><div><p>RUANG REVISI</p><h1>Masukan dosen, satu per satu.</h1></div></div>
          <RevisionBoard :outline-options="outlineOptions" />
          <BimbinganJournal />
        </section>

        <section v-else-if="active === 'writing'" class="app-view writing-view">
          <div class="view-head"><div><p>NASKAH</p><h1>Tulis per bagian, dengan sitasi dan bukti.</h1></div></div>
          <WritingWorkspace
            :nodes="outlineNodes.flatMap(n => [n, ...n.children])"
            :sources="savedSources"
            :claims="claims"
            :claim-results="claimLedger?.results || []"
            :open-revision-counts="openRevisionCounts"
            :provider="provider"
            :thinking="{ enabled: thinkingEnabled, level: thinkingLevel, budgetTokens: thinkingBudget }"
            :thesis-topic="profile.topic"
            :program="profile.program"
            :university="profile.university"
            :provider-ready="configSaved"
            :initial-node-id="writingTargetNodeId"
            @status-changed="onWritingStatusChanged"
          />
        </section>

        <section v-else-if="active === 'library'" class="app-view">
          <div class="view-head"><div><p>PERPUSTAKAAN RISET</p><h1>Temukan dan simpan sumber.</h1></div></div>
          <div class="journal-search"><Search :size="18" /><input v-model="journalQuery" placeholder="Cari judul, DOI, atau kata kunci…" @keyup.enter="searchJournals" /><button :disabled="journalLoading" @click="searchJournals">{{ journalLoading ? 'Mencari…' : 'Cari' }}</button></div>
          <p v-if="journalError" class="form-error">{{ journalError }}</p>
          <div class="journal-layout">
            <aside><b>Filter</b><label><input type="checkbox" checked> Open access</label><label><input type="checkbox"> 5 tahun terakhir</label><label><input type="checkbox"> Bahasa Indonesia</label></aside>
            <div class="journal-results">
              <span>HASIL DEMO BERDASARKAN TOPIK AKTIF</span>
              <article v-for="journal in journals" :key="journal.title">
                <div><small>{{ journal.evidenceLevel === 'demo' ? 'HASIL DEMO' : `BUKTI: ${journal.evidenceLevel.toUpperCase()}` }}</small><h2>{{ journal.title }}</h2><p>{{ journal.meta }}</p><a v-if="journal.url" :href="journal.url" target="_blank" rel="noopener noreferrer">Buka sumber asli ↗</a></div>
                <button @click="toggleSavedSource(journal)">{{ journal.saved ? 'Tersimpan' : '+ Simpan' }}</button>
              </article>
            </div>
          </div>
          <section class="research-matrix">
            <div class="block-head"><b>Research matrix</b><span>{{ savedSources.length }} sumber tersimpan</span></div>
            <div v-if="!savedSources.length" class="matrix-empty">Simpan hasil pencarian untuk membangun matriks. Kolom kosong tidak akan diisi secara spekulatif.</div>
            <div v-else class="matrix-scroll">
              <table>
                <thead><tr><th>Sumber</th><th>Tujuan</th><th>Metode</th><th>Temuan</th><th>Keterbatasan</th><th>Verifikasi</th></tr></thead>
                <tbody>
                  <tr v-for="source in savedSources" :key="source.id">
                    <td><b>{{ source.title }}</b><small>{{ source.evidenceLevel }}</small></td>
                    <td><textarea v-model="source.objective" placeholder="Belum diverifikasi" @change="saveResearchMatrix" /></td>
                    <td><textarea v-model="source.method" placeholder="Belum diverifikasi" @change="saveResearchMatrix" /></td>
                    <td><textarea v-model="source.finding" placeholder="Belum diverifikasi" @change="saveResearchMatrix" /></td>
                    <td><textarea v-model="source.limitation" placeholder="Belum diverifikasi" @change="saveResearchMatrix" /></td>
                    <td><label><input v-model="source.verified" type="checkbox" @change="saveResearchMatrix"> Ditinjau</label></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section class="claim-ledger">
            <div class="block-head">
              <div><b>Claim Ledger</b><span>Klaim harus dapat dilacak ke sumber terverifikasi.</span></div>
              <button @click="addClaim">+ Tambah klaim</button>
            </div>
            <div v-if="claimLedger" class="claim-stats">
              <span>Skor {{ claimLedger.score }}%</span>
              <span>{{ claimLedger.countByStatus.supported }} didukung</span>
              <span>{{ claimLedger.countByStatus.weak }} lemah</span>
              <span>{{ claimLedger.countByStatus.conflicting }} konflik</span>
              <span>{{ claimLedger.countByStatus.unsupported }} tanpa dukungan</span>
            </div>
            <div v-if="!claims.length" class="matrix-empty">Belum ada klaim. Tambahkan klaim setelah sumber ditinjau; metadata saja tidak dianggap bukti kuat.</div>
            <article v-for="claim in claims" v-else :key="claim.id">
              <div class="claim-main">
                <textarea v-model="claim.text" placeholder="Tuliskan satu klaim yang spesifik…" @change="saveClaims" />
                <select v-model="claim.stance" @change="saveClaims">
                  <option value="supports">Sumber mendukung</option>
                  <option value="contradicts">Sumber menyangkal</option>
                  <option value="context">Sumber hanya memberi konteks</option>
                </select>
                <select v-model="claim.outlineNodeId" @change="saveClaims">
                  <option value="">Belum dihubungkan ke kerangka</option>
                  <option v-for="node in outline.filter(item => item.level > 1)" :key="node.id" :value="node.id">{{ node.title }}</option>
                </select>
              </div>
              <div class="claim-sources">
                <span>SUMBER PENDUKUNG</span>
                <label v-for="source in savedSources" :key="source.id">
                  <input v-model="claim.sourceIds" type="checkbox" :value="source.id" @change="saveClaims">
                  <span><b>{{ source.title }}</b><small>{{ source.evidenceLevel }} · {{ source.verified ? 'terverifikasi' : 'belum ditinjau' }}</small></span>
                </label>
                <small v-if="!savedSources.length">Simpan dan verifikasi sumber terlebih dahulu.</small>
              </div>
              <div class="claim-result">
                <b>{{ claimLedger?.results.find(item => item.claimId === claim.id)?.status || 'unsupported' }}</b>
                <small>{{ claimLedger?.results.find(item => item.claimId === claim.id)?.warnings.join(' · ') }}</small>
                <button @click="removeClaim(claim.id)">Hapus</button>
              </div>
            </article>
            <div class="synthesis-gate">
              <button @click="prepareSynthesis">Siapkan paket sintesis</button>
              <div v-if="synthesisState">
                <b>{{ synthesisState.canSynthesize ? 'Paket siap disintesis' : 'Belum siap disintesis' }}</b>
                <small>{{ synthesisState.warnings.join(' · ') || 'Seluruh aturan minimum terpenuhi.' }}</small>
              </div>
            </div>
          </section>
        </section>

        <section v-else class="app-view settings-view">
          <div class="view-head"><div><p>PENGATURAN AI · BYOK</p><h1>Gunakan model pilihan Anda.</h1></div></div>
          <div class="settings-grid">
            <div class="provider-config">
              <div class="provider-tabs">
                <button :class="{ active: provider.type === 'openai' }" @click="setProvider('openai')">OpenAI format</button>
                <button :class="{ active: provider.type === 'anthropic' }" @click="setProvider('anthropic')">Anthropic</button>
                <button :class="{ active: provider.type === 'google' }" @click="setProvider('google')">Google Gemini</button>
              </div>
              <div class="provider-explainer">
                <template v-if="provider.type === 'openai'"><b>{{ provider.name }}</b><p>Ruang Skripsi terhubung langsung ke provider melalui endpoint kompatibel OpenAI.</p></template>
                <template v-else-if="provider.type === 'anthropic'"><b>Claude Messages API</b><p>Menggunakan header <code>x-api-key</code>, versi API Anthropic, dan system prompt tingkat atas.</p></template>
                <template v-else-if="provider.type === 'google'"><b>Google Generative Language API</b><p>Menggunakan <code>generateContent</code>, <code>systemInstruction</code>, serta OAuth milik Ruang Skripsi atau API key.</p></template>
                <template v-else><b>{{ provider.name }}</b><p>Adapter dan endpoint dipilih dari registry server; base URL hanya dapat diubah untuk koneksi Custom.</p></template>
              </div>
              <div v-if="provider.type === 'google'" class="google-oauth-connect">
                <div>
                  <span>GOOGLE OAUTH</span>
                  <b v-if="googleOAuth.connected">{{ googleOAuth.email || 'Akun Google terhubung' }}</b>
                  <b v-else>Hubungkan akun Google</b>
                  <small v-if="!googleOAuth.configured">Menunggu environment OAuth pada server.</small>
                  <small v-else-if="googleOAuth.connected">Token disimpan terenkripsi dalam cookie HttpOnly.</small>
                  <small v-else>Anda akan diarahkan ke halaman persetujuan Google.</small>
                </div>
                <button v-if="googleOAuth.connected" @click="disconnectGoogle">Putuskan</button>
                <button v-else :disabled="!googleOAuth.configured" @click="connectGoogle">Lanjutkan dengan Google</button>
              </div>
              <div v-if="provider.type === 'google'" class="auth-divider"><span>atau gunakan API key</span></div>
              <label>API key
                <div class="key-input"><input v-model="provider.apiKey" :type="keyVisible ? 'text' : 'password'" autocomplete="off" placeholder="Masukkan key provider" @change="modelsLoaded = false" /><button @click="keyVisible = !keyVisible">{{ keyVisible ? 'Sembunyikan' : 'Lihat' }}</button></div>
              </label>
              <button class="discover-models" :disabled="modelsLoading || !hasCredential" @click="fetchModels">{{ modelsLoading ? 'Mengambil model…' : modelsLoaded ? 'Perbarui daftar model' : 'Verifikasi dan ambil model' }} <ArrowRight :size="15" /></button>
              <label>Model
                <select v-model="provider.model" :disabled="!availableModels.length">
                  <option value="" disabled>{{ modelsLoaded ? 'Pilih model' : 'Model muncul setelah key diverifikasi' }}</option>
                  <option v-for="model in availableModels" :key="model.id" :value="model.id">{{ model.name }}</option>
                </select>
              </label>
              <div v-if="provider.model" class="capability-panel">
                <span>MODEL CAPABILITIES</span>
                <small>Tool calling: {{ selectedModel?.capabilities?.toolCalling ? 'didukung' : 'belum terverifikasi' }} · Structured output: {{ selectedModel?.capabilities?.structuredOutput ? 'didukung' : 'belum terverifikasi' }}</small>
                <label v-if="thinkingCapability.mode === 'toggle'">
                  <input v-model="thinkingEnabled" type="checkbox"> Aktifkan thinking
                </label>
                <label v-else-if="thinkingCapability.mode === 'levels'">Thinking level
                  <select v-model="thinkingLevel">
                    <option v-for="level in thinkingCapability.levels" :key="level" :value="level">{{ level }}</option>
                  </select>
                </label>
                <label v-else-if="thinkingCapability.mode === 'budget'">Thinking budget
                  <div class="range-line">
                    <input v-model.number="thinkingBudget" type="range" :min="thinkingCapability.minTokens" :max="thinkingCapability.maxTokens" step="512">
                    <b>{{ thinkingBudget }}</b>
                  </div>
                </label>
                <small v-else-if="thinkingCapability.mode === 'fixed'">Thinking selalu aktif pada model ini.</small>
                <small v-else-if="thinkingCapability.mode === 'provider-native'">Thinking mengikuti konfigurasi native provider.</small>
                <small v-else>Kontrol thinking disembunyikan karena capability belum terverifikasi atau tidak didukung.</small>
              </div>
              <details v-if="provider.type === 'custom'" class="advanced-provider" open>
                <summary>Pengaturan endpoint lanjutan</summary>
                <label>Base URL<input v-model="provider.baseUrl" placeholder="https://api.openai.com/v1"><small>Terisi otomatis saat Anda memilih provider dari katalog.</small></label>
              </details>
              <label>Temperature <div class="range-line"><input v-model.number="provider.temperature" type="range" min="0" max="1" step="0.05"><b>{{ provider.temperature.toFixed(2) }}</b></div></label>
              <p v-if="aiError" class="form-error">{{ aiError }}</p>
              <div class="settings-actions"><button class="app-secondary" :disabled="aiLoading" @click="askAI(true)">Tes koneksi</button><button class="app-primary" @click="saveProvider"><Check :size="16" /> Simpan konfigurasi</button></div>
              <p v-if="answer" class="connection-result">{{ answer }}</p>
              <p v-if="connectionNotice" class="connection-notice">{{ connectionNotice }}</p>
            </div>
            <aside class="security-note">
              <KeyRound :size="22" />
              <h2>Key tetap milik Anda.</h2>
              <p>Pada prototype, key disimpan di localStorage browser dan dikirim ke server hanya saat membuat permintaan. Server tidak memasukkannya ke database.</p>
              <div><b>Untuk produksi</b><p>Gunakan vault terenkripsi, rotasi key, pembatasan kuota, audit log tanpa prompt sensitif, serta autentikasi server.</p></div>
            </aside>
          </div>
          <section class="connector-catalog">
            <div class="connector-head">
              <div><span>PILIH PROVIDER</span><h2>Terhubung langsung dari Ruang Skripsi.</h2></div>
            </div>
            <div class="connector-table">
              <article v-for="connector in connectors" :key="connector.name">
                <span>{{ String(connectors.indexOf(connector) + 1).padStart(2, '0') }}</span>
                <div><b>{{ connector.name }}</b><small>{{ connector.note }}</small></div>
                <em>API key</em>
                <button @click="chooseConnector(connector)">Hubungkan <ArrowRight :size="14" /></button>
              </article>
            </div>
            <div class="oauth-note">
              <span>OAUTH LANGSUNG</span>
              <div><b>Google OAuth sudah terintegrasi atas nama Ruang Skripsi.</b><p>Authorization Code + PKCE, state validation, refresh token, cookie HttpOnly terenkripsi, disconnect, model discovery, dan pemanggilan Gemini dengan Bearer token sudah disiapkan. Aktif setelah environment OAuth dan callback domain diisi.</p></div>
            </div>
          </section>
        </section>
      </div>
    </section>
  </main>
</template>
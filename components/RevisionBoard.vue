<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ChevronRight, Plus, X } from 'lucide-vue-next'
import { createRepositories } from '../domain/repository'
import {
  revisionPriorityLabels,
  revisionSourceLabels,
  revisionStatusLabels,
  revisionStatusOrder,
  canTransition,
  type Revision,
  type RevisionPriority,
  type RevisionSourceType,
  type RevisionStatus,
} from '../domain/revision/model'
import {
  RevisionBlockedError,
  createRevision,
  summarizeRevisions,
  sortRevisions,
  transitionRevision,
} from '../domain/revision/store'

const props = defineProps<{
  outlineOptions: Array<{ id: string, title: string }>
}>()

const repo = createRepositories()
const revisions = ref<Revision[]>([])
const filter = ref<'all' | RevisionStatus>('all')
const showForm = ref(false)
const error = ref('')

const form = ref({
  author: '',
  sourceType: 'pembimbing-1' as RevisionSourceType,
  requestText: '',
  outlineNodeId: '',
  priority: 'medium' as RevisionPriority,
  deadline: '',
})

const sorted = computed(() => sortRevisions(revisions.value))
const filtered = computed(() => filter.value === 'all' ? sorted.value : sorted.value.filter(item => item.status === filter.value))
const summary = computed(() => summarizeRevisions(revisions.value))

async function load() {
  revisions.value = await repo.revisions.list()
}
onMounted(load)

async function submitForm() {
  error.value = ''
  if (!form.value.author.trim() || !form.value.requestText.trim()) {
    error.value = 'Isi nama pemberi revisi dan isi catatannya.'
    return
  }
  const node = props.outlineOptions.find(item => item.id === form.value.outlineNodeId)
  const revision = createRevision({
    author: form.value.author,
    sourceType: form.value.sourceType,
    requestText: form.value.requestText,
    outlineNodeId: node?.id,
    outlineNodeTitle: node?.title,
    priority: form.value.priority,
    deadline: form.value.deadline || undefined,
  })
  await repo.revisions.save(revision)
  revisions.value = [...revisions.value, revision]
  form.value = { author: '', sourceType: 'pembimbing-1', requestText: '', outlineNodeId: '', priority: 'medium', deadline: '' }
  showForm.value = false
}

const textAfterDrafts = ref<Record<string, string>>({})

async function move(revision: Revision, to: RevisionStatus) {
  error.value = ''
  try {
    const updated = transitionRevision(revision, to, { textAfter: textAfterDrafts.value[revision.id] })
    await repo.revisions.save(updated)
    revisions.value = revisions.value.map(item => item.id === updated.id ? updated : item)
  } catch (err) {
    error.value = err instanceof RevisionBlockedError ? err.message : (err as Error).message
  }
}

function nextStatuses(revision: Revision): RevisionStatus[] {
  return revisionStatusOrder.filter(status => status !== revision.status && (canTransition(revision.status, status)))
}
</script>

<template>
  <div class="revision-board">
    <div class="revision-summary">
      <span>{{ summary.total }} total</span>
      <span v-if="summary.overdue" class="check-warning">{{ summary.overdue }} lewat deadline</span>
      <span v-if="summary.blocking" class="check-warning">{{ summary.blocking }} menghambat sidang</span>
    </div>
    <div class="revision-table">
      <div class="revision-filter">
        <button :class="{ active: filter === 'all' }" @click="filter = 'all'">Semua · {{ summary.total }}</button>
        <button v-for="status in revisionStatusOrder" :key="status" :class="{ active: filter === status }" @click="filter = status">
          {{ revisionStatusLabels[status] }} · {{ summary.byStatus[status] }}
        </button>
        <button class="app-primary" @click="showForm = !showForm"><Plus :size="16" /> Catat revisi</button>
      </div>

      <div v-if="showForm" class="revision-form">
        <label>Pemberi revisi <input v-model="form.author" placeholder="Bu Diana"></label>
        <label>Sumber
          <select v-model="form.sourceType">
            <option v-for="(label, key) in revisionSourceLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </label>
        <label>Bab/subbab terkait
          <select v-model="form.outlineNodeId">
            <option value="">Tidak ditautkan</option>
            <option v-for="node in outlineOptions" :key="node.id" :value="node.id">{{ node.title }}</option>
          </select>
        </label>
        <label>Prioritas
          <select v-model="form.priority">
            <option v-for="(label, key) in revisionPriorityLabels" :key="key" :value="key">{{ label }}</option>
          </select>
        </label>
        <label>Deadline <input v-model="form.deadline" type="date"></label>
        <label class="revision-form-full">Catatan revisi <textarea v-model="form.requestText" rows="3" placeholder="Tuliskan masukan sesuai yang disampaikan…" /></label>
        <div class="revision-form-actions">
          <button class="app-secondary" @click="showForm = false"><X :size="14" /> Batal</button>
          <button class="app-primary" @click="submitForm">Simpan revisi</button>
        </div>
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>
      <div v-if="!filtered.length" class="matrix-empty">Belum ada revisi pada kategori ini.</div>
      <article v-for="revision in filtered" :key="revision.id">
        <span class="revision-state" :class="revision.status">{{ revisionStatusLabels[revision.status] }}</span>
        <div>
          <small>{{ revision.outlineNodeTitle || 'Belum ditautkan' }} · {{ revisionSourceLabels[revision.sourceType] }}<template v-if="revision.deadline"> · tenggat {{ new Date(revision.deadline).toLocaleDateString('id-ID') }}</template></small>
          <p>{{ revision.requestText }}</p>
          <b>{{ revision.author }} · {{ revisionPriorityLabels[revision.priority] }}</b>
          <textarea v-if="nextStatuses(revision).some(s => s === 'selesai' || s === 'perlu-konfirmasi')" v-model="textAfterDrafts[revision.id]" rows="2" placeholder="Teks sesudah revisi / bukti perubahan (diperlukan untuk menutup revisi)" />
          <div class="revision-move">
            <button v-for="status in nextStatuses(revision)" :key="status" @click="move(revision, status)">
              {{ revisionStatusLabels[status] }} <ChevronRight :size="14" />
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

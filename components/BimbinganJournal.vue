<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { createRepositories } from '../domain/repository'
import { buildTimeline, createBimbinganEntry, toggleTarget, type BimbinganEntry } from '../domain/bimbingan/model'

const repo = createRepositories()
const entries = ref<BimbinganEntry[]>([])
const showForm = ref(false)
const error = ref('')

const form = ref({ meetingDate: new Date().toISOString().slice(0, 10), supervisor: '', agenda: '', decisions: '', nextMeetingTargets: '' })

async function load() { entries.value = await repo.bimbingan.list() }
onMounted(load)

async function submitForm() {
  error.value = ''
  if (!form.value.supervisor.trim() || !form.value.agenda.trim()) {
    error.value = 'Isi nama pembimbing dan agenda pertemuan.'
    return
  }
  const entry = createBimbinganEntry({
    meetingDate: form.value.meetingDate,
    supervisor: form.value.supervisor,
    agenda: form.value.agenda,
    decisions: form.value.decisions.split('\n'),
    nextMeetingTargets: form.value.nextMeetingTargets.split('\n'),
  })
  await repo.bimbingan.save(entry)
  entries.value = [...entries.value, entry]
  form.value = { meetingDate: new Date().toISOString().slice(0, 10), supervisor: '', agenda: '', decisions: '', nextMeetingTargets: '' }
  showForm.value = false
}

async function toggle(entry: BimbinganEntry, targetId: string) {
  const updated = toggleTarget(entry, targetId)
  await repo.bimbingan.save(updated)
  entries.value = entries.value.map(item => item.id === updated.id ? updated : item)
}
</script>

<template>
  <section class="bimbingan-journal">
    <div class="block-head">
      <div><b>Jurnal bimbingan</b><span>Catatan pertemuan dan target berikutnya.</span></div>
      <button class="app-primary" @click="showForm = !showForm"><Plus :size="16" /> Catat pertemuan</button>
    </div>

    <div v-if="showForm" class="revision-form">
      <label>Tanggal <input v-model="form.meetingDate" type="date"></label>
      <label>Pembimbing <input v-model="form.supervisor" placeholder="Bu Diana"></label>
      <label class="revision-form-full">Agenda <textarea v-model="form.agenda" rows="2" placeholder="Apa yang dibahas…" /></label>
      <label class="revision-form-full">Keputusan (satu per baris) <textarea v-model="form.decisions" rows="2" /></label>
      <label class="revision-form-full">Target pertemuan berikutnya (satu per baris) <textarea v-model="form.nextMeetingTargets" rows="2" /></label>
      <div class="revision-form-actions">
        <button class="app-secondary" @click="showForm = false"><X :size="14" /> Batal</button>
        <button class="app-primary" @click="submitForm">Simpan</button>
      </div>
    </div>
    <p v-if="error" class="form-error">{{ error }}</p>

    <div v-if="!entries.length" class="matrix-empty">Belum ada catatan bimbingan.</div>
    <article v-for="item in buildTimeline(entries)" :key="item.entry.id" class="bimbingan-entry">
      <div class="bimbingan-head"><b>{{ new Date(item.entry.meetingDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) }}</b><small>{{ item.entry.supervisor }}</small></div>
      <p>{{ item.entry.agenda }}</p>
      <ul v-if="item.entry.decisions.length">
        <li v-for="(decision, index) in item.entry.decisions" :key="index">{{ decision }}</li>
      </ul>
      <div v-if="item.entry.nextMeetingTargets.length" class="bimbingan-targets">
        <span>TARGET BERIKUTNYA · {{ item.pendingTargets }}/{{ item.totalTargets }}</span>
        <label v-for="target in item.entry.nextMeetingTargets" :key="target.id">
          <input type="checkbox" :checked="target.done" @change="toggle(item.entry, target.id)">
          <span :class="{ done: target.done }">{{ target.text }}</span>
        </label>
      </div>
    </article>
  </section>
</template>

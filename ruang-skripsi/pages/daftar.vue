<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check } from 'lucide-vue-next'

useHead({ title: 'Daftar — Ruang Skripsi' })
const router = useRouter()
const step = ref(1)
const form = reactive({
  name: '', email: '', password: '', university: '', program: '', degree: 'S1',
  topic: '', target: '', stage: 'Mencari topik',
})
const error = ref('')

function next() {
  error.value = ''
  if (step.value === 1 && (!form.name || !form.email.includes('@') || form.password.length < 8)) {
    error.value = 'Lengkapi nama, email valid, dan kata sandi minimal 8 karakter.'
    return
  }
  if (step.value === 2 && (!form.university || !form.program)) {
    error.value = 'Universitas dan program studi perlu diisi.'
    return
  }
  if (step.value < 3) step.value++
  else {
    localStorage.setItem('ruang-profile', JSON.stringify(form))
    localStorage.setItem('ruang-session', JSON.stringify({ email: form.email, createdAt: Date.now() }))
    router.push('/app')
  }
}
</script>

<template>
  <main class="auth-page">
    <NuxtLink to="/" class="auth-brand"><MotionLogo /><span>Ruang Skripsi</span></NuxtLink>
    <section class="auth-panel">
      <div class="auth-progress"><span v-for="n in 3" :key="n" :class="{ done: n <= step }" /></div>
      <p class="auth-step">LANGKAH {{ step }} DARI 3</p>

      <template v-if="step === 1">
        <h1>Buat ruang kerja Anda.</h1>
        <p>Data ini hanya disimpan di browser untuk prototype.</p>
        <label>Nama lengkap<input v-model="form.name" autocomplete="name" placeholder="Nama Anda"></label>
        <label>Email kampus<input v-model="form.email" type="email" autocomplete="email" placeholder="nama@kampus.ac.id"></label>
        <label>Kata sandi<input v-model="form.password" type="password" autocomplete="new-password" placeholder="Minimal 8 karakter"></label>
      </template>

      <template v-else-if="step === 2">
        <h1>Konteks akademik.</h1>
        <p>AI Lab memakai konteks ini untuk memberi jawaban yang relevan.</p>
        <label>Universitas<input v-model="form.university" placeholder="Nama universitas"></label>
        <div class="auth-grid">
          <label>Program studi<input v-model="form.program" placeholder="Program studi"></label>
          <label>Jenjang<select v-model="form.degree"><option>S1</option><option>D4</option><option>S2</option></select></label>
        </div>
        <label>Tahap skripsi<select v-model="form.stage"><option>Mencari topik</option><option>Menyusun proposal</option><option>Mengambil data</option><option>Menulis hasil</option><option>Persiapan sidang</option></select></label>
      </template>

      <template v-else>
        <h1>Apa yang sedang Anda teliti?</h1>
        <p>Topik sementara boleh berubah. Ruang Skripsi akan membuat kerangka awal.</p>
        <label>Topik atau judul sementara<textarea v-model="form.topic" rows="4" placeholder="Contoh: pengaruh ruang belajar digital terhadap konsistensi mahasiswa..." /></label>
        <label>Target selesai<input v-model="form.target" type="date"></label>
        <div class="prototype-note"><Check :size="17" /> Tidak ada pembayaran pada tahap prototype.</div>
      </template>

      <p v-if="error" class="form-error">{{ error }}</p>
      <div class="auth-actions">
        <button v-if="step > 1" class="button auth-back" @click="step--"><ArrowLeft :size="17" /> Kembali</button>
        <button class="button primary" @click="next">{{ step === 3 ? 'Masuk ke dashboard' : 'Lanjutkan' }} <ArrowRight :size="17" /></button>
      </div>
      <p v-if="step === 1" class="auth-switch">Sudah punya akun? <NuxtLink to="/masuk">Masuk</NuxtLink></p>
    </section>
  </main>
</template>
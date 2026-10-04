<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next'
useHead({ title: 'Masuk — Ruang Skripsi' })
const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')

function login() {
  if (!email.value.includes('@') || !password.value) {
    error.value = 'Masukkan email dan kata sandi.'
    return
  }
  localStorage.setItem('ruang-session', JSON.stringify({ email: email.value, loggedAt: Date.now() }))
  router.push('/app')
}
</script>

<template>
  <main class="auth-page">
    <NuxtLink to="/" class="auth-brand"><MotionLogo /><span>Ruang Skripsi</span></NuxtLink>
    <section class="auth-panel auth-panel-short">
      <p class="auth-step">SELAMAT DATANG KEMBALI</p>
      <h1>Lanjutkan tulisan Anda.</h1>
      <p>Prototype menerima akun lokal yang dibuat pada perangkat ini.</p>
      <label>Email<input v-model="email" type="email" autocomplete="email" placeholder="nama@kampus.ac.id" @keyup.enter="login"></label>
      <label>Kata sandi<input v-model="password" type="password" autocomplete="current-password" placeholder="Kata sandi" @keyup.enter="login"></label>
      <p v-if="error" class="form-error">{{ error }}</p>
      <button class="button primary auth-submit" @click="login">Masuk <ArrowRight :size="17" /></button>
      <p class="auth-switch">Belum punya akun? <NuxtLink to="/daftar">Daftar gratis</NuxtLink></p>
    </section>
  </main>
</template>
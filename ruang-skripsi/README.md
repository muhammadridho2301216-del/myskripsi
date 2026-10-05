# Ruang Skripsi — Prototype

Nuxt 3 prototype dengan dashboard skripsi, AI Lab, ruang revisi, jurnal, dan BYOK.

## Menjalankan

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
node .output/server/index.mjs
```

## Google OAuth untuk Gemini

Buat OAuth Client milik aplikasi Ruang Skripsi di Google Cloud, aktifkan Generative Language API, lalu isi environment berikut:

```bash
NUXT_PUBLIC_SITE_URL=https://domain-anda.example
NUXT_GOOGLE_OAUTH_CLIENT_ID=...
NUXT_GOOGLE_OAUTH_CLIENT_SECRET=...
NUXT_GOOGLE_OAUTH_PROJECT_ID=...
NUXT_OAUTH_SESSION_SECRET=ganti-dengan-random-secret-minimal-32-karakter
```

Authorized redirect URI:

```text
https://domain-anda.example/api/oauth/google/callback
```

Untuk Quick Tunnel, URL berubah ketika tunnel dimulai ulang. Gunakan domain/tunnel stabil untuk konfigurasi OAuth permanen.

## Koneksi AI

- OpenAI-compatible API key + model discovery
- Anthropic API key + model discovery
- Google Gemini API key atau OAuth + model discovery
- Provider kompatibel OpenAI: OpenRouter, DeepSeek, Groq, Mistral, Together, Fireworks, Cerebras, dan xAI

Kredensial pengguna tidak ditulis ke source code. Token Google disimpan di cookie HttpOnly terenkripsi; API key prototype tersimpan lokal di browser.

## Phase 2 environment

Ruang Skripsi memakai Clerk sebagai identity provider dan Appwrite sebagai application backend/control plane. Modul Clerk hanya diaktifkan ketika publishable key tersedia, sehingga build lokal tanpa kredensial tetap dapat berjalan.

```bash
NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
NUXT_CLERK_SECRET_KEY=sk_...

NUXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NUXT_PUBLIC_APPWRITE_PROJECT_ID=...
NUXT_APPWRITE_API_KEY=...
NUXT_APPWRITE_DATABASE_ID=...
```

Untuk production, API key pengguna tidak boleh disimpan di localStorage. Gunakan secret vault/envelope encryption dan simpan hanya connection reference pada Appwrite.

### Arsitektur sandbox

Appwrite Functions hanya menjadi control plane. Job terminal/build dikirim ke queue dan dikerjakan oleh VPS worker terpisah di dalam container/microVM ephemeral. Browser tidak pernah memperoleh SSH atau akses shell host.

### Appwrite persistence (Batch 6)

Writing documents, revisions, dan jurnal bimbingan dapat disimpan ke Appwrite TablesDB alih-alih localStorage.

**Status kejujuran:** adapter dan skema di bawah ini ditulis dan diuji unit (mapping JSON <-> domain object, validasi skema) tanpa membutuhkan Appwrite, tetapi **belum pernah dijalankan terhadap project Appwrite sungguhan** karena tidak ada kredensial yang tersedia saat implementasi. Jalankan skrip setup di staging dan verifikasi manual sebelum dipakai produksi.

1. Buat project Appwrite, lalu isi environment:

```bash
NUXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NUXT_PUBLIC_APPWRITE_PROJECT_ID=...
NUXT_APPWRITE_API_KEY=...
NUXT_APPWRITE_DATABASE_ID=ruang_skripsi
```

2. Jalankan skrip setup skema sekali (lihat `scripts/setupAppwriteSchema.ts` dan `domain/repository/appwriteSchema.ts` untuk detail tabel):

```bash
npx tsx scripts/setupAppwriteSchema.ts
```

3. Periksa Appwrite console: pastikan status setiap attribute/index sudah "available", bukan "processing".

**Batasan identitas saat ini:** Clerk (EPIC-19) belum terpasang, sehingga adapter Appwrite memakai *anonymous session* bawaan Appwrite sebagai `ownerId` sementara (lihat `domain/repository/appwriteClient.ts`). Sesi ini hanya hidup di cookie browser — hilang jika cookie dibersihkan atau pindah perangkat. Jangan andalkan ini untuk data yang harus bertahan lintas device sebelum Clerk terpasang.

Untuk mengaktifkan adapter Appwrite di UI, ganti pemanggilan `createRepositories()` menjadi `createRepositories({ backend: 'auto', databaseId })` (lihat `composables/useRepositories.ts`) setelah langkah di atas selesai dan diverifikasi manual.

### Model registry

Endpoint katalog internal:

```text
GET /api/meta/ai-catalog
```

Provider predefined memakai endpoint server registry. Hanya provider `custom` yang menerima custom HTTPS base URL. Hostname di-resolve dan private/link-local/metadata address diblokir untuk mengurangi SSRF.

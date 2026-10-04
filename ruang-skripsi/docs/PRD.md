# PRD — Ruang Skripsi

**Versi:** 1.0  
**Status:** Draft untuk implementasi Phase 2  
**Pemilik produk:** Ruang Skripsi  
**Platform:** Web application  
**Dokumen terkait:** [PERENCANAAN.md](./PERENCANAAN.md) · [TASKS.md](./TASKS.md) · [RUANG-SKRIPSI-PRODUCT-BRIEF-V2.md](./RUANG-SKRIPSI-PRODUCT-BRIEF-V2.md)

---

## 1. Ringkasan

Ruang Skripsi adalah research workspace berbantuan AI yang membantu mahasiswa mengubah sumber ilmiah menjadi pemahaman, pemahaman menjadi kerangka, dan kerangka menjadi proses penulisan skripsi yang terukur.

Produk menggabungkan:

1. AI Journal Finder berbasis search tools.
2. Source library dan deduplikasi referensi.
3. Research matrix dan sintesis literatur.
4. Evidence-to-Outline Graph.
5. Outline builder yang menyesuaikan jenis penelitian.
6. Target, progres, revisi, dan jurnal bimbingan.
7. Consistency engine antarbab.
8. Draft dan Final Blueprint DOCX export.
9. BYOK multi-provider dan OAuth resmi.
10. Model discovery serta capability-aware configuration.
11. Sandbox dan tool execution untuk paket berbayar.

---

## 2. Latar Belakang

Mahasiswa sering menggunakan banyak aplikasi yang tidak saling terhubung untuk mencari jurnal, menyimpan PDF, menulis catatan, membuat kerangka, mencatat revisi, menggunakan AI, dan menyiapkan dokumen akhir.

Akibatnya:

- Konteks penelitian terpecah.
- Referensi dikumpulkan tetapi tidak disintesis.
- Kerangka tidak terhubung dengan bukti.
- Rumusan masalah, tujuan, metode, dan kesimpulan tidak konsisten.
- AI menghasilkan jawaban generik dan sulit diverifikasi.
- Pengguna terkunci pada satu provider AI.
- Kemampuan model seperti thinking dan tool calling sering dikonfigurasi secara salah.

Ruang Skripsi menyatukan proses tersebut ke dalam satu research pipeline yang dapat ditelusuri.

---

## 3. Visi

Menjadi workspace penelitian yang membantu mahasiswa menyusun skripsi secara terstruktur, berbasis bukti, dapat diverifikasi, dan tetap berada di bawah kendali pengguna.

---

## 4. Prinsip Produk

1. **Evidence before generation** — AI harus mencari dan memahami bukti sebelum menyarankan klaim.
2. **User remains the author** — AI membantu berpikir, bukan mengambil alih tanggung jawab akademik.
3. **Traceable output** — klaim dan sintesis dapat ditelusuri ke sumber.
4. **No fake certainty** — informasi yang belum diverifikasi harus ditandai.
5. **Provider freedom** — pengguna dapat memilih model dan provider.
6. **Capability-aware UI** — kontrol hanya muncul jika didukung model.
7. **Secure by default** — secret, custom endpoint, OAuth, dan sandbox diperlakukan sebagai area berisiko tinggi.
8. **Progressive complexity** — pengguna baru mendapat pengalaman sederhana; kontrol lanjutan tersedia saat dibutuhkan.
9. **Graceful degradation** — fitur inti tetap dapat digunakan ketika provider atau search tool gagal.
10. **Transparent limitations** — produk menjelaskan batas pencarian, ringkasan, sitasi, dan pemeriksaan kemiripan.

---

## 5. Persona

### 5.1 Mahasiswa tahap awal

Kebutuhan:

- Menentukan topik.
- Menemukan sumber awal.
- Membentuk rumusan masalah.
- Memahami struktur skripsi.

### 5.2 Mahasiswa tahap penulisan

Kebutuhan:

- Menjaga struktur dan konsistensi.
- Menemukan referensi untuk subbab tertentu.
- Mengelola target dan revisi.
- Mendapat bantuan AI yang memahami konteks proyek.

### 5.3 Mahasiswa tahap akhir

Kebutuhan:

- Memastikan tujuan telah dijawab.
- Memeriksa kesimpulan dan konsistensi.
- Menyiapkan dokumen dan materi sidang.
- Menyelesaikan revisi dengan cepat.

### 5.4 Pengguna teknis/berbayar

Kebutuhan:

- Memilih provider dan model sendiri.
- Menggunakan custom endpoint.
- Menjalankan tool dan terminal.
- Membuat prototype atau artifact penelitian dalam sandbox.

### 5.5 Institusi atau tim

Kebutuhan:

- Template kampus.
- Kebijakan provider.
- Role dan permission.
- Audit dan data-retention policy.

---

## 6. Jobs to Be Done

- Ketika memulai skripsi, saya ingin memahami peta penelitian agar dapat memilih masalah yang layak.
- Ketika mencari jurnal, saya ingin mendapat sumber yang relevan beserta link aslinya agar dapat memverifikasi sendiri.
- Ketika membaca banyak sumber, saya ingin melihat persamaan, perbedaan, dan gap agar tidak kehilangan arah.
- Ketika menyusun kerangka, saya ingin setiap bagian mempunyai tujuan, sumber, dan target yang jelas.
- Ketika menulis, saya ingin mengetahui bagian yang tidak konsisten atau tidak memiliki bukti.
- Ketika menerima revisi, saya ingin mengubahnya menjadi tindakan yang dapat dilacak.
- Ketika menggunakan AI, saya ingin memilih provider dan model sesuai kebutuhan serta anggaran.
- Ketika menggunakan model reasoning, saya ingin kontrol thinking sesuai kemampuan model sebenarnya.
- Ketika membangun prototype, saya ingin agent bekerja di lingkungan terisolasi tanpa membahayakan VPS utama.

---

## 7. Ruang Lingkup

### 7.1 In scope

- Authentication dan onboarding.
- Thesis project workspace.
- Journal finder berbasis AI search tools.
- Source library dan source verification state.
- Deduplikasi sumber.
- Research matrix.
- Literature synthesis.
- Evidence/claim mapping.
- Research gap assistant.
- Outline builder.
- Writing targets.
- Revision management.
- Journal/bimbingan log.
- Consistency checking.
- DOCX export.
- BYOK multi-provider.
- OAuth resmi yang didukung provider.
- Custom base URL.
- Model discovery.
- Capability registry.
- Model routing.
- Subscription dan entitlement.
- Tool registry.
- Isolated sandbox untuk paket berbayar.
- Artifact generation dan download.
- Usage, quota, audit, dan monitoring.

### 7.2 Out of scope awal

- Scraping jurnal massal.
- Bypass paywall.
- Menyimpan full text tanpa hak.
- Klaim plagiarism score resmi.
- Auto-submit ke sistem kampus.
- Kolaborasi realtime setara Google Docs.
- Native mobile application.
- Marketplace publik.
- Integrasi OAuth tidak resmi atau reverse-engineered.
- Terminal pada host VPS utama.
- Unlimited sandbox execution.

---

## 8. User Journey Utama

```text
Daftar
→ Buat proyek
→ Lengkapi konteks penelitian
→ Cari dan simpan sumber
→ Bangun research matrix
→ Buat sintesis
→ Rumuskan gap
→ Buat kerangka
→ Tentukan target
→ Tulis dan revisi
→ Periksa konsistensi
→ Export DOCX
```

Journey pengguna Pro:

```text
Hubungkan provider
→ Pilih model
→ Aktifkan tools
→ Buat sandbox job
→ Review rencana agent
→ Jalankan
→ Preview artifact
→ Download source/output
```

---

# 9. Functional Requirements

## FR-01 — Account dan onboarding

Sistem harus memungkinkan pengguna:

- Membuat akun dan login.
- Memilih tahap skripsi.
- Membuat proyek pertama.
- Memasukkan judul, topik, program studi, metode, dan target sidang.
- Melewati field yang belum diketahui.
- Melanjutkan onboarding yang belum selesai.

**Acceptance criteria:**

- Progres onboarding tersimpan.
- Pengguna tidak kehilangan data jika halaman direfresh.
- Dashboard baru memiliki empty state yang dapat ditindaklanjuti.

## FR-02 — Thesis project

Sistem harus mendukung:

- Informasi proyek.
- Status proyek.
- Tahapan penelitian.
- Milestone.
- Progres per bab.
- Satu proyek aktif untuk MVP; model data tidak boleh menghalangi multi-project.

## FR-03 — AI Journal Finder

Sistem harus:

- Menerima research context dan filter pencarian.
- Menyusun query pencarian.
- Memanggil search tool.
- Menampilkan link sumber asli.
- Menampilkan tingkat relevansi dan alasan.
- Menampilkan evidence level.
- Memungkinkan pengguna menyimpan atau menolak hasil.

**Dilarang:**

- Mengklaim membaca full text ketika hanya membaca metadata/abstrak.
- Menghasilkan DOI palsu.
- Melewati paywall.

## FR-04 — Source verification dan deduplikasi

Sistem harus:

- Menormalisasi DOI dan canonical URL.
- Menggabungkan access route dari karya yang sama.
- Menampilkan potensi duplikat sebelum merge.
- Menyimpan metadata provenance.
- Memungkinkan koreksi manual.

## FR-05 — Research matrix

Pengguna harus dapat:

- Membuat matriks dari sumber terpilih.
- Melihat tujuan, metode, sampel, variabel, instrumen, temuan, dan keterbatasan.
- Mengedit nilai hasil ekstraksi.
- Menandai nilai terverifikasi.
- Mengekspor matriks.

## FR-06 — Literature synthesis

Sistem harus:

- Menghasilkan sintesis lintas sumber.
- Menghubungkan klaim dengan sumber pendukung.
- Menampilkan konflik antarsumber.
- Membedakan fakta sumber dan interpretasi AI.
- Tidak menyebut hasil sintesis sebagai jurnal baru.

## FR-07 — Evidence map dan claim ledger

Pengguna harus dapat melihat hubungan:

- Sumber.
- Evidence.
- Klaim.
- Tema.
- Gap.
- Rumusan masalah.
- Tujuan.
- Outline node.

Klaim tanpa dukungan harus diberi status “belum didukung”.

## FR-08 — Outline builder

Sistem harus:

- Menyesuaikan struktur dengan jenis penelitian.
- Mendukung bab, subbab, dan sub-subbab.
- Menyimpan tujuan, pertanyaan, kebutuhan bukti, target kata, deadline, dan status.
- Mendukung drag-and-drop/reorder yang aman.
- Memperingatkan nomor atau struktur yang tidak konsisten.

## FR-09 — Readiness dan consistency checking

Sistem harus memeriksa:

- Kelengkapan struktur.
- Koneksi rumusan masalah dan tujuan.
- Koneksi tujuan dan metode.
- Konsistensi variabel dan istilah.
- Klaim tanpa sumber.
- Subbab atau gagasan berulang.
- Kesiapan export.

Skor bersifat bantuan, bukan penilaian akademik absolut.

## FR-10 — Writing workspace

Sistem harus menyediakan:

- Editor per outline node.
- Autosave.
- Word count.
- Draft state.
- AI actions pada teks terpilih.
- Undo setelah penerapan saran AI.
- Daftar referensi terkait.
- Riwayat perubahan minimum.

## FR-11 — Revisi dan bimbingan

Sistem harus mendukung:

- Revisi berdasarkan pertemuan.
- Pembimbing/sumber revisi.
- Prioritas dan deadline.
- Relasi ke bab/subbab.
- Status workflow.
- Catatan sebelum/sesudah.
- Agenda bimbingan berikutnya.

## FR-12 — DOCX export

Sistem harus menyediakan:

- Draft export kapan saja.
- Final Blueprint export setelah readiness gate.
- Template formatting.
- Outline, brief, target, checklist, sumber, dan daftar pustaka sementara.
- Peringatan untuk data yang belum terverifikasi.

## FR-13 — Provider connection

Sistem harus mendukung:

- API key.
- OAuth resmi.
- Custom base URL.
- Header/auth adapter yang disetujui.
- Test connection.
- Disconnect/revoke.
- Masked credential status.

Secret tidak boleh dikembalikan ke frontend.

## FR-14 — Model discovery

Sistem harus mendukung:

- `GET /v1/models`.
- Endpoint native provider.
- Cloud deployment listing.
- Curated catalog.
- Manual model ID.
- Discovery refresh.

## FR-15 — Model capability registry

Capability minimum:

- Text, image, audio, dan file input.
- Streaming.
- Tool calling.
- Parallel tools.
- Structured output/JSON.
- Citation support.
- Context dan output limits.
- Thinking/reasoning mode.

Thinking mode:

- Unsupported.
- Fixed.
- Toggle.
- Levels.
- Token budget.
- Provider-native.

UI hanya boleh mengirim parameter yang didukung.

## FR-16 — Model routing

Pengguna dapat memilih model:

- Default.
- Search/planning.
- Synthesis.
- Quick actions.
- Coding.
- Vision/file analysis.
- Fallback.

Model yang benar-benar digunakan harus ditampilkan.

## FR-17 — Subscription dan entitlement

Sistem harus memiliki paket:

### Free

- AI workspace.
- BYOK.
- Journal finder dengan quota.
- Synthesis dan outline.
- Tanpa dedicated sandbox/terminal.

### Pro

- Semua fitur Free.
- Isolated sandbox.
- Terminal dan file tools.
- Prototype builder.
- Artifact generation.
- Quota compute lebih besar.

### Team/Institution

- Role dan permission.
- Central billing.
- Provider policy.
- Audit.
- Template institusi.

Entitlement divalidasi di server.

## FR-18 — Tool registry

Tool availability harus dihitung berdasarkan:

- Subscription.
- Workspace permission.
- Model capability.
- Connection availability.
- Risk policy.
- Quota.

## FR-19 — Sandbox

Sandbox harus:

- Terisolasi dari host.
- Berjalan sebagai non-root.
- Memiliki CPU, RAM, disk, process, dan time limit.
- Menggunakan ephemeral workspace.
- Memiliki egress policy.
- Membersihkan data setelah retention period.
- Tidak memperoleh secret secara otomatis.

## FR-20 — Agent execution

Agent dapat:

- Membuat rencana.
- Meminta persetujuan untuk tindakan berisiko.
- Menjalankan tool yang diizinkan.
- Membuat artifact.
- Menjalankan validasi.
- Mengembalikan log ringkas dan hasil.

## FR-21 — Usage dan quota

Sistem harus mencatat:

- Token/request AI jika tersedia.
- Search usage.
- Sandbox CPU seconds.
- Storage.
- Job duration.
- Artifact retention.
- Concurrent jobs.

Pengguna harus melihat quota dan alasan job dihentikan.

---

# 10. Non-Functional Requirements

## NFR-01 — Security

- HTTPS.
- Secret encryption.
- CSRF dan OAuth state validation.
- PKCE bila didukung.
- SSRF prevention.
- File validation.
- Server-side entitlement.
- Sandbox isolation.
- Rate limiting.
- Audit log.
- Data deletion.

## NFR-02 — Performance

Target awal:

- LCP < 2,5 detik pada halaman utama.
- CLS < 0,1.
- Lazy loading untuk editor dan visual graph.
- Pagination/virtualization untuk daftar sumber besar.
- Search feedback awal < 2 detik; proses panjang menggunakan progress state.

## NFR-03 — Accessibility

- WCAG 2.1 AA sebagai target.
- Keyboard navigation.
- Focus state.
- Semantic labels.
- Kontras memadai.
- Reduced motion.
- Error tidak hanya memakai warna.

## NFR-04 — Reliability

- Retry terbatas.
- Idempotency untuk job.
- Circuit breaker provider.
- Queue dan heartbeat sandbox.
- Graceful degradation.
- Backup dan restore teruji.

## NFR-05 — Observability

- Structured logs.
- Correlation ID.
- Provider latency/error rate.
- Search success rate.
- Sandbox startup/job success.
- Secret redaction.
- Prompt/content sensitif tidak dicatat secara default.

## NFR-06 — Privacy

- Data minimization.
- Retention policy.
- Export dan delete account.
- Kejelasan data yang dikirim ke provider eksternal.
- Persetujuan sebelum pengiriman file sensitif.

---

## 11. Provider Prioritas

### Launch tier

1. OpenAI.
2. Anthropic.
3. Google Gemini.
4. OpenRouter.
5. Custom OpenAI-compatible.
6. Ollama/self-hosted pada deployment yang diizinkan.

### Following tier

- Azure OpenAI.
- Vertex AI.
- Amazon Bedrock.
- Groq.
- DeepSeek.
- Mistral.
- xAI.
- Together.
- Fireworks.
- Cerebras.
- Cohere.
- Perplexity.

OAuth OpenAI/Codex hanya dimasukkan jika tersedia flow resmi yang diizinkan untuk aplikasi pihak ketiga.

---

## 12. Success Metrics

### Activation

- Persentase pengguna membuat proyek pertama.
- Persentase pengguna menyimpan minimal tiga sumber.
- Persentase pengguna membuat kerangka pertama.

### Research quality proxy

- Sumber dengan DOI/canonical URL terverifikasi.
- Klaim sintesis dengan source trace.
- Duplikat sumber yang berhasil dicegah.
- Warning konsistensi yang diselesaikan.

### Engagement

- Weekly active thesis projects.
- Revisi selesai per pengguna.
- Target selesai tepat waktu.
- Retention selama proses skripsi.

### AI infrastructure

- Provider connection success.
- Model discovery success.
- Tool call success.
- Sandbox job success.
- Median sandbox startup.

---

## 13. Risiko Utama

| Risiko | Dampak | Mitigasi |
|---|---|---|
| AI membuat referensi palsu | Tinggi | Search-result grounding, DOI validation, provenance |
| Ringkasan melebihi bukti | Tinggi | Evidence-level label dan refusal |
| Secret bocor | Kritis | Vault, redaction, no client readback |
| Custom URL menjadi SSRF | Kritis | Network policy dan URL validation |
| Sandbox escape | Kritis | MicroVM/container hardening, no privileged mode |
| Biaya compute melonjak | Tinggi | Quota, timeout, concurrency limit |
| OAuth tidak resmi | Tinggi | Official flow only |
| Pengguna menganggap AI sebagai penulis | Tinggi | UX, disclosure, review workflow |
| Struktur tidak cocok lintas jurusan | Sedang | Template dan research-type adapters |

---

## 14. Release Criteria

MVP production belum boleh dirilis apabila:

- Secret masih disimpan permanen di localStorage.
- Custom base URL belum mempunyai mitigasi SSRF.
- Model parameters dikirim tanpa capability validation.
- Journal finder dapat menghasilkan sumber tanpa link yang dapat diverifikasi.
- Sandbox berjalan di host utama tanpa isolasi.
- Entitlement hanya diperiksa di frontend.
- Delete/export data belum tersedia.
- Monitoring error kritis belum tersedia.

---

## 15. Open Questions

- Apakah managed AI credit tersedia selain BYOK?
- Search provider default dan fallback?
- Batas quota Free?
- Container atau microVM pada rilis Pro pertama?
- Lama artifact retention?
- Model multi-project pada MVP atau setelah rilis?
- Template kampus dibuat admin atau pengguna?
- Citation formatter dibangun sendiri atau menggunakan library?
- Apakah institusi membutuhkan self-hosted deployment?

---

# 16. Addendum — Identity, Admission, Offers, Appwrite, dan Managed AI

## 16.1 Clerk dan admission mahasiswa

Clerk menjadi source of truth autentikasi, tetapi login berhasil tidak otomatis meloloskan admission. Jalur masuk: email kampus terdaftar, Google Workspace kampus, Gmail publik dengan verifikasi lanjutan, serta SSO OIDC/SAML resmi. Domain `.edu` saja tidak cukup; Campus Registry mendukung `.ac.id`, subdomain mahasiswa, dan domain institusi resmi.

Status: `PENDING_EMAIL`, `PENDING_STUDENT_VERIFICATION`, `VERIFIED_STUDENT`, `VERIFIED_INSTITUTION`, `REJECTED`, `SUSPENDED`, dan `ALUMNI`.

Aturan P0:

- Gmail publik tetap pending sampai KTM/SIAKAD/SSO terverifikasi.
- Disposable email diblokir.
- Satu NIM hanya terhubung ke satu identitas mahasiswa aktif.
- Akun pending/suspended tidak dapat melewati middleware endpoint terlindungi.
- Clerk ID disimpan sebagai `clerkUserId` pada profil aplikasi.

## 16.2 Campus Registry dan verifikasi

Campus Registry menyimpan nama resmi, domain mahasiswa/staf, pola subdomain, metode verifikasi, metadata SSO, status kerja sama, dan trust level. Urutan verifikasi: domain kampus → SSO resmi → API resmi SIAKAD → KTM dengan OCR/manual review. Sistem tidak menyimpan password SIAKAD atau scraping portal memakai kredensial mahasiswa. Gambar KTM memiliki retention terbatas.

## 16.3 Offer dan notification engine

Promo menggunakan `EligibilityRule → Offer → Grant`, bukan kondisi hard-coded. Contoh: pengguna baru + mahasiswa terverifikasi + belum pernah trial + risk score aman → Pro Trial 14 hari dan sandbox credit terbatas.

Event: account/student verification, onboarding, offer lifecycle, trial/quota warning, provider disconnect, payment, sandbox completion, revisi, dan deadline. Channel: in-app, email, lalu push. Setiap delivery memiliki status dan retry policy.

## 16.4 Hipotesis harga

- Free Rp0: BYOK, managed trial kecil, tanpa sandbox.
- Student Pro Rp29.000–39.000/bulan: managed AI credits dan 30–60 sandbox minutes.
- Semester Rp149.000–199.000/6 bulan: quota diperbarui bulanan.
- Builder Rp79.000–129.000/bulan: research/builder credits dan sandbox lebih besar.
- Institution: seat/volume, SSO, template, audit, dan policy.

Tidak ada unlimited. Target variable cost: AI 15–25%, search 5–10%, sandbox 15–25%, total idealnya <40% revenue.

## 16.5 Appwrite decision

- Sites: Nuxt frontend/SSR.
- Functions: BFF, Clerk JWT verification, webhook, orchestration, export, dan job submission.
- Database: seluruh domain data dan metadata job.
- Storage: upload, export, dan artifact.
- Messaging: notification delivery.
- VPS worker terpisah: sandbox execution plane.

Browser tidak menerima Appwrite Server API key. BFF memakai Server SDK dan menerapkan ownership berdasarkan `clerkUserId`.

## 16.6 Managed AI dan search

UX menampilkan `Ruang Auto`, `Cepat`, dan `Mendalam`; backend multi-model memakai alias `ruang-fast`, `ruang-research`, dan `ruang-builder`. Paket menjanjikan quality tier, bukan nama model. Mapping dapat diganti dari registry.

Default research pipeline: Exa Instant → deduplikasi metadata → ranking dengan fast model → fetch contents top-N → synthesis dengan research model. OpenRouter dipakai untuk eksperimen/fallback; primary model dipindahkan ke direct provider saat volume stabil. Premium model hanya untuk escalation.

Kandidat awal harus dibenchmark, bukan langsung dipercaya: model murah sekelas OpenAI Luna untuk default, DeepSeek/Together untuk data publik non-PII, dan model sekelas OpenAI Sol/Claude Sonnet untuk pekerjaan sulit. Provider policy menentukan data class yang boleh dikirim.

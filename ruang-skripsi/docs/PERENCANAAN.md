# PERENCANAAN IMPLEMENTASI — Ruang Skripsi

**Versi:** 1.0  
**Sumber kebutuhan:** [PRD.md](./PRD.md)  
**Daftar eksekusi:** [TASKS.md](./TASKS.md)

---

## 1. Tujuan Dokumen

Dokumen ini menjelaskan cara mengubah prototype Ruang Skripsi menjadi aplikasi production secara bertahap. Dokumen berfokus pada arsitektur, urutan pembangunan, batas milestone, dependency, quality gate, deployment, dan strategi risiko.

---

## 2. Strategi Implementasi

Pembangunan dilakukan menggunakan vertical slices. Setiap milestone harus menghasilkan alur yang dapat digunakan dan diuji, bukan sekadar kumpulan komponen terpisah.

Urutan utama:

```text
Foundation
→ Core thesis workspace
→ Research discovery
→ Evidence dan outline
→ Writing/revision
→ BYOK production
→ Subscription
→ Paid sandbox
→ Hardening dan launch
```

### Aturan pengerjaan

1. Kontrak data ditentukan sebelum UI kompleks.
2. UI harus mencakup loading, empty, error, disabled, dan success state.
3. Secret dan entitlement selalu ditangani server-side.
4. Provider-specific behavior berada di adapter, bukan tersebar di UI.
5. Kemampuan model berasal dari capability registry.
6. Sandbox tidak boleh menjadi bagian dari process aplikasi utama.
7. Fitur AI harus memiliki provenance dan audit minimum.
8. Setiap milestone mempunyai release gate.

---

## 3. Arsitektur Tingkat Tinggi

```text
Web Client (Nuxt)
    │
    ▼
Application API / BFF
    ├── Auth & User
    ├── Thesis Workspace
    ├── Research Service
    ├── AI Gateway
    ├── Export Service
    ├── Billing & Entitlement
    └── Sandbox Orchestrator
           │
           ▼
       Job Queue
           │
           ▼
   Isolated Sandbox Runners
```

### Penyimpanan

- PostgreSQL: data transaksional.
- Object storage: upload, artifact, dan export.
- Redis: cache, rate limit, session, dan queue support.
- Secret vault/KMS: API key, refresh token, dan connection secret.
- Search/vector storage opsional: indexing sumber milik pengguna, bukan crawling publik massal.

---

## 4. Struktur Frontend

```text
app/
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
├── features/
│   ├── auth/
│   ├── onboarding/
│   ├── thesis/
│   ├── research/
│   ├── sources/
│   ├── evidence/
│   ├── outline/
│   ├── writing/
│   ├── revisions/
│   ├── ai-connections/
│   ├── subscriptions/
│   └── sandbox/
├── composables/
├── services/
├── stores/
├── schemas/
├── types/
└── pages/
```

### Frontend standards

- TypeScript strict.
- Runtime schema validation.
- Typed API client.
- Central error mapping.
- Server-side session.
- Feature-based state.
- Story/component states untuk design-system components.
- E2E selectors yang stabil.

---

## 5. Backend Boundaries

### 5.1 Identity Service

- User.
- Session.
- OAuth login aplikasi.
- Account lifecycle.

### 5.2 Thesis Service

- Project.
- Chapter/outline.
- Writing target.
- Revision.
- Journal/bimbingan.

### 5.3 Research Service

- Search request.
- Source.
- Source route.
- Metadata provenance.
- Research matrix.
- Evidence dan claim.
- Synthesis.

### 5.4 AI Gateway

- Provider connection.
- Model discovery.
- Capability resolution.
- Request normalization.
- Streaming.
- Tool-call mediation.
- Usage collection.

### 5.5 Export Service

- DOCX rendering.
- Template handling.
- Artifact storage.
- Download URL.

### 5.6 Billing & Entitlement

- Plan.
- Subscription.
- Feature flag.
- Usage quota.
- Server-side authorization.

### 5.7 Sandbox Orchestrator

- Job request.
- Policy validation.
- Queue.
- Runner allocation.
- Log/event stream.
- Cleanup.

Pada tahap awal, boundaries dapat berada dalam modular monolith. Sandbox runner tetap harus dipisahkan dari aplikasi utama.

---

## 6. Provider Adapter Architecture

```ts
interface AIProviderAdapter {
  validateConnection(input: ConnectionInput): Promise<ConnectionResult>
  listModels(connectionId: string): Promise<Model[]>
  stream(request: NormalizedAIRequest): AsyncIterable<AIEvent>
  cancel(requestId: string): Promise<void>
  normalizeUsage(raw: unknown): UsageRecord | null
}
```

Adapter awal:

1. OpenAI.
2. Anthropic.
3. Gemini.
4. OpenRouter.
5. OpenAI-compatible.

### Capability resolution

Urutan resolusi:

1. Provider-supplied metadata.
2. Curated registry.
3. Safe probe result.
4. Administrator override.
5. Connection-specific override.
6. Conservative default.

Unknown capability tidak dianggap supported.

---

## 7. Search dan Research Pipeline

```text
Research context
→ Query planner
→ Search adapter
→ Candidate normalization
→ Metadata verification
→ Deduplication
→ AI relevance ranking
→ User selection
→ Source library
→ Matrix extraction
→ Synthesis
→ Evidence mapping
```

### Search adapter

Satu interface memungkinkan pergantian Exa atau web-search provider tanpa mengubah domain logic.

### Data yang disimpan

- Query.
- Timestamp.
- Search provider.
- Result URL.
- Canonical URL.
- Metadata.
- Evidence level.
- Retrieval status.
- User decision.

Tidak menyimpan full text publik kecuali diizinkan. File pengguna disimpan berdasarkan kebijakan upload dan retention.

---

## 8. Sandbox Architecture

### Rekomendasi awal

- API utama mengirim job ke queue.
- Runner mengambil job.
- Runner membuat container/microVM baru.
- Workspace dipasang pada volume sementara.
- Event dikirim ke orchestrator.
- Artifact dipindahkan ke object storage.
- Environment dihancurkan setelah selesai.

### Tahapan keamanan

1. Container non-root untuk internal alpha.
2. Hardened container + seccomp/AppArmor untuk beta.
3. MicroVM untuk workload publik berisiko tinggi bila biaya memungkinkan.

### Larangan

- Docker socket ke sandbox.
- Privileged container.
- Host filesystem mount.
- Secret global.
- Unlimited internet.
- Perintah tanpa timeout.

---

## 9. Rencana Milestone

## M0 — Discovery dan keputusan teknis

**Tujuan:** Mengunci keputusan yang memengaruhi seluruh implementasi.

Output:

- PRD disetujui.
- User flow.
- ERD.
- API conventions.
- Threat model.
- Provider launch list.
- Search provider decision.
- Sandbox feasibility spike.

Exit criteria:

- Tidak ada keputusan kritis tanpa owner.
- Risiko keamanan utama memiliki mitigasi.

## M1 — Production foundation

**Tujuan:** Menyiapkan fondasi aplikasi.

Output:

- Repository standards.
- Environment strategy.
- Database dan migration.
- Authentication.
- Session.
- App shell.
- Design tokens/components.
- Logging dan error tracking.
- CI/CD dasar.

Exit criteria:

- Staging deploy otomatis.
- User dapat login dan logout.
- Migration dapat rollback.
- Error dapat ditelusuri dengan correlation ID.

## M2 — Thesis workspace

**Tujuan:** Pengguna dapat membuat dan mengelola proyek skripsi.

Output:

- Onboarding.
- Project settings.
- Dashboard.
- Milestone.
- Chapter skeleton.
- Revision dan journal log dasar.

Exit criteria:

- Alur onboarding hingga dashboard lolos E2E.
- Autosave dan error state diuji.

## M3 — Research discovery

**Tujuan:** Pengguna dapat menemukan, memverifikasi, dan menyimpan sumber.

Output:

- Search adapter.
- AI query planner.
- Search UI.
- Source cards.
- Provenance labels.
- Source library.
- Deduplikasi.

Exit criteria:

- Link sumber asli tersedia.
- Tidak ada DOI hasil fabrikasi pada fixture/QA.
- Duplikat umum dikenali.
- Search timeout dapat dipulihkan.

## M4 — Evidence dan synthesis

**Tujuan:** Sumber berubah menjadi pemahaman terstruktur.

Output:

- Research matrix.
- Claim ledger.
- Synthesis.
- Conflict detection dasar.
- Research gap assistant.
- Source trace.

Exit criteria:

- Klaim sintesis mempunyai source reference.
- Nilai yang tidak diketahui tidak diisi secara spekulatif.

## M5 — Outline dan writing

**Tujuan:** Pengguna membangun kerangka dan mengerjakan isinya.

Output:

- Outline templates.
- Outline tree.
- Brief per node.
- Targets.
- Writing editor.
- AI actions.
- Consistency checks.
- Draft DOCX.

Exit criteria:

- Struktur tersimpan dan dapat direorder.
- Draft export konsisten dengan data.
- Readiness warning dapat dijelaskan.

## M6 — BYOK production

**Tujuan:** Koneksi provider aman dan capability-aware.

Output:

- Secret vault.
- Provider adapters.
- Connection wizard.
- Model discovery.
- Capability registry.
- Thinking controls.
- Model routing.
- OAuth Google.
- Custom endpoint security.

Exit criteria:

- Secret tidak dapat dibaca kembali.
- SSRF tests lulus.
- Unsupported thinking parameter tidak terkirim.
- Provider error dimapping dengan benar.

## M7 — Subscription dan entitlement

**Tujuan:** Membatasi fitur dan compute berdasarkan paket.

Output:

- Plans.
- Subscription state.
- Server-side entitlements.
- Usage ledger.
- Quotas.
- Upgrade flow.

Exit criteria:

- Free user tidak dapat memanggil endpoint sandbox.
- Quota race condition diuji.

## M8 — Paid sandbox

**Tujuan:** Pengguna Pro dapat menjalankan tool secara terisolasi.

Output:

- Queue.
- Orchestrator.
- Runner.
- Terminal/file tools.
- Artifact pipeline.
- Preview flow.
- Cleanup.
- Compute metering.

Exit criteria:

- Tidak ada akses host.
- Resource limit teruji.
- Sandbox dihancurkan setelah job.
- Artifact dapat diunduh.

## M9 — Hardening dan launch

**Tujuan:** Menyiapkan beta/production release.

Output:

- Accessibility audit.
- Performance tuning.
- Security review.
- Backup/restore drill.
- Load test.
- Incident runbook.
- Privacy and retention controls.

Exit criteria:

- Critical vulnerability = 0.
- Core E2E pass.
- Rollback teruji.
- Monitoring dan alert aktif.

---

## 10. Dependency Map

```text
M0
└── M1
    ├── M2
    │   └── M5
    ├── M3
    │   └── M4
    │       └── M5
    └── M6
        └── M7
            └── M8

M2 + M3 + M4 + M5 + M6 + M7 + M8
└── M9
```

Research flow dapat dibangun paralel dengan BYOK setelah foundation stabil. Sandbox dimulai dengan feasibility spike lebih awal, tetapi implementasi production dilakukan setelah entitlement.

---

## 11. Environment

### Local

- Mock search/provider.
- Local database.
- Sandbox disabled atau local dev runner terbatas.

### Staging

- Kredensial terpisah.
- Synthetic data.
- Sandbox quota kecil.
- Tidak memakai data production.

### Production

- Dedicated database.
- Managed object storage.
- Secret manager.
- Isolated runner network.
- Backup dan monitoring.

---

## 12. CI/CD

Pipeline minimum:

1. Install locked dependencies.
2. Lint.
3. Typecheck.
4. Unit test.
5. Component test.
6. Build.
7. Migration validation.
8. Security/dependency scan.
9. Deploy staging.
10. Smoke E2E.
11. Manual/automated production approval.
12. Production smoke test.

Sandbox image mempunyai pipeline terpisah dengan image signing dan vulnerability scan.

---

## 13. Testing Strategy

### Unit

- Normalizer dan deduplication.
- Capability resolution.
- Thinking parameter mapping.
- Quota calculation.
- Outline readiness.
- Consistency rules.

### Integration

- Provider adapters.
- OAuth callback.
- Search adapter.
- Object storage.
- Queue dan runner.
- DOCX renderer.

### E2E

- Register → onboarding → project.
- Search → save source → matrix → synthesis.
- Synthesis → outline → draft export.
- Connect provider → discover model → chat.
- Upgrade → start sandbox → download artifact.
- Expired OAuth → reconnect.
- Quota exceeded.

### Security

- SSRF.
- OAuth state/PKCE.
- Secret leakage.
- Entitlement bypass.
- File traversal.
- Sandbox escape scenarios.
- Rate limit bypass.

---

## 14. Data Migration Strategy

Prototype data dianggap non-production sampai schema stabil.

- Gunakan versioned migration.
- Seed demo data terpisah.
- Jangan bergantung pada localStorage sebagai source of truth.
- Buat import path jika data prototype perlu dipertahankan.
- Tambahkan backup sebelum migration production.

---

## 15. Rollout

### Internal alpha

- Tim internal.
- Provider terbatas.
- Sandbox hanya akun allowlist.

### Closed beta

- Mahasiswa terpilih.
- Logging dan feedback aktif.
- Compute quota rendah.

### Public beta

- Free dan Pro.
- Feature flag untuk sandbox.
- Provider launch tier.

### General availability

- SLA internal.
- Billing stabil.
- Incident response.
- Data export/delete.
- Security review selesai.

---

## 16. Definition of Done Global

Sebuah task selesai jika:

- Acceptance criteria terpenuhi.
- Typecheck/lint/test lulus.
- Loading, empty, error, dan permission state tersedia.
- Accessibility dasar diperiksa.
- Logging tidak membocorkan secret.
- Dokumentasi diperbarui.
- Migration/rollback tersedia jika mengubah data.
- QA pada staging selesai.
- Monitoring ditambahkan untuk alur kritis.

---

# 17. Addendum Arsitektur Terpilih

## 17.1 Identity dan Appwrite bridge

```text
Clerk sign-in → Clerk JWT → Appwrite Function/BFF verifies JWT
→ Admission Service → Entitlement → Domain Service → Appwrite Database/Storage
```

Clerk menangani identity; aplikasi menangani admission, campus verification, offer, plan, dan entitlement. Appwrite Sites menjalankan Nuxt; Functions menjadi control plane; terminal/build tidak berjalan di Functions.

## 17.2 Offer dan notification flow

```text
Domain event → Eligibility evaluator → Offer → Redemption/automatic Grant
→ Entitlement materialized → Notification queued → Appwrite Messaging
```

Offer menyimpan audience, verification requirement, period, redemption limit, benefit, abuse policy, dan experiment attribution.

## 17.3 Managed AI routing

```text
Feature request → data classification → entitlement/quota → route policy
→ capability check → primary/fallback → usage ledger
```

Route mempertimbangkan feature, context, modalities, thinking, tools, latency, ceiling biaya, data class, dan provider health. Search mempunyai query/page/model/retry budget. Deep Search/Agent menjadi explicit high-credit action.

## 17.4 VPS execution plane

```text
Appwrite Function → check Pro entitlement → reserve quota → signed job
→ queue → isolated VPS runner → ephemeral container/microVM
→ validated artifact to Appwrite Storage → finalize usage
```

Tidak ada browser-to-SSH, host shell, privileged container, atau secret global. Runner memverifikasi signed job dan reservation kembali.

## 17.5 Milestone tambahan

- M1A: Clerk Nuxt SDK, JWT middleware, Appwrite BFF client, profile bootstrap.
- M2A: Campus Registry, Gmail pending flow, KTM lifecycle, risk/manual review.
- M7A: offers, grants, trial lifecycle, Messaging dispatcher, pricing experiment.
- M7B: logical model aliases, cost catalog, route policy, provider/data-class policy.

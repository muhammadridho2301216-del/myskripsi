# TASKS — Ruang Skripsi Phase 2

**Konvensi:**

- `EPIC` = scope besar/task utama.
- `TASK` = unit hasil yang jelas.
- `SUBTASK` = pekerjaan granular.
- Prioritas: `P0` wajib, `P1` penting, `P2` lanjutan.
- Status awal semua item: `TODO`.

Setiap task harus memenuhi Definition of Done pada [PERENCANAAN.md](./PERENCANAAN.md).

---

# EPIC-00 — Product Discovery & Governance

**Scope:** Mengunci keputusan produk, teknis, keamanan, dan operasional sebelum implementasi besar.  
**Milestone:** M0  
**Priority:** P0

## TASK-00.01 — Finalisasi PRD

- [ ] SUBTASK-00.01.01 Review scope in/out dengan stakeholder.
- [ ] SUBTASK-00.01.02 Tentukan owner setiap functional requirement.
- [ ] SUBTASK-00.01.03 Tetapkan provider launch tier.
- [ ] SUBTASK-00.01.04 Tetapkan search provider awal dan fallback.
- [ ] SUBTASK-00.01.05 Tetapkan kebijakan managed credit versus BYOK.
- [ ] SUBTASK-00.01.06 Tetapkan quota awal Free dan Pro.
- [ ] SUBTASK-00.01.07 Setujui definisi Draft Export dan Final Blueprint.
- [ ] SUBTASK-00.01.08 Catat keputusan pada decision log.

**Acceptance criteria:** Tidak ada pertanyaan P0 tanpa owner dan target keputusan.

## TASK-00.02 — User research

- [ ] SUBTASK-00.02.01 Rekrut mahasiswa tahap awal, tengah, dan akhir.
- [ ] SUBTASK-00.02.02 Susun interview guide.
- [ ] SUBTASK-00.02.03 Validasi workflow pencarian jurnal.
- [ ] SUBTASK-00.02.04 Validasi workflow bimbingan dan revisi.
- [ ] SUBTASK-00.02.05 Uji terminologi research matrix dan evidence map.
- [ ] SUBTASK-00.02.06 Dokumentasikan pain points.
- [ ] SUBTASK-00.02.07 Prioritaskan hasil penelitian pengguna.

## TASK-00.03 — Threat modeling

- [ ] SUBTASK-00.03.01 Petakan data sensitif.
- [ ] SUBTASK-00.03.02 Petakan trust boundary.
- [ ] SUBTASK-00.03.03 Threat model OAuth.
- [ ] SUBTASK-00.03.04 Threat model custom base URL/SSRF.
- [ ] SUBTASK-00.03.05 Threat model upload dokumen.
- [ ] SUBTASK-00.03.06 Threat model tool calling.
- [ ] SUBTASK-00.03.07 Threat model sandbox.
- [ ] SUBTASK-00.03.08 Prioritaskan mitigasi P0/P1.

---

# EPIC-01 — Engineering Foundation

**Scope:** Fondasi repository, kualitas kode, environment, data, dan deployment.  
**Milestone:** M1  
**Priority:** P0

## TASK-01.01 — Repository standards

- [ ] SUBTASK-01.01.01 Aktifkan TypeScript strict.
- [ ] SUBTASK-01.01.02 Konfigurasi lint dan formatting.
- [ ] SUBTASK-01.01.03 Tambahkan commit/branch convention.
- [ ] SUBTASK-01.01.04 Tetapkan folder architecture berbasis feature.
- [ ] SUBTASK-01.01.05 Buat environment schema validation.
- [ ] SUBTASK-01.01.06 Tambahkan pre-commit atau CI checks.
- [ ] SUBTASK-01.01.07 Dokumentasikan local setup.

## TASK-01.02 — Database foundation

- [ ] SUBTASK-01.02.01 Pilih ORM/query layer.
- [ ] SUBTASK-01.02.02 Buat PostgreSQL development environment.
- [ ] SUBTASK-01.02.03 Buat migration command.
- [ ] SUBTASK-01.02.04 Buat seed development.
- [ ] SUBTASK-01.02.05 Tambahkan migration rollback procedure.
- [ ] SUBTASK-01.02.06 Tambahkan database health check.
- [ ] SUBTASK-01.02.07 Konfigurasi connection pooling.

## TASK-01.03 — API conventions

- [ ] SUBTASK-01.03.01 Definisikan response envelope.
- [ ] SUBTASK-01.03.02 Definisikan error codes.
- [ ] SUBTASK-01.03.03 Definisikan pagination.
- [ ] SUBTASK-01.03.04 Definisikan idempotency key.
- [ ] SUBTASK-01.03.05 Definisikan request correlation ID.
- [ ] SUBTASK-01.03.06 Buat runtime validation middleware.
- [ ] SUBTASK-01.03.07 Buat typed API client frontend.

## TASK-01.04 — Authentication dan session

- [ ] SUBTASK-01.04.01 Buat user schema.
- [ ] SUBTASK-01.04.02 Implementasikan signup/login.
- [ ] SUBTASK-01.04.03 Implementasikan secure session cookie.
- [ ] SUBTASK-01.04.04 Implementasikan logout dan revoke session.
- [ ] SUBTASK-01.04.05 Implementasikan password reset bila memakai password.
- [ ] SUBTASK-01.04.06 Tambahkan brute-force protection.
- [ ] SUBTASK-01.04.07 Tambahkan session expiry UI.
- [ ] SUBTASK-01.04.08 Buat E2E authentication.

## TASK-01.05 — Observability foundation

- [ ] SUBTASK-01.05.01 Tambahkan structured logger.
- [ ] SUBTASK-01.05.02 Tambahkan correlation ID.
- [ ] SUBTASK-01.05.03 Tambahkan error tracking.
- [ ] SUBTASK-01.05.04 Buat secret redaction rules.
- [ ] SUBTASK-01.05.05 Tambahkan health/readiness endpoint.
- [ ] SUBTASK-01.05.06 Buat dashboard error dasar.

## TASK-01.06 — CI/CD

- [ ] SUBTASK-01.06.01 Buat lint job.
- [ ] SUBTASK-01.06.02 Buat typecheck job.
- [ ] SUBTASK-01.06.03 Buat unit test job.
- [ ] SUBTASK-01.06.04 Buat production build job.
- [ ] SUBTASK-01.06.05 Buat migration validation job.
- [ ] SUBTASK-01.06.06 Deploy staging otomatis.
- [ ] SUBTASK-01.06.07 Tambahkan smoke test.
- [ ] SUBTASK-01.06.08 Dokumentasikan rollback.

---

# EPIC-02 — Design System & Application Shell

**Scope:** Komponen, layout, navigation, dan state visual production.  
**Milestone:** M1  
**Priority:** P0

## TASK-02.01 — Design tokens

- [ ] SUBTASK-02.01.01 Definisikan color tokens.
- [ ] SUBTASK-02.01.02 Definisikan typography scale.
- [ ] SUBTASK-02.01.03 Definisikan spacing/radius/shadow.
- [ ] SUBTASK-02.01.04 Definisikan breakpoint.
- [ ] SUBTASK-02.01.05 Definisikan motion/reduced-motion.
- [ ] SUBTASK-02.01.06 Definisikan z-index layers.
- [ ] SUBTASK-02.01.07 Tambahkan dark-mode strategy bila masuk scope.

## TASK-02.02 — Core components

- [ ] SUBTASK-02.02.01 Button dan icon button.
- [ ] SUBTASK-02.02.02 Input dan textarea.
- [ ] SUBTASK-02.02.03 Select dan combobox.
- [ ] SUBTASK-02.02.04 Checkbox/radio/switch.
- [ ] SUBTASK-02.02.05 Modal/drawer/dropdown.
- [ ] SUBTASK-02.02.06 Tabs/tooltip/toast/alert.
- [ ] SUBTASK-02.02.07 Card/table/badge/avatar.
- [ ] SUBTASK-02.02.08 Date picker.
- [ ] SUBTASK-02.02.09 Skeleton/empty/error state.
- [ ] SUBTASK-02.02.10 Pagination.
- [ ] SUBTASK-02.02.11 Keyboard dan accessibility tests.

## TASK-02.03 — App shell

- [ ] SUBTASK-02.03.01 Sidebar desktop.
- [ ] SUBTASK-02.03.02 Mobile navigation.
- [ ] SUBTASK-02.03.03 Top bar dan breadcrumbs.
- [ ] SUBTASK-02.03.04 Workspace/project switcher.
- [ ] SUBTASK-02.03.05 Command palette.
- [ ] SUBTASK-02.03.06 Global loading/error boundary.
- [ ] SUBTASK-02.03.07 Responsive QA.

---

# EPIC-03 — Thesis Workspace

**Scope:** Onboarding, project, dashboard, milestone, dan konteks skripsi.  
**Milestone:** M2  
**Priority:** P0

## TASK-03.01 — Thesis data model

- [ ] SUBTASK-03.01.01 Buat ThesisProject schema.
- [ ] SUBTASK-03.01.02 Buat project status enum.
- [ ] SUBTASK-03.01.03 Buat research-type schema.
- [ ] SUBTASK-03.01.04 Buat milestone schema.
- [ ] SUBTASK-03.01.05 Buat project member-ready relation.
- [ ] SUBTASK-03.01.06 Buat migrations dan fixtures.

## TASK-03.02 — Onboarding

- [ ] SUBTASK-03.02.01 Buat welcome step.
- [ ] SUBTASK-03.02.02 Buat tahap skripsi step.
- [ ] SUBTASK-03.02.03 Buat project information step.
- [ ] SUBTASK-03.02.04 Buat method/research type step.
- [ ] SUBTASK-03.02.05 Buat target sidang step.
- [ ] SUBTASK-03.02.06 Buat connect-AI optional step.
- [ ] SUBTASK-03.02.07 Simpan progress setiap step.
- [ ] SUBTASK-03.02.08 Tambahkan skip/resume.
- [ ] SUBTASK-03.02.09 Buat onboarding E2E.

## TASK-03.03 — Dashboard

- [ ] SUBTASK-03.03.01 Tampilkan next action.
- [ ] SUBTASK-03.03.02 Tampilkan progress proyek.
- [ ] SUBTASK-03.03.03 Tampilkan target terdekat.
- [ ] SUBTASK-03.03.04 Tampilkan revisi terbuka.
- [ ] SUBTASK-03.03.05 Tampilkan dokumen terakhir.
- [ ] SUBTASK-03.03.06 Tampilkan aktivitas terakhir.
- [ ] SUBTASK-03.03.07 Buat empty/loading/error states.

## TASK-03.04 — Milestone dan target

- [ ] SUBTASK-03.04.01 CRUD milestone.
- [ ] SUBTASK-03.04.02 Deadline dan status.
- [ ] SUBTASK-03.04.03 Progress calculation.
- [ ] SUBTASK-03.04.04 Overdue indicator.
- [ ] SUBTASK-03.04.05 Calendar/list display.
- [ ] SUBTASK-03.04.06 Reminder-ready event model.

---

# EPIC-04 — AI Journal Finder

**Scope:** Search orchestration, hasil jurnal, provenance, dan source saving.  
**Milestone:** M3  
**Priority:** P0

## TASK-04.01 — Search adapter contract

- [ ] SUBTASK-04.01.01 Definisikan SearchProvider interface.
- [ ] SUBTASK-04.01.02 Definisikan normalized search result.
- [ ] SUBTASK-04.01.03 Implementasikan provider pertama.
- [ ] SUBTASK-04.01.04 Implementasikan timeout/retry.
- [ ] SUBTASK-04.01.05 Implementasikan rate-limit mapping.
- [ ] SUBTASK-04.01.06 Buat mock provider untuk test.

## TASK-04.02 — Query planner

- [ ] SUBTASK-04.02.01 Buat research-context input schema.
- [ ] SUBTASK-04.02.02 Buat query generation prompt.
- [ ] SUBTASK-04.02.03 Buat query count limit.
- [ ] SUBTASK-04.02.04 Buat multilingual query variants.
- [ ] SUBTASK-04.02.05 Simpan query provenance.
- [ ] SUBTASK-04.02.06 Tambahkan user edit sebelum search.

## TASK-04.03 — Result normalization

- [ ] SUBTASK-04.03.01 Normalize title.
- [ ] SUBTASK-04.03.02 Normalize author list.
- [ ] SUBTASK-04.03.03 Normalize publication year.
- [ ] SUBTASK-04.03.04 Extract/normalize DOI.
- [ ] SUBTASK-04.03.05 Determine canonical URL.
- [ ] SUBTASK-04.03.06 Classify access route.
- [ ] SUBTASK-04.03.07 Record evidence level.

## TASK-04.04 — Relevance ranking

- [ ] SUBTASK-04.04.01 Definisikan scoring dimensions.
- [ ] SUBTASK-04.04.02 Buat grounded ranking prompt.
- [ ] SUBTASK-04.04.03 Batasi ranking pada metadata tersedia.
- [ ] SUBTASK-04.04.04 Tampilkan alasan rekomendasi.
- [ ] SUBTASK-04.04.05 Tampilkan low-confidence state.

## TASK-04.05 — Search UI

- [ ] SUBTASK-04.05.01 Buat search form.
- [ ] SUBTASK-04.05.02 Buat filter tahun/bahasa/metode.
- [ ] SUBTASK-04.05.03 Buat query preview.
- [ ] SUBTASK-04.05.04 Buat streaming/progress state.
- [ ] SUBTASK-04.05.05 Buat source result card.
- [ ] SUBTASK-04.05.06 Buat save/reject actions.
- [ ] SUBTASK-04.05.07 Buat retry partial failure.
- [ ] SUBTASK-04.05.08 Buat no-result guidance.

---

# EPIC-05 — Source Library & Deduplikasi

**Scope:** Penyimpanan sumber, access route, verifikasi, dan pencegahan duplikat.  
**Milestone:** M3  
**Priority:** P0

## TASK-05.01 — Source schema

- [ ] SUBTASK-05.01.01 Buat Source entity.
- [ ] SUBTASK-05.01.02 Buat SourceAccessRoute entity.
- [ ] SUBTASK-05.01.03 Buat metadata provenance.
- [ ] SUBTASK-05.01.04 Buat verification status.
- [ ] SUBTASK-05.01.05 Buat user notes/tags.
- [ ] SUBTASK-05.01.06 Buat source-outline relation.

## TASK-05.02 — Deduplikasi engine

- [ ] SUBTASK-05.02.01 DOI exact match.
- [ ] SUBTASK-05.02.02 Canonical URL match.
- [ ] SUBTASK-05.02.03 Normalized title match.
- [ ] SUBTASK-05.02.04 Title-year-author composite match.
- [ ] SUBTASK-05.02.05 Similarity candidate detection.
- [ ] SUBTASK-05.02.06 Merge preview.
- [ ] SUBTASK-05.02.07 Safe merge dan undo.
- [ ] SUBTASK-05.02.08 Unit tests edge cases.

## TASK-05.03 — Library UI

- [ ] SUBTASK-05.03.01 List/grid source view.
- [ ] SUBTASK-05.03.02 Filter dan sort.
- [ ] SUBTASK-05.03.03 Source detail drawer/page.
- [ ] SUBTASK-05.03.04 Access-route display.
- [ ] SUBTASK-05.03.05 Verification badge.
- [ ] SUBTASK-05.03.06 Edit metadata.
- [ ] SUBTASK-05.03.07 Bulk tagging tanpa mass scraping.

---

# EPIC-06 — Research Matrix, Evidence & Synthesis

**Scope:** Ekstraksi terkontrol, sintesis, claim ledger, dan gap.  
**Milestone:** M4  
**Priority:** P0

## TASK-06.01 — Research matrix schema

- [ ] SUBTASK-06.01.01 Definisikan matrix fields.
- [ ] SUBTASK-06.01.02 Simpan field-level evidence level.
- [ ] SUBTASK-06.01.03 Simpan AI value dan user-corrected value.
- [ ] SUBTASK-06.01.04 Tambahkan verification flag.
- [ ] SUBTASK-06.01.05 Buat migration.

## TASK-06.02 — Matrix extraction

- [ ] SUBTASK-06.02.01 Extract dari metadata.
- [ ] SUBTASK-06.02.02 Extract dari abstract.
- [ ] SUBTASK-06.02.03 Extract dari permitted full text/file.
- [ ] SUBTASK-06.02.04 Return unknown untuk data tidak tersedia.
- [ ] SUBTASK-06.02.05 Sertakan evidence pointer.
- [ ] SUBTASK-06.02.06 Tambahkan review UI.

## TASK-06.03 — Synthesis engine

- [ ] SUBTASK-06.03.01 Cluster themes.
- [ ] SUBTASK-06.03.02 Identify agreements.
- [ ] SUBTASK-06.03.03 Identify conflicts.
- [ ] SUBTASK-06.03.04 Identify method patterns.
- [ ] SUBTASK-06.03.05 Generate limitations summary.
- [ ] SUBTASK-06.03.06 Attach source IDs per claim.
- [ ] SUBTASK-06.03.07 Add regeneration with changed source set.

## TASK-06.04 — Claim ledger

- [ ] SUBTASK-06.04.01 Buat Claim entity.
- [ ] SUBTASK-06.04.02 Hubungkan claim ke evidence.
- [ ] SUBTASK-06.04.03 Hitung support state.
- [ ] SUBTASK-06.04.04 Tandai conflicting evidence.
- [ ] SUBTASK-06.04.05 Buat claim detail UI.
- [ ] SUBTASK-06.04.06 Buat unsupported claim filter.

## TASK-06.05 — Research gap assistant

- [ ] SUBTASK-06.05.01 Definisikan gap categories.
- [ ] SUBTASK-06.05.02 Buat gap candidate generator.
- [ ] SUBTASK-06.05.03 Hubungkan gap ke supporting sources.
- [ ] SUBTASK-06.05.04 Tambahkan confidence/limitation.
- [ ] SUBTASK-06.05.05 Buat user approval workflow.

---

# EPIC-07 — Evidence-Based Outline

**Scope:** Struktur bab, brief per bagian, targets, dan readiness.  
**Milestone:** M5  
**Priority:** P0

## TASK-07.01 — Outline schema

- [ ] SUBTASK-07.01.01 Buat hierarchical OutlineNode.
- [ ] SUBTASK-07.01.02 Buat ordering strategy.
- [ ] SUBTASK-07.01.03 Buat objective field.
- [ ] SUBTASK-07.01.04 Buat guiding questions.
- [ ] SUBTASK-07.01.05 Buat required evidence relation.
- [ ] SUBTASK-07.01.06 Buat word target/deadline/status.
- [ ] SUBTASK-07.01.07 Buat completion criteria.
- [ ] SUBTASK-07.01.08 Buat supervisor notes.

## TASK-07.02 — Research-type templates

- [ ] SUBTASK-07.02.01 Template kuantitatif.
- [ ] SUBTASK-07.02.02 Template kualitatif.
- [ ] SUBTASK-07.02.03 Template mixed method.
- [ ] SUBTASK-07.02.04 Template R&D.
- [ ] SUBTASK-07.02.05 Template studi literatur.
- [ ] SUBTASK-07.02.06 Template teknik/informatika.
- [ ] SUBTASK-07.02.07 Template custom kampus.

## TASK-07.03 — Outline generation

- [ ] SUBTASK-07.03.01 Validate research context minimum.
- [ ] SUBTASK-07.03.02 Generate chapter proposal.
- [ ] SUBTASK-07.03.03 Generate subchapter proposal.
- [ ] SUBTASK-07.03.04 Generate brief per node.
- [ ] SUBTASK-07.03.05 Attach source suggestions.
- [ ] SUBTASK-07.03.06 Mark unsupported sections.
- [ ] SUBTASK-07.03.07 User review dan apply.

## TASK-07.04 — Outline tree UI

- [ ] SUBTASK-07.04.01 Tree navigation.
- [ ] SUBTASK-07.04.02 Add/edit/delete node.
- [ ] SUBTASK-07.04.03 Drag-and-drop reorder.
- [ ] SUBTASK-07.04.04 Prevent invalid hierarchy.
- [ ] SUBTASK-07.04.05 Renumber after reorder.
- [ ] SUBTASK-07.04.06 Node detail panel.
- [ ] SUBTASK-07.04.07 Mobile fallback controls.

## TASK-07.05 — Readiness engine

- [ ] SUBTASK-07.05.01 Structure completeness rule.
- [ ] SUBTASK-07.05.02 Objective completeness rule.
- [ ] SUBTASK-07.05.03 Problem-goal consistency rule.
- [ ] SUBTASK-07.05.04 Goal-method consistency rule.
- [ ] SUBTASK-07.05.05 Evidence coverage rule.
- [ ] SUBTASK-07.05.06 Duplicate section rule.
- [ ] SUBTASK-07.05.07 Explainable score UI.
- [ ] SUBTASK-07.05.08 Unit tests for rule engine.

---

# EPIC-08 — Writing, Revision & Bimbingan

**Scope:** Editor, AI-assisted review, revision workflow, dan journal log.  
**Milestone:** M5  
**Priority:** P1

## TASK-08.01 — Writing editor

- [x] SUBTASK-08.01.01 Select editor foundation. _(textarea-based editor; see `components/WritingWorkspace.vue`)_
- [x] SUBTASK-08.01.02 Persist document content. _(`domain/repository` local adapter, `ruang-writing-v1`)_
- [x] SUBTASK-08.01.03 Autosave with debounce. _(1.2s debounce in `WritingWorkspace.vue`, snapshot in `domain/writing/store.ts#commitAutosave`)_
- [x] SUBTASK-08.01.04 Save-state indicator. _(idle/pending/saving/saved label in toolbar)_
- [x] SUBTASK-08.01.05 Word count. _(`domain/writing/text.ts#countWords`, excludes citation placeholders)_
- [x] SUBTASK-08.01.06 Basic version history. _(`VersionSnapshot[]`, version panel UI)_
- [x] SUBTASK-08.01.07 Restore version. _(`domain/writing/store.ts#restoreVersion` + UI button)_
- [x] SUBTASK-08.01.08 Offline/conflict strategy. _(`assertNoConflict`/`forceOverwrite`, rev-based; not yet wired to a live multi-tab UI prompt — logic only)_

## TASK-08.02 — AI writing actions

- [x] SUBTASK-08.02.01 Action on selected text. _(falls back to whole section when nothing is selected)_
- [x] SUBTASK-08.02.02 Critique argument.
- [x] SUBTASK-08.02.03 Find unsupported claim.
- [x] SUBTASK-08.02.04 Improve clarity.
- [x] SUBTASK-08.02.05 Check terminology consistency.
- [x] SUBTASK-08.02.06 Show diff before apply. _(`DiffPreview.vue`, word-level LCS diff)_
- [x] SUBTASK-08.02.07 Undo applied suggestion. _(`undoAIChange`, restores the before-ai snapshot)_
- [x] SUBTASK-08.02.08 Record model/provenance. _(`AIProvenance` on every `ai-apply` ledger entry)_

## TASK-08.03 — Revision workflow

- [x] SUBTASK-08.03.01 Buat Revision entity. _(`domain/revision/model.ts`)_
- [x] SUBTASK-08.03.02 Source/pembimbing field. _(`sourceType`, `author`)_
- [x] SUBTASK-08.03.03 Priority dan deadline.
- [x] SUBTASK-08.03.04 Status workflow. _(Baru→Dipahami→Dikerjakan→Perlu konfirmasi→Selesai, guarded transitions)_
- [x] SUBTASK-08.03.05 Relasi ke outline node. _(`outlineNodeId`, used for open-revision counts in Writing Workspace)_
- [x] SUBTASK-08.03.06 Before/after notes. _(`textBefore`/`textAfter`, required as evidence before closing)_
- [x] SUBTASK-08.03.07 Revision board/list. _(`components/RevisionBoard.vue`)_
- [ ] SUBTASK-08.03.08 Dashboard integration. _(ringkasan dashboard belum menampilkan revisi; board hanya tersedia di tab Ruang Revisi)_

## TASK-08.04 — Bimbingan journal

- [x] SUBTASK-08.04.01 Meeting log entity. _(`domain/bimbingan/model.ts`)_
- [x] SUBTASK-08.04.02 Agenda.
- [x] SUBTASK-08.04.03 Decisions.
- [x] SUBTASK-08.04.04 Generated revision items. _(`generatedRevisionIds` + `linkRevisionToMeeting`; not yet wired to an automatic "create revision from meeting" UI action)_
- [x] SUBTASK-08.04.05 Next meeting targets. _(checklist with done/pending counts)_
- [ ] SUBTASK-08.04.06 Attachment support. _(model has `BimbinganAttachment[]`; no file upload UI — depends on Appwrite storage, Batch 6)_
- [x] SUBTASK-08.04.07 Timeline view. _(`buildTimeline`, most-recent-first)_

**Batch 4 implementation notes:**
- Domain logic lives in `domain/writing/`, `domain/revision/`, `domain/bimbingan/` — pure TypeScript, framework-free, unit-tested (`tests/writing.test.ts`, `tests/revision.test.ts`, 28 tests).
- UI wiring in `components/WritingWorkspace.vue`, `components/RevisionBoard.vue`, `components/BimbinganJournal.vue`, `components/DiffPreview.vue`, surfaced in `pages/app.vue` under a new "Naskah" nav tab plus the existing "Ruang revisi" tab.
- Persistence goes through `domain/repository/` (Repository Interface pattern from PERENCANAAN.md §4): a `local` (localStorage) adapter is active now; an `appwrite` adapter stub exists for Batch 6 so the UI layer never has to change.
- Citation placeholders, evidence coverage, and the completion gate (`checkCompletion`) are implemented ahead of full Batch 5 (Citation/DOCX) scope because the writing editor needed them to enforce "no fake certainty" at write-time; Batch 5 should extend these with style formatting (APA/IEEE) and bibliography generation rather than re-deriving them.

---

# EPIC-09 — DOCX & Artifact Export

**Scope:** Draft/Final Blueprint dan template dokumen.  
**Milestone:** M5  
**Priority:** P1

## TASK-09.01 — Export data contract

- [x] SUBTASK-09.01.01 Definisikan export snapshot. _(`domain/export/model.ts#ExportSnapshot`)_
- [x] SUBTASK-09.01.02 Definisikan warning payload. _(`ExportWarning`, critical vs notice severity)_
- [x] SUBTASK-09.01.03 Freeze source/version at export time. _(`ExportPanel.vue#buildSnapshotBase` reads current writing docs/sources once per export call; server renders only from the posted snapshot, never a live reference)_
- [x] SUBTASK-09.01.04 Definisikan artifact metadata. _(`ArtifactMetadata`; `expiresAt` is `null` because artifacts aren't stored server-side yet — see note below)_

## TASK-09.02 — DOCX renderer

- [x] SUBTASK-09.02.01 Render project metadata. _(title page: judul, nama, program, universitas, tanggal)_
- [x] SUBTASK-09.02.02 Render chapter outline. _(heading levels 1-3 from outline nodes)_
- [x] SUBTASK-09.02.03 Render node brief. _(objective line per section)_
- [x] SUBTASK-09.02.04 Render targets/checklist. _(status + word count vs target per section)_
- [x] SUBTASK-09.02.05 Render research matrix. _(table: sumber/tujuan/metode/temuan/keterbatasan/verifikasi)_
- [x] SUBTASK-09.02.06 Render bibliography draft. _(`domain/citation-style/bibliography.ts`, APA + IEEE)_
- [x] SUBTASK-09.02.07 Render AI disclosure. _("Keterangan Bantuan AI" section listing ai-assisted sections)_
- [x] SUBTASK-09.02.08 Validate generated DOCX. _(`validateDocxBuffer`: checks ZIP signature + required OOXML parts + `<w:body>`; verified end-to-end against a real server response — see implementation notes)_

## TASK-09.03 — Template settings

- [x] SUBTASK-09.03.01 Margin settings. _(`ExportTemplate.marginsCm`)_
- [x] SUBTASK-09.03.02 Font settings. _(`fontFamily`, `fontSizePt`)_
- [x] SUBTASK-09.03.03 Paragraph spacing. _(`lineSpacing`)_
- [x] SUBTASK-09.03.04 Heading numbering. _(`headingNumbering` flag on template; DOCX heading STYLES applied — Word's own auto-numbering via list styles is NOT wired yet, flag is currently descriptive only)_
- [x] SUBTASK-09.03.05 Page numbering. _(footer with `PageNumber.CURRENT` when `pageNumbering: true`)_
- [ ] SUBTASK-09.03.06 Save template preset. _(two built-in presets exist (`defaultTemplates`); no UI/persistence yet to save a custom one — needs Batch 6 storage)_

## TASK-09.04 — Export UI

- [x] SUBTASK-09.04.01 Draft export action. _(`ExportPanel.vue`, always allowed)_
- [x] SUBTASK-09.04.02 Final readiness dialog. _(warning list + citation summary shown before export, via `/api/export/readiness`)_
- [x] SUBTASK-09.04.03 Warning acknowledgement. _(checkbox required to force-export a Final Blueprint with open critical warnings)_
- [ ] SUBTASK-09.04.04 Job progress. _(render is synchronous and fast enough in the prototype that no job queue exists; a spinner covers the request, not a multi-step progress bar)_
- [x] SUBTASK-09.04.05 Download artifact. _(browser `Blob` + `<a download>`, verified against a real running server — file opens as a valid .docx)_
- [ ] SUBTASK-09.04.06 Expired artifact state. _(nothing to expire: artifacts are generated on-demand and never stored server-side in this prototype; applies once Batch 6/export-service persists generated files)_

**Batch 5 implementation notes:**
- Citation styling lives in `domain/citation-style/` (APA 7th simplified + IEEE numeric), built on top of the `[[cite:key|label]]` placeholder scheme from Batch 4 — extended, not re-derived, as planned.
- DOCX rendering uses the `docx` npm package (v9) plus its own `jszip` dependency for structural validation, so no new unvetted dependency was added for validation.
- `tests/export.test.ts` (12 tests) actually generates a `.docx` buffer, unzips it, and asserts on the real `word/document.xml` content (title present, APA in-text citation rendered, raw `[[cite:` placeholders never leak, Research Matrix/Daftar Pustaka/AI disclosure sections present) — not just "no exception thrown".
- Additionally verified against a **live production server** (`npm run build` + `node .output/server/index.mjs`): downloaded a real file over HTTP, confirmed with the system `file` command that it reports "Microsoft Word 2007+", and confirmed the Final Blueprint gate returns a real HTTP 422 with the warning payload when critical checks fail.
- The Final Blueprint gate (`domain/export/gate.ts#evaluateExportReadiness`) reuses `evaluateOutlineReadiness` and `evaluateConsistency` from Batches 3/4 rather than re-implementing readiness logic.

---

# EPIC-10 — BYOK Secret & Connection Management

**Scope:** Penyimpanan secret, connection lifecycle, dan UI konfigurasi.  
**Milestone:** M6  
**Priority:** P0

## TASK-10.01 — Secret vault

- [ ] SUBTASK-10.01.01 Pilih KMS/vault strategy.
- [ ] SUBTASK-10.01.02 Implementasikan envelope encryption.
- [ ] SUBTASK-10.01.03 Buat secret reference schema.
- [ ] SUBTASK-10.01.04 Pastikan no-readback API.
- [ ] SUBTASK-10.01.05 Buat secret rotation.
- [ ] SUBTASK-10.01.06 Buat revoke/delete.
- [ ] SUBTASK-10.01.07 Buat redaction tests.
- [ ] SUBTASK-10.01.08 Audit access to secret.

## TASK-10.02 — Provider connection schema

- [ ] SUBTASK-10.02.01 Provider registry entity/config.
- [ ] SUBTASK-10.02.02 Connection entity.
- [ ] SUBTASK-10.02.03 Auth strategy enum.
- [ ] SUBTASK-10.02.04 Base URL/API version fields.
- [ ] SUBTASK-10.02.05 Health status fields.
- [ ] SUBTASK-10.02.06 OAuth expiry/scope metadata.
- [ ] SUBTASK-10.02.07 Connection audit events.

## TASK-10.03 — Connection wizard

- [ ] SUBTASK-10.03.01 Provider selection.
- [ ] SUBTASK-10.03.02 Auth method selection.
- [ ] SUBTASK-10.03.03 Secure key input.
- [ ] SUBTASK-10.03.04 Custom URL configuration.
- [ ] SUBTASK-10.03.05 Connection test.
- [ ] SUBTASK-10.03.06 Model discovery step.
- [ ] SUBTASK-10.03.07 Default model selection.
- [ ] SUBTASK-10.03.08 Capability review.
- [ ] SUBTASK-10.03.09 Save/disconnect flows.

## TASK-10.04 — OAuth Google

- [ ] SUBTASK-10.04.01 Configure authorization endpoint.
- [ ] SUBTASK-10.04.02 Generate state and PKCE.
- [ ] SUBTASK-10.04.03 Implement callback validation.
- [ ] SUBTASK-10.04.04 Exchange authorization code.
- [ ] SUBTASK-10.04.05 Encrypt refresh token.
- [ ] SUBTASK-10.04.06 Refresh access token.
- [ ] SUBTASK-10.04.07 Revoke/disconnect.
- [ ] SUBTASK-10.04.08 Test expired/denied flow.

## TASK-10.05 — OAuth OpenAI/Codex feasibility

- [ ] SUBTASK-10.05.01 Verifikasi dokumentasi resmi saat implementasi.
- [ ] SUBTASK-10.05.02 Verifikasi third-party app eligibility.
- [ ] SUBTASK-10.05.03 Verifikasi scopes dan token lifecycle.
- [ ] SUBTASK-10.05.04 Buat adapter hanya jika resmi tersedia.
- [ ] SUBTASK-10.05.05 Jika tidak tersedia, tampilkan API-key alternative.
- [ ] SUBTASK-10.05.06 Dokumentasikan bahwa ChatGPT subscription bukan API credit.

---

# EPIC-11 — Provider Adapters & Model Discovery

**Scope:** Adapter native/compatible, discovery, health, dan fallback.  
**Milestone:** M6  
**Priority:** P0

## TASK-11.01 — Normalized AI request

- [ ] SUBTASK-11.01.01 Messages/content schema.
- [ ] SUBTASK-11.01.02 Tool schema.
- [ ] SUBTASK-11.01.03 Streaming event schema.
- [ ] SUBTASK-11.01.04 Usage schema.
- [ ] SUBTASK-11.01.05 Error normalization.
- [ ] SUBTASK-11.01.06 Cancellation contract.

## TASK-11.02 — OpenAI adapter

- [ ] SUBTASK-11.02.01 Connection validation.
- [ ] SUBTASK-11.02.02 Model listing.
- [ ] SUBTASK-11.02.03 Streaming text.
- [ ] SUBTASK-11.02.04 Structured output.
- [ ] SUBTASK-11.02.05 Tool calling.
- [ ] SUBTASK-11.02.06 Reasoning parameter mapping.
- [ ] SUBTASK-11.02.07 Usage/error mapping.
- [ ] SUBTASK-11.02.08 Contract tests.

## TASK-11.03 — Anthropic adapter

- [ ] SUBTASK-11.03.01 Connection validation.
- [ ] SUBTASK-11.03.02 Model discovery/catalog.
- [ ] SUBTASK-11.03.03 Streaming.
- [ ] SUBTASK-11.03.04 Tool calling.
- [ ] SUBTASK-11.03.05 Thinking budget mapping.
- [ ] SUBTASK-11.03.06 Usage/error mapping.
- [ ] SUBTASK-11.03.07 Contract tests.

## TASK-11.04 — Gemini adapter

- [ ] SUBTASK-11.04.01 API-key connection.
- [ ] SUBTASK-11.04.02 OAuth connection support.
- [ ] SUBTASK-11.04.03 Model listing.
- [ ] SUBTASK-11.04.04 Multimodal mapping.
- [ ] SUBTASK-11.04.05 Tool calling.
- [ ] SUBTASK-11.04.06 Thinking mapping.
- [ ] SUBTASK-11.04.07 Usage/error mapping.
- [ ] SUBTASK-11.04.08 Contract tests.

## TASK-11.05 — OpenRouter adapter

- [ ] SUBTASK-11.05.01 Connection validation.
- [ ] SUBTASK-11.05.02 Model listing.
- [ ] SUBTASK-11.05.03 Provider routing metadata.
- [ ] SUBTASK-11.05.04 Streaming/tools.
- [ ] SUBTASK-11.05.05 Usage/error mapping.
- [ ] SUBTASK-11.05.06 Contract tests.

## TASK-11.06 — OpenAI-compatible adapter

- [ ] SUBTASK-11.06.01 Configurable base URL.
- [ ] SUBTASK-11.06.02 Configurable models path.
- [ ] SUBTASK-11.06.03 Configurable completion path.
- [ ] SUBTASK-11.06.04 Manual model ID.
- [ ] SUBTASK-11.06.05 Compatibility presets.
- [ ] SUBTASK-11.06.06 Conservative tool/thinking defaults.
- [ ] SUBTASK-11.06.07 Contract tests dengan mock endpoints.

## TASK-11.07 — SSRF protection

- [ ] SUBTASK-11.07.01 Enforce scheme policy.
- [ ] SUBTASK-11.07.02 Resolve dan block private/link-local IP.
- [ ] SUBTASK-11.07.03 Block metadata service ranges.
- [ ] SUBTASK-11.07.04 Limit redirects.
- [ ] SUBTASK-11.07.05 Revalidate redirect destination.
- [ ] SUBTASK-11.07.06 Apply response size/time limits.
- [ ] SUBTASK-11.07.07 Add DNS rebinding mitigation.
- [ ] SUBTASK-11.07.08 Add SSRF security tests.

## TASK-11.08 — Model discovery service

- [ ] SUBTASK-11.08.01 `/v1/models` strategy.
- [ ] SUBTASK-11.08.02 Native endpoint strategy.
- [ ] SUBTASK-11.08.03 Curated catalog strategy.
- [ ] SUBTASK-11.08.04 Manual model strategy.
- [ ] SUBTASK-11.08.05 Cache and refresh.
- [ ] SUBTASK-11.08.06 Handle empty/partial listing.
- [ ] SUBTASK-11.08.07 Store discovery timestamp/source.

---

# EPIC-12 — Model Capability & Routing

**Scope:** Capability registry, thinking controls, feature assignment, dan runtime validation.  
**Milestone:** M6  
**Priority:** P0

## TASK-12.01 — Capability schema

- [ ] SUBTASK-12.01.01 Input modality fields.
- [ ] SUBTASK-12.01.02 Streaming field.
- [ ] SUBTASK-12.01.03 Tool fields.
- [ ] SUBTASK-12.01.04 Structured output fields.
- [ ] SUBTASK-12.01.05 Token-limit fields.
- [ ] SUBTASK-12.01.06 Citation/search fields.
- [ ] SUBTASK-12.01.07 Thinking union schema.
- [ ] SUBTASK-12.01.08 Schema versioning.

## TASK-12.02 — Capability resolution

- [ ] SUBTASK-12.02.01 Provider metadata resolver.
- [ ] SUBTASK-12.02.02 Curated registry resolver.
- [ ] SUBTASK-12.02.03 Safe probe resolver.
- [ ] SUBTASK-12.02.04 Admin override.
- [ ] SUBTASK-12.02.05 Connection override.
- [ ] SUBTASK-12.02.06 Conservative fallback.
- [ ] SUBTASK-12.02.07 Conflict audit log.

## TASK-12.03 — Thinking controls

- [ ] SUBTASK-12.03.01 Unsupported state.
- [ ] SUBTASK-12.03.02 Fixed state.
- [ ] SUBTASK-12.03.03 Toggle state.
- [ ] SUBTASK-12.03.04 Level selector.
- [ ] SUBTASK-12.03.05 Token-budget selector.
- [ ] SUBTASK-12.03.06 Provider-native adapter UI.
- [ ] SUBTASK-12.03.07 Runtime parameter validation.
- [ ] SUBTASK-12.03.08 Cross-provider tests.

## TASK-12.04 — Feature model assignment

- [ ] SUBTASK-12.04.01 Default model.
- [ ] SUBTASK-12.04.02 Search/planning model.
- [ ] SUBTASK-12.04.03 Synthesis model.
- [ ] SUBTASK-12.04.04 Quick-action model.
- [ ] SUBTASK-12.04.05 Coding model.
- [ ] SUBTASK-12.04.06 Vision/file model.
- [ ] SUBTASK-12.04.07 Fallback model.
- [ ] SUBTASK-12.04.08 Display actual model used.

---

# EPIC-13 — Subscription, Entitlement & Usage

**Scope:** Paket Free/Pro/Institution, quota, dan metering.  
**Milestone:** M7  
**Priority:** P0

## TASK-13.01 — Plan model

- [ ] SUBTASK-13.01.01 Plan entity.
- [ ] SUBTASK-13.01.02 Feature entitlement definitions.
- [ ] SUBTASK-13.01.03 Quota definitions.
- [ ] SUBTASK-13.01.04 Subscription state machine.
- [ ] SUBTASK-13.01.05 Grace period/cancellation policy.

## TASK-13.02 — Server-side entitlement

- [ ] SUBTASK-13.02.01 Entitlement middleware.
- [ ] SUBTASK-13.02.02 Feature-level checks.
- [ ] SUBTASK-13.02.03 Tool-level checks.
- [ ] SUBTASK-13.02.04 Sandbox endpoint checks.
- [ ] SUBTASK-13.02.05 Institution policy override.
- [ ] SUBTASK-13.02.06 Bypass/security tests.

## TASK-13.03 — Usage ledger

- [ ] SUBTASK-13.03.01 AI request usage.
- [ ] SUBTASK-13.03.02 Search usage.
- [ ] SUBTASK-13.03.03 CPU seconds.
- [ ] SUBTASK-13.03.04 Storage/artifact usage.
- [ ] SUBTASK-13.03.05 Concurrent job count.
- [ ] SUBTASK-13.03.06 Atomic quota reservation.
- [ ] SUBTASK-13.03.07 Usage reconciliation.

## TASK-13.04 — Billing UI

- [ ] SUBTASK-13.04.01 Plan comparison.
- [ ] SUBTASK-13.04.02 Upgrade action.
- [ ] SUBTASK-13.04.03 Current usage.
- [ ] SUBTASK-13.04.04 Quota warning.
- [ ] SUBTASK-13.04.05 Billing state/errors.
- [ ] SUBTASK-13.04.06 Cancel/reactivate flow.

---

# EPIC-14 — Tool Registry & Agent Permissions

**Scope:** Tool definitions, policy, confirmation, dan execution audit.  
**Milestone:** M8  
**Priority:** P0

## TASK-14.01 — Tool schema

- [ ] SUBTASK-14.01.01 Tool input/output schema.
- [ ] SUBTASK-14.01.02 Risk level.
- [ ] SUBTASK-14.01.03 Required entitlement.
- [ ] SUBTASK-14.01.04 Required model capability.
- [ ] SUBTASK-14.01.05 Confirmation policy.
- [ ] SUBTASK-14.01.06 Timeout/resource policy.

## TASK-14.02 — Tool availability resolver

- [ ] SUBTASK-14.02.01 Resolve subscription.
- [ ] SUBTASK-14.02.02 Resolve workspace permission.
- [ ] SUBTASK-14.02.03 Resolve model tool capability.
- [ ] SUBTASK-14.02.04 Resolve quota.
- [ ] SUBTASK-14.02.05 Resolve provider connection.
- [ ] SUBTASK-14.02.06 Return explainable unavailable reason.

## TASK-14.03 — Confirmation workflow

- [ ] SUBTASK-14.03.01 Define destructive/external actions.
- [ ] SUBTASK-14.03.02 Show planned action.
- [ ] SUBTASK-14.03.03 Show data/secret exposure.
- [ ] SUBTASK-14.03.04 Record approval.
- [ ] SUBTASK-14.03.05 Enforce approval expiry.
- [ ] SUBTASK-14.03.06 Audit allow/deny.

---

# EPIC-15 — Paid Sandbox Platform

**Scope:** Orchestrator, runner, isolation, tools, artifacts, dan previews.  
**Milestone:** M8  
**Priority:** P0

## TASK-15.01 — Sandbox feasibility spike

- [ ] SUBTASK-15.01.01 Benchmark container startup.
- [ ] SUBTASK-15.01.02 Benchmark microVM startup.
- [ ] SUBTASK-15.01.03 Estimate CPU/RAM cost.
- [ ] SUBTASK-15.01.04 Test filesystem isolation.
- [ ] SUBTASK-15.01.05 Test network policy.
- [ ] SUBTASK-15.01.06 Select alpha architecture.
- [ ] SUBTASK-15.01.07 Record decision.

## TASK-15.02 — Job queue

- [ ] SUBTASK-15.02.01 Job schema.
- [ ] SUBTASK-15.02.02 Queue producer.
- [ ] SUBTASK-15.02.03 Queue consumer.
- [ ] SUBTASK-15.02.04 Retry/dead-letter policy.
- [ ] SUBTASK-15.02.05 Idempotency.
- [ ] SUBTASK-15.02.06 Priority/concurrency.
- [ ] SUBTASK-15.02.07 Job cancellation.

## TASK-15.03 — Sandbox runner

- [ ] SUBTASK-15.03.01 Build signed base image.
- [ ] SUBTASK-15.03.02 Run as non-root.
- [ ] SUBTASK-15.03.03 Apply CPU/memory/disk limit.
- [ ] SUBTASK-15.03.04 Apply process/time limit.
- [ ] SUBTASK-15.03.05 Apply read-only root filesystem.
- [ ] SUBTASK-15.03.06 Create ephemeral workspace.
- [ ] SUBTASK-15.03.07 Disable privileged capabilities.
- [ ] SUBTASK-15.03.08 Cleanup environment.

## TASK-15.04 — Network isolation

- [ ] SUBTASK-15.04.01 Default-deny egress.
- [ ] SUBTASK-15.04.02 Package registry allowlist.
- [ ] SUBTASK-15.04.03 Block metadata/private ranges.
- [ ] SUBTASK-15.04.04 Apply bandwidth limit.
- [ ] SUBTASK-15.04.05 Log outbound domains safely.
- [ ] SUBTASK-15.04.06 Test DNS rebinding.

## TASK-15.05 — Terminal/file tools

- [ ] SUBTASK-15.05.01 Execute command tool.
- [ ] SUBTASK-15.05.02 Working-directory constraint.
- [ ] SUBTASK-15.05.03 Read file tool.
- [ ] SUBTASK-15.05.04 Write/edit file tool.
- [ ] SUBTASK-15.05.05 Output truncation/offloading.
- [ ] SUBTASK-15.05.06 Kill command tool.
- [ ] SUBTASK-15.05.07 Redact secrets in output.

## TASK-15.06 — Artifact pipeline

- [ ] SUBTASK-15.06.01 Detect artifact files.
- [ ] SUBTASK-15.06.02 Validate file path/type/size.
- [ ] SUBTASK-15.06.03 Scan output where applicable.
- [ ] SUBTASK-15.06.04 Upload object storage.
- [ ] SUBTASK-15.06.05 Generate signed download URL.
- [ ] SUBTASK-15.06.06 Apply retention cleanup.
- [ ] SUBTASK-15.06.07 Usage metering.

## TASK-15.07 — Prototype preview

- [ ] SUBTASK-15.07.01 Detect successful web build.
- [ ] SUBTASK-15.07.02 Serve preview in isolated environment.
- [ ] SUBTASK-15.07.03 Use random unguessable route.
- [ ] SUBTASK-15.07.04 Add authentication/private preview.
- [ ] SUBTASK-15.07.05 Add expiry.
- [ ] SUBTASK-15.07.06 Prevent access to internal network.

## TASK-15.08 — Sandbox UI

- [ ] SUBTASK-15.08.01 Plan preview.
- [ ] SUBTASK-15.08.02 Permission confirmation.
- [ ] SUBTASK-15.08.03 Queue state.
- [ ] SUBTASK-15.08.04 Live progress/events.
- [ ] SUBTASK-15.08.05 Cancel action.
- [ ] SUBTASK-15.08.06 Failure explanation.
- [ ] SUBTASK-15.08.07 Artifact and preview results.
- [ ] SUBTASK-15.08.08 Quota display.

---

# EPIC-16 — Privacy, Security & Compliance Controls

**Scope:** Data lifecycle, audit, abuse prevention, dan production security.  
**Milestone:** M9  
**Priority:** P0

## TASK-16.01 — Data lifecycle

- [ ] SUBTASK-16.01.01 Data inventory.
- [ ] SUBTASK-16.01.02 Retention policy per entity.
- [ ] SUBTASK-16.01.03 Account data export.
- [ ] SUBTASK-16.01.04 Account deletion.
- [ ] SUBTASK-16.01.05 Artifact cleanup.
- [ ] SUBTASK-16.01.06 OAuth revoke on deletion.
- [ ] SUBTASK-16.01.07 Verify backup deletion policy.

## TASK-16.02 — Audit log

- [ ] SUBTASK-16.02.01 Provider connection events.
- [ ] SUBTASK-16.02.02 Secret access events.
- [ ] SUBTASK-16.02.03 Tool approval/execution events.
- [ ] SUBTASK-16.02.04 Sandbox events.
- [ ] SUBTASK-16.02.05 Permission changes.
- [ ] SUBTASK-16.02.06 Admin access events.

## TASK-16.03 — Abuse prevention

- [ ] SUBTASK-16.03.01 Request rate limits.
- [ ] SUBTASK-16.03.02 Search abuse limits.
- [ ] SUBTASK-16.03.03 Sandbox compute limits.
- [ ] SUBTASK-16.03.04 File upload limits.
- [ ] SUBTASK-16.03.05 Suspicious usage alerts.
- [ ] SUBTASK-16.03.06 Account suspension flow.

## TASK-16.04 — Security review

- [ ] SUBTASK-16.04.01 Dependency scan.
- [ ] SUBTASK-16.04.02 Secret scan.
- [ ] SUBTASK-16.04.03 Web security review.
- [ ] SUBTASK-16.04.04 OAuth review.
- [ ] SUBTASK-16.04.05 SSRF penetration tests.
- [ ] SUBTASK-16.04.06 Sandbox isolation tests.
- [ ] SUBTASK-16.04.07 Fix all critical/high findings.

---

# EPIC-17 — Quality, Accessibility & Performance

**Scope:** QA, E2E, accessibility, performance, dan browser compatibility.  
**Milestone:** M9  
**Priority:** P0

## TASK-17.01 — E2E suite

- [ ] SUBTASK-17.01.01 Auth/onboarding flow.
- [ ] SUBTASK-17.01.02 Project/dashboard flow.
- [ ] SUBTASK-17.01.03 Search/save/deduplicate flow.
- [ ] SUBTASK-17.01.04 Matrix/synthesis flow.
- [ ] SUBTASK-17.01.05 Outline/export flow.
- [ ] SUBTASK-17.01.06 Provider connection flow.
- [ ] SUBTASK-17.01.07 Sandbox Pro flow.
- [ ] SUBTASK-17.01.08 Free entitlement rejection flow.

## TASK-17.02 — Accessibility

- [ ] SUBTASK-17.02.01 Keyboard audit.
- [ ] SUBTASK-17.02.02 Screen-reader labels.
- [ ] SUBTASK-17.02.03 Focus management.
- [ ] SUBTASK-17.02.04 Color contrast.
- [ ] SUBTASK-17.02.05 Reduced motion.
- [ ] SUBTASK-17.02.06 Form error announcement.
- [ ] SUBTASK-17.02.07 Fix critical WCAG issues.

## TASK-17.03 — Performance

- [ ] SUBTASK-17.03.01 Bundle analysis.
- [ ] SUBTASK-17.03.02 Route-level code splitting.
- [ ] SUBTASK-17.03.03 Lazy-load editor/graph.
- [ ] SUBTASK-17.03.04 Optimize fonts/images.
- [ ] SUBTASK-17.03.05 Virtualize large source lists.
- [ ] SUBTASK-17.03.06 Cache safe API responses.
- [ ] SUBTASK-17.03.07 Measure LCP/CLS.
- [ ] SUBTASK-17.03.08 Fix regression budget violations.

## TASK-17.04 — Cross-browser/responsive QA

- [ ] SUBTASK-17.04.01 Chromium desktop.
- [ ] SUBTASK-17.04.02 Firefox desktop.
- [ ] SUBTASK-17.04.03 Safari desktop.
- [ ] SUBTASK-17.04.04 Android mobile.
- [ ] SUBTASK-17.04.05 iOS mobile.
- [ ] SUBTASK-17.04.06 Tablet layout.
- [ ] SUBTASK-17.04.07 Editor fallback behavior.

---

# EPIC-18 — Launch & Operations

**Scope:** Deployment, backup, monitoring, incident response, dan rollout.  
**Milestone:** M9  
**Priority:** P0

## TASK-18.01 — VPS/production deployment

- [ ] SUBTASK-18.01.01 Provision application network.
- [ ] SUBTASK-18.01.02 Provision database.
- [ ] SUBTASK-18.01.03 Provision Redis/queue.
- [ ] SUBTASK-18.01.04 Provision object storage.
- [ ] SUBTASK-18.01.05 Provision secret manager.
- [ ] SUBTASK-18.01.06 Separate sandbox runner nodes.
- [ ] SUBTASK-18.01.07 Configure TLS/domain.
- [ ] SUBTASK-18.01.08 Configure deployment user and least privilege.

## TASK-18.02 — Backup dan recovery

- [ ] SUBTASK-18.02.01 Automated database backup.
- [ ] SUBTASK-18.02.02 Object storage retention/versioning.
- [ ] SUBTASK-18.02.03 Secret backup strategy.
- [ ] SUBTASK-18.02.04 Restore procedure.
- [ ] SUBTASK-18.02.05 Perform restore drill.
- [ ] SUBTASK-18.02.06 Record RPO/RTO.

## TASK-18.03 — Monitoring dan alerting

- [ ] SUBTASK-18.03.01 Application availability.
- [ ] SUBTASK-18.03.02 API latency/error rate.
- [ ] SUBTASK-18.03.03 Database saturation.
- [ ] SUBTASK-18.03.04 Queue depth.
- [ ] SUBTASK-18.03.05 Sandbox failure/startup time.
- [ ] SUBTASK-18.03.06 Storage/CPU/memory alerts.
- [ ] SUBTASK-18.03.07 Provider/search error alerts.
- [ ] SUBTASK-18.03.08 Cost anomaly alert.

## TASK-18.04 — Incident runbooks

- [ ] SUBTASK-18.04.01 Provider outage.
- [ ] SUBTASK-18.04.02 Search outage.
- [ ] SUBTASK-18.04.03 Database degradation.
- [ ] SUBTASK-18.04.04 Secret exposure.
- [ ] SUBTASK-18.04.05 Sandbox compromise.
- [ ] SUBTASK-18.04.06 Billing/quota incident.
- [ ] SUBTASK-18.04.07 Rollback release.

## TASK-18.05 — Rollout

- [ ] SUBTASK-18.05.01 Internal alpha allowlist.
- [ ] SUBTASK-18.05.02 Collect structured feedback.
- [ ] SUBTASK-18.05.03 Closed beta cohort.
- [ ] SUBTASK-18.05.04 Feature-flag sandbox.
- [ ] SUBTASK-18.05.05 Public beta readiness review.
- [ ] SUBTASK-18.05.06 General availability checklist.

---

# Suggested First Execution Batch

Urutan pekerjaan pertama yang dapat langsung dijalankan:

1. EPIC-00 Product Discovery & Governance.
2. TASK-01.01 Repository standards.
3. TASK-01.02 Database foundation.
4. TASK-01.03 API conventions.
5. TASK-01.04 Authentication dan session.
6. TASK-02.01 Design tokens.
7. TASK-02.02 Core components.
8. TASK-03.01 Thesis data model.
9. TASK-15.01 Sandbox feasibility spike secara paralel.

Jangan memulai full sandbox implementation sebelum entitlement, queue, dan threat model selesai.

---

# EPIC-19 — Clerk Identity & Admission Control

## TASK-19.01 — Clerk integration
- [ ] Install/configure `@clerk/nuxt` dan environment schema.
- [ ] Replace prototype login dan protect routes.
- [ ] Verify Clerk JWT pada BFF.
- [ ] Handle pending/suspended session.

## TASK-19.02 — Campus Registry dan admission
- [ ] Campus/domain/trust schema.
- [ ] Exact/wildcard approved-domain matcher.
- [ ] Google Workspace auto-verification.
- [ ] Gmail pending-verification flow.
- [ ] Disposable-domain blocklist.
- [ ] One-NIM-one-identity constraint.
- [ ] Manual review dan audit.

## TASK-19.03 — KTM/SIAKAD verification
- [ ] Verification request dan upload policy.
- [ ] OCR, confidence threshold, manual queue.
- [ ] Retention/deletion job.
- [ ] Adapter untuk SIAKAD/SSO resmi; jangan simpan password.

# EPIC-20 — Appwrite Platform Integration

- [~] Configure Sites, Functions, Database, Storage, dan Messaging. _(Database schema designed and self-validated in `domain/repository/appwriteSchema.ts` + `scripts/setupAppwriteSchema.ts`. Sites, Functions, Storage, Messaging NOT configured — out of scope for Batch 6, no credentials available to configure them anyway.)_
- [x] Web/Server SDK clients dan environment validation. _(`domain/repository/appwriteClient.ts` — browser SDK via `appwrite` package; `scripts/setupAppwriteSchema.ts` — server SDK via `node-appwrite`. Both throw a clear `AppwriteNotConfiguredError`/exit code instead of silently no-op'ing when env vars are missing.)_
- [ ] Clerk webhook dan profile bootstrap by `clerkUserId`. _(Blocked on EPIC-19/Clerk, which is not installed yet. Current bridge is an Appwrite anonymous session — see honesty note below.)_
- [x] Ownership filter pada seluruh read/write. _(Every table has `rowSecurity: true`; every write grants `Permission.read/update/delete(Role.user(ownerId))` only; every read query filters `Query.equal('ownerId', ownerId)`. Enforced by Appwrite itself, not just application code — see `domain/repository/appwrite.ts`.)_
- [ ] Staging/production Appwrite projects. _(No Appwrite project of any kind exists yet — nothing to point staging/production at.)_

**Batch 6 honesty note — read before relying on this:**

Everything above marked `[x]` has been reviewed against the documented
node-appwrite v29 / appwrite v28 SDK API surface and is unit-tested where
unit-testing is possible without a live project
(`tests/appwriteMapping.test.ts`, `domain/repository/appwriteSchema.ts`'s
`validateSchema`). **None of it has been executed against a real Appwrite
instance** — this development environment has no Appwrite project, API key,
or project ID available, and none were provided. Specifically unverified:

- Whether `createTable`/`createStringColumn`/etc. in
  `scripts/setupAppwriteSchema.ts` actually produce the schema described in
  `appwriteSchema.ts` when run against a real project.
- Whether `TablesDB.listRows`/`createRow`/`updateRow`/`deleteRow` in
  `domain/repository/appwrite.ts` behave as the type signatures suggest at
  runtime (row security, permission scoping, query filtering).
- Whether the anonymous-session bridge in `appwriteClient.ts` actually
  persists a stable `ownerId` across page reloads in a real browser.

Treat the Appwrite adapter as **written and internally consistent, not
integration-tested**. Before using it for real user data: run
`scripts/setupAppwriteSchema.ts` against a staging project, manually drive
the writing/revision/bimbingan UI with `createRepositories({ backend:
'appwrite', databaseId })` wired in, and confirm rows appear correctly
scoped per anonymous session in the Appwrite console.

# EPIC-21 — Offers, Promotions & Notifications

- [ ] EligibilityRule, Offer, Grant, dan redemption schema.
- [ ] Verified-student Pro trial dengan anti-farming.
- [ ] Domain-event contract dan notification rules.
- [ ] In-app inbox dan Appwrite Messaging dispatcher.
- [ ] Delivery retry, preference, expiry, dan revocation.

# EPIC-22 — Pricing & Managed AI Economics

- [ ] Free/Pro/Semester/Builder experiment configurations.
- [ ] `ruang-fast`, `ruang-research`, `ruang-builder` aliases.
- [ ] Primary/fallback mapping dan health failover.
- [ ] Model/search price catalog dan per-job estimator.
- [ ] Per-feature cost ceiling dan actual-cost ledger.
- [ ] Journal pipeline: query limit, dedupe, rank, top-N fetch, synthesis, cache.
- [ ] Provider policy berdasarkan data class.

# EPIC-23 — VPS Sandbox Worker Bridge

- [ ] Signed short-lived job claims dan replay prevention.
- [ ] Reserve/finalize/refund Pro quota.
- [ ] Queue transport dari Appwrite Function ke VPS runner.
- [ ] Runner heartbeat dan event persistence.
- [ ] Upload validated artifact ke Appwrite Storage.
- [ ] Pastikan tidak ada public SSH/browser-to-runner path.

---

# Implementation Status — Batch 1

Selesai pada batch pertama:

- [x] Restore dan update PRD/PERENCANAAN/TASKS.
- [x] Install SDK resmi Clerk, Appwrite Web, dan Appwrite Server.
- [x] Add conditional Clerk module dan runtime environment schema.
- [x] Add Appwrite admin client foundation.
- [x] Add provider registry dengan 15 provider native/planned/compatible.
- [x] Add logical aliases `ruang-fast`, `ruang-research`, dan `ruang-builder`.
- [x] Add curated capability registry dan conservative fallback.
- [x] Add model-aware thinking request validation.
- [x] Add model capability UI; unsupported controls disembunyikan.
- [x] Add custom base URL only for Custom provider.
- [x] Add DNS/private-network/link-local SSRF protection dan redirect blocking.
- [x] Add model/search price snapshot dan cost estimator.
- [x] Add Free/Student Pro/Semester/Builder/Institution plan registry.
- [x] Add server-side feature entitlement helper.
- [x] Add verified-student trial eligibility engine dan anti-repeat/risk rules.
- [x] Add admission status/domain matching foundation.
- [x] Add Exa search endpoint dengan top-10 cap, rate limit, provenance, dan no-content default.
- [x] Add DOI/canonical deduplication foundation.
- [x] Connect Journal Finder UI ke endpoint research search.
- [x] Add platform, plan, dan AI catalog metadata endpoints.
- [x] Add 8 foundation tests dan production build validation.

Belum dapat diselesaikan tanpa kredensial/infrastruktur eksternal:

- [ ] Aktifkan Clerk application dan replace prototype auth setelah key tersedia.
- [ ] Provision Appwrite project/database/buckets/functions/messaging.
- [ ] Isi Exa key untuk live Journal Finder.
- [ ] Provision queue dan VPS sandbox worker terpisah.
- [ ] Hubungkan payment provider.

## Implementation Status — Batch 2

Selesai tanpa menunggu Clerk/Appwrite credentials:

- [x] Enam template kerangka: kuantitatif, kualitatif, mixed method, R&D, studi literatur, dan teknik/informatika.
- [x] Struktur hierarkis bab, subbab, objective, target kata, evidence requirement, dan status.
- [x] Readiness engine dengan critical/warning checks dan explainable score.
- [x] Final Blueprint gate berdasarkan judul, bab, rumusan-tujuan, dan metodologi.
- [x] Ringkasan jumlah bab, bagian, target kata, dan bagian tanpa sumber.
- [x] Research-context form; readiness tidak memakai rumusan/tujuan palsu.
- [x] Outline template dan readiness API endpoints.
- [x] UI pemilih template, hierarchical outline, readiness inspector, dan local persistence.
- [x] Source Library local foundation.
- [x] Editable Research Matrix dengan evidence-level dan verification state.
- [x] DOI/access-route deduplication terhubung ke source saving.
- [x] Tambahan unit tests untuk template dan readiness engine.

## Implementation Status — Batch 3

Selesai dengan evidence rules eksplisit:

- [x] Claim Ledger domain dan UI.
- [x] Evidence links menyimpan source, level, stance, verification, dan optional excerpt.
- [x] Status klaim: unsupported, weak, supported, dan conflicting.
- [x] Metadata tidak dapat membuktikan klaim; snippet hanya dihitung sebagai bukti lemah.
- [x] Strong support membutuhkan minimal dua bukti terverifikasi dari abstract/full-text/user-file.
- [x] Conflicting evidence tetap ditampilkan dan wajib dibahas.
- [x] Literature Synthesis preparation gate membutuhkan minimal tiga sumber terverifikasi dan klaim traceable.
- [x] Unsupported claims dikeluarkan dari synthesis packet, bukan diisi AI secara spekulatif.
- [x] Evidence-to-Outline mapping melalui `outlineNodeId`.
- [x] Source IDs pada outline disinkronkan dari claim links.
- [x] Deterministic Consistency Engine untuk structure, problem-objective alignment, methodology, duplicate sections, claim support, conflicts, dan conclusion links.
- [x] Explainable consistency score dan related entity IDs.
- [x] API endpoints untuk claim evaluation, synthesis preparation, dan consistency checking.
- [x] 13 foundation/rules tests lulus dan production build tervalidasi.

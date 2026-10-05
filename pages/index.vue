<script setup lang="ts">
import {
  ArrowRight, BookOpen, Check, ChevronRight, FileText, Library,
  Menu, Play, Search, Send, X
} from 'lucide-vue-next'

const menuOpen = ref(false)
const demoOpen = ref(false)
const router = useRouter()
const activeStage = ref(0)
const activeLab = ref('Bedah argumen')
const prompt = ref('Apakah rumusan masalah saya sudah cukup tajam?')
const labReply = ref('')
let motionCleanup: (() => void) | undefined
const stages = [
  { no: '01', title: 'Susun kerangka', text: 'Pecah topik menjadi bab, pertanyaan riset, dan target mingguan yang bisa dikerjakan.' },
  { no: '02', title: 'Uji di AI Lab', text: 'Periksa logika, cari celah argumen, lalu dapatkan saran yang tetap bisa Anda kendalikan.' },
  { no: '03', title: 'Kelola revisi', text: 'Simpan catatan dosen di bagian yang tepat. Tidak ada lagi komentar tercecer di lima versi file.' },
  { no: '04', title: 'Siapkan sidang', text: 'Ringkas temuan, latih pertanyaan penguji, dan rapikan bahan presentasi.' },
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  menuOpen.value = false
}

function runLab() {
  labReply.value = 'Rumusan ini sudah menyebut objek, tetapi belum menunjukkan batas waktu dan variabel utama. Coba: “Bagaimana X memengaruhi Y pada mahasiswa tingkat akhir UNED selama 2025–2026?”'
}

onMounted(async () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)

  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } })
  intro
    .from('.hero-image', { scale: 1.09, duration: 2.2, ease: 'expo.out' })
    .from('.eyebrow', { scaleX: 0, transformOrigin: 'left center', duration: .65 }, .18)
    .from('.hero-title-line > span', { yPercent: 115, rotate: 2, duration: 1.05, stagger: .13 }, .22)
    .from('.hero-copy > p, .hero-actions', { y: 28, opacity: 0, duration: .8, stagger: .12 }, .62)
    .from('.hero-foot > *', { y: 18, opacity: 0, duration: .65, stagger: .09 }, .92)

  gsap.to('.hero-image', {
    yPercent: 9,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .8 },
  })

  gsap.utils.toArray<HTMLElement>('.motion-copy').forEach((element) => {
    gsap.from(element, {
      y: 54,
      clipPath: 'inset(0 0 100% 0)',
      duration: 1.05,
      ease: 'power3.out',
      scrollTrigger: { trigger: element, start: 'top 84%', once: true },
    })
  })

  gsap.from('.stage-preview', {
    y: 80, rotate: 2.4, duration: 1.25, ease: 'power3.out',
    scrollTrigger: { trigger: '.stage-layout', start: 'top 78%', once: true },
  })
  gsap.from('.stage-row', {
    x: -30, duration: .72, stagger: .1, ease: 'power3.out',
    scrollTrigger: { trigger: '.stage-list', start: 'top 82%', once: true },
  })
  gsap.from('.lab-console', {
    xPercent: 24, rotate: 4, duration: 1.3, ease: 'expo.out',
    scrollTrigger: { trigger: '.lab-section', start: 'top 70%', once: true },
  })
  gsap.from('.library-browser', {
    xPercent: 18, clipPath: 'inset(0 0 0 100%)', duration: 1.15, ease: 'power4.out',
    scrollTrigger: { trigger: '.library-section', start: 'top 74%', once: true },
  })
  gsap.from('.revision-board', {
    rotate: -3, y: 70, duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.revision-section', start: 'top 72%', once: true },
  })
  gsap.to('.closing-graphic', {
    rotate: 7, y: -10, ease: 'none',
    scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'center center', scrub: 1 },
  })

  motionCleanup = () => {
    intro.kill()
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
  }
})

onBeforeUnmount(() => motionCleanup?.())
</script>

<template>
  <main>
    <section class="hero">
      <div class="hero-image" aria-hidden="true" />
      <div class="hero-shade" aria-hidden="true" />
      <HeroMotionField />

      <header class="nav-wrap">
        <nav class="nav shell" aria-label="Navigasi utama">
          <button class="brand" aria-label="Ke beranda" @click="scrollTo('beranda')">
            <MotionLogo />
            <span>Ruang Skripsi</span>
          </button>
          <div class="nav-links" :class="{ open: menuOpen }">
            <button @click="scrollTo('alur')">Alur</button>
            <button @click="scrollTo('fitur')">Fitur</button>
            <button @click="scrollTo('jurnal')">Jurnal</button>
            <button @click="scrollTo('harga')">Harga</button>
          </div>
          <div class="nav-actions">
            <button class="login" @click="router.push('/masuk')">Masuk</button>
            <button class="nav-cta" @click="router.push('/daftar')">Mulai menulis</button>
            <button class="menu-btn" aria-label="Buka menu" @click="menuOpen = !menuOpen">
              <X v-if="menuOpen" :size="21" />
              <Menu v-else :size="21" />
            </button>
          </div>
        </nav>
      </header>

      <div id="beranda" class="hero-copy shell">
        <div class="eyebrow">Ruang kerja mahasiswa tingkat akhir</div>
        <h1>
          <span class="hero-title-line"><span>Skripsi terasa</span></span>
          <span class="hero-title-line"><span><em>lebih terarah.</em></span></span>
        </h1>
        <p>Susun kerangka, baca jurnal, dan bereskan revisi dosen dalam satu ruang kerja. Anda tetap menulis. Kami membantu menjaga arahnya.</p>
        <div class="hero-actions">
          <button class="button primary" @click="scrollTo('fitur')">
            Mulai dari kerangka <ArrowRight :size="18" />
          </button>
          <button class="button text-button" @click="demoOpen = true">
            <span class="play"><Play :size="14" fill="currentColor" /></span> Lihat cara kerja
          </button>
        </div>
      </div>

      <div class="hero-foot shell">
        <div class="trust">
          <div class="avatars"><span>AN</span><span>RK</span><span>MF</span></div>
          <p><b>4.800+ mahasiswa</b><br>sedang merapikan skripsinya</p>
        </div>
        <button class="scroll-hint" @click="scrollTo('alur')">Lihat alurnya <span>↓</span></button>
        <div class="hero-note">
          <BookOpen :size="18" />
          <span>Mulai dari satu halaman kosong.<br><b>Pulang dengan rencana.</b></span>
        </div>
      </div>
    </section>

    <section id="alur" class="section intro shell">
      <div class="section-kicker">Satu alur, empat tahap</div>
      <div class="intro-heading motion-copy">
        <h2>Kerja besar terasa ringan saat langkah berikutnya jelas.</h2>
        <p>Ruang Skripsi mengikuti cara kerja penelitian: menyusun, menguji, memperbaiki, lalu mempertahankan hasilnya.</p>
      </div>
      <div class="stage-layout">
        <div class="stage-list">
          <button
            v-for="(stage, i) in stages" :key="stage.no"
            class="stage-row" :class="{ active: activeStage === i }"
            @click="activeStage = i"
          >
            <span>{{ stage.no }}</span>
            <div><h3>{{ stage.title }}</h3><p>{{ stage.text }}</p></div>
            <ChevronRight :size="20" />
          </button>
        </div>
        <div class="stage-preview">
          <div class="paper-top">
            <span>PROYEK / BAB 1</span>
            <span class="saved"><Check :size="13" /> Tersimpan</span>
          </div>
          <div class="paper">
            <div class="paper-title">Pengaruh ruang belajar digital terhadap konsistensi mahasiswa</div>
            <div class="paper-meta">KERANGKA PENELITIAN</div>
            <div class="outline-line"><span class="done"><Check :size="13" /></span><b>Latar belakang</b><small>642 kata</small></div>
            <div class="outline-line"><span>2</span><b>Rumusan masalah</b><small>Sedang ditulis</small></div>
            <div class="outline-line faint"><span>3</span><b>Tujuan penelitian</b><small>Belum mulai</small></div>
            <div class="coach-note">
              <span class="coach-index">02</span>
              <p><b>Saran berikutnya</b><br>Hubungkan data awal dengan alasan memilih responden.</p>
              <button aria-label="Buka saran"><ArrowRight :size="16" /></button>
            </div>
          </div>
          <div class="progress-ring"><b>68%</b><span>Bab 1</span></div>
        </div>
      </div>
    </section>

    <section id="fitur" class="lab-section">
      <div class="shell lab-grid">
        <div class="lab-copy motion-copy">
          <div class="section-kicker light">AI Lab Skripsi</div>
          <h2>Bawa masalah yang spesifik. Dapatkan jawaban yang bisa dipakai.</h2>
          <p>AI Lab membaca konteks proyek Anda, bukan sekadar satu prompt. Setiap saran menyertakan alasan dan bagian yang perlu Anda cek sendiri.</p>
          <div class="lab-tabs">
            <button v-for="tab in ['Bedah argumen','Cari celah','Simulasi penguji']" :key="tab" :class="{active: activeLab === tab}" @click="activeLab = tab">{{ tab }}</button>
          </div>
          <ul class="plain-list">
            <li><Check :size="18" /> Tidak menulis kesimpulan tanpa sumber</li>
            <li><Check :size="18" /> Menandai asumsi yang perlu dibuktikan</li>
            <li><Check :size="18" /> Riwayat diskusi tersimpan per bab</li>
          </ul>
        </div>
        <div class="lab-console">
          <div class="console-head">
            <div><span class="lab-index">LAB / 01</span><span>{{ activeLab }}</span></div>
            <span class="context">Konteks: Bab 1–3</span>
          </div>
          <div class="question">
            <span>ANDA</span>
            <p>{{ prompt }}</p>
          </div>
          <div v-if="labReply" class="answer">
            <div class="ai-mark"><MotionLogo /></div>
            <p>{{ labReply }}</p>
          </div>
          <div v-else class="answer placeholder-answer">
            <div class="ai-mark"><MotionLogo /></div>
            <p>Saya akan menilai fokus, ruang lingkup, dan kemungkinan datanya sebelum memberi usulan perbaikan.</p>
          </div>
          <div class="prompt-box">
            <textarea v-model="prompt" aria-label="Pertanyaan untuk AI Lab" rows="2" />
            <button aria-label="Kirim pertanyaan" @click="runLab"><Send :size="18" /></button>
          </div>
          <p class="console-foot">AI dapat keliru. Periksa sumber dan keputusan penting bersama dosen pembimbing.</p>
        </div>
      </div>
    </section>

    <section id="jurnal" class="section library-section shell">
      <div class="library-copy motion-copy">
        <div class="section-kicker">Kumpulan jurnal</div>
        <h2>Referensi yang nyambung dengan pertanyaan riset Anda.</h2>
        <p>Cari lintas repositori, simpan kutipan, lalu kelompokkan sumber berdasarkan argumen. Metadata tetap rapi saat dipindahkan ke daftar pustaka.</p>
        <button class="inline-link">Jelajahi perpustakaan <ArrowRight :size="17" /></button>
      </div>
      <div class="library-browser">
        <div class="searchbar"><Search :size="18" /><span>digital learning + student persistence</span><kbd>⌘ K</kbd></div>
        <div class="browser-body">
          <aside>
            <b>Filter hasil</b>
            <label><input type="checkbox" checked> Open access</label>
            <label><input type="checkbox"> 5 tahun terakhir</label>
            <label><input type="checkbox"> Bahasa Indonesia</label>
          </aside>
          <div class="results">
            <p class="result-count">128 HASIL · DIURUTKAN BERDASARKAN RELEVANSI</p>
            <article>
              <span class="journal-tag">Open access</span>
              <h3>Digital learning environments and undergraduate persistence</h3>
              <p>Journal of Learning Research · 2025</p>
              <div><span>Relevansi tinggi</span><button>+ Simpan</button></div>
            </article>
            <article>
              <span class="journal-tag neutral">Mixed method</span>
              <h3>Study routines, digital tools, and completion rates</h3>
              <p>Higher Education Review · 2024</p>
              <div><span>32 sitasi</span><button>+ Simpan</button></div>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="revision-section">
      <div class="shell revision-grid">
        <div class="revision-board">
          <div class="doc-head"><FileText :size="18" /><b>Bab 3 — Metodologi</b><span>V.7</span></div>
          <p>Penelitian ini menggunakan pendekatan <mark>kuantitatif dengan metode survei</mark> untuk memahami hubungan antara...</p>
          <div class="comment-line">
            <span class="comment-avatar">DP</span>
            <div><b>Bu Diana · Pembimbing</b><p>Jelaskan alasan memilih survei. Kaitkan dengan jenis data yang ingin dikumpulkan.</p></div>
          </div>
          <div class="resolved-line"><Check :size="16" /> 7 revisi selesai minggu ini</div>
        </div>
        <div class="revision-copy motion-copy">
          <div class="section-kicker">Ruang revisi</div>
          <h2>Komentar dosen tidak lagi hilang di tumpukan versi.</h2>
          <p>Tempel masukan pada paragraf yang dimaksud, tetapkan statusnya, dan lihat apa yang berubah dari versi sebelumnya.</p>
          <div class="revision-stats"><div><b>12</b><span>Aktif</span></div><div><b>31</b><span>Selesai</span></div><div><b>3</b><span>Perlu diskusi</span></div></div>
        </div>
      </div>
    </section>

    <section id="harga" class="closing shell">
      <div class="closing-graphic"><MotionLogo /></div>
      <p class="section-kicker">Mulai hari ini</p>
      <h2 class="motion-copy">Satu bab yang rapi lebih berguna daripada sepuluh tab yang terbuka.</h2>
      <p>Buat ruang kerja pertama gratis. Tidak perlu kartu kredit.</p>
      <button class="button primary" @click="router.push('/daftar')">Buat ruang skripsi <ArrowRight :size="18" /></button>
    </section>

    <footer class="footer shell">
      <div class="brand footer-brand"><MotionLogo /><span>Ruang Skripsi</span></div>
      <p>Tempat berpikir, menulis, dan selesai.</p>
      <div><a href="#">Privasi</a><a href="#">Bantuan</a><a href="#">Instagram</a></div>
      <small>© 2026 Ruang Skripsi</small>
    </footer>

    <Transition name="modal">
      <div v-if="demoOpen" class="modal-backdrop" @click.self="demoOpen = false">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="demo-title">
          <button class="modal-close" aria-label="Tutup" @click="demoOpen = false"><X :size="20" /></button>
          <div class="modal-icon"><Library :size="26" /></div>
          <p class="section-kicker">Ruang baru</p>
          <h2 id="demo-title">Skripsi Anda membahas apa?</h2>
          <p>Tulis topik sementara. Kerangkanya bisa berubah nanti.</p>
          <input autofocus placeholder="Contoh: kebiasaan belajar mahasiswa..." />
          <button class="button primary" @click="router.push('/daftar')">Buat kerangka awal <ArrowRight :size="18" /></button>
        </div>
      </div>
    </Transition>
  </main>
</template>
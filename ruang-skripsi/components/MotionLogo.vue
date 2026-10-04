<script setup lang="ts">
const canvas = ref<HTMLCanvasElement | null>(null)
let raf = 0

onMounted(() => {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const size = 72
  el.width = size * dpr
  el.height = size * dpr
  ctx.scale(dpr, dpr)
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const draw = (time = 0) => {
    const t = reduced ? 1200 : time
    ctx.clearRect(0, 0, size, size)
    ctx.save()
    ctx.translate(36, 36)

    // Quiet halo.
    ctx.beginPath()
    ctx.arc(0, 0, 30, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(246, 241, 222, .12)'
    ctx.fill()

    // Three orbiting reference points leave fading trails.
    for (let ring = 0; ring < 3; ring++) {
      const radius = 17 + ring * 4
      const phase = t * (0.00065 + ring * 0.00012) + ring * 2.1
      for (let trail = 9; trail >= 0; trail--) {
        const a = phase - trail * 0.045
        const x = Math.cos(a) * radius
        const y = Math.sin(a * 1.18) * (radius * 0.62)
        ctx.beginPath()
        ctx.arc(x, y, 1.5 - trail * 0.09, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(236, 190, 96, ${0.5 - trail * 0.045})`
        ctx.fill()
      }
    }

    // A book mark built from animated bezier "pages".
    for (let i = 0; i < 6; i++) {
      const lift = Math.sin(t * 0.0018 + i * 0.72) * 1.5
      const inset = i * 1.15
      ctx.beginPath()
      ctx.moveTo(0, 18 - inset * 0.18)
      ctx.bezierCurveTo(-7, 11 + lift, -17 + inset, 10 - lift, -22 + inset, 14 - inset)
      ctx.bezierCurveTo(-15, 2 + lift, -7, 1 - lift, 0, 7)
      ctx.strokeStyle = `rgba(255,255,255,${0.92 - i * 0.11})`
      ctx.lineWidth = 1.45
      ctx.lineCap = 'round'
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, 18 - inset * 0.18)
      ctx.bezierCurveTo(7, 11 - lift, 17 - inset, 10 + lift, 22 - inset, 14 - inset)
      ctx.bezierCurveTo(15, 2 - lift, 7, 1 + lift, 0, 7)
      ctx.stroke()
    }

    // Central pulse: the "idea" moving through the book.
    const pulse = 2.6 + Math.sin(t * 0.003) * 0.8
    ctx.beginPath()
    ctx.arc(0, 5, pulse, 0, Math.PI * 2)
    ctx.fillStyle = '#f0bd58'
    ctx.shadowColor = '#f0bd58'
    ctx.shadowBlur = 12
    ctx.fill()
    ctx.restore()
    if (!reduced) raf = requestAnimationFrame(draw)
  }
  draw()
})

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <canvas ref="canvas" class="motion-logo" width="72" height="72" aria-label="Logo bergerak Ruang Skripsi" />
</template>

<style scoped>
.motion-logo { width: 42px; height: 42px; display: block; }
</style>
<script setup lang="ts">
const canvas = ref<HTMLCanvasElement | null>(null)
let frame = 0
let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  const el = canvas.value
  if (!el) return
  const ctx = el.getContext('2d')
  const host = el.parentElement
  if (!ctx || !host) return
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  let width = 0
  let height = 0
  let pointerX = 0
  let pointerY = 0

  const resize = () => {
    const box = host.getBoundingClientRect()
    width = box.width
    height = box.height
    const dpr = Math.min(devicePixelRatio || 1, 2)
    el.width = Math.round(width * dpr)
    el.height = Math.round(height * dpr)
    el.style.width = `${width}px`
    el.style.height = `${height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  const move = (event: PointerEvent) => {
    pointerX = event.clientX / Math.max(width, 1) - .5
    pointerY = event.clientY / Math.max(height, 1) - .5
  }
  const point = (p0: number[], p1: number[], p2: number[], p3: number[], t: number) => {
    const u = 1 - t
    return [
      u ** 3 * p0[0] + 3 * u ** 2 * t * p1[0] + 3 * u * t ** 2 * p2[0] + t ** 3 * p3[0],
      u ** 3 * p0[1] + 3 * u ** 2 * t * p1[1] + 3 * u * t ** 2 * p2[1] + t ** 3 * p3[1],
    ]
  }
  const paths = [
    { from: [.35, .93], c1: [.26, .70], c2: [.31, .58], to: [.47, .51], delay: .04 },
    { from: [.52, .95], c1: [.60, .73], c2: [.66, .70], to: [.72, .57], delay: .31 },
    { from: [.68, .92], c1: [.77, .78], c2: [.73, .65], to: [.64, .55], delay: .59 },
  ]

  const draw = (now = 0) => {
    const time = reduced ? 2300 : now
    ctx.clearRect(0, 0, width, height)
    const driftX = pointerX * 13
    const driftY = pointerY * 8

    paths.forEach((path, index) => {
      const p0 = [path.from[0] * width + driftX, path.from[1] * height + driftY]
      const p1 = [path.c1[0] * width, path.c1[1] * height]
      const p2 = [path.c2[0] * width, path.c2[1] * height]
      const p3 = [path.to[0] * width - driftX * .35, path.to[1] * height - driftY * .35]

      ctx.beginPath()
      ctx.moveTo(p0[0], p0[1])
      ctx.bezierCurveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1])
      ctx.strokeStyle = `rgba(238,196,111,${.13 + index * .025})`
      ctx.lineWidth = .8
      ctx.setLineDash([2, 7])
      ctx.stroke()
      ctx.setLineDash([])

      const phase = (time * .000075 + path.delay) % 1
      for (let trail = 8; trail >= 0; trail--) {
        const position = (phase - trail * .012 + 1) % 1
        const [x, y] = point(p0, p1, p2, p3, position)
        ctx.beginPath()
        ctx.arc(x, y, Math.max(.7, 2.3 - trail * .19), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(239,188,87,${.8 - trail * .09})`
        ctx.fill()
      }

    })
    if (!reduced) frame = requestAnimationFrame(draw)
  }

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  host.addEventListener('pointermove', move)
  resize()
  draw()

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame)
    resizeObserver?.disconnect()
    host.removeEventListener('pointermove', move)
  })
})
</script>

<template>
  <canvas ref="canvas" class="hero-motion-field" aria-hidden="true" />
</template>
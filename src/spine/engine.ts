/**
 * The spine engine — raw WebGL 1, no dependencies. Ported from
 * mohr-media-site/assets/spine.js and reshaped as a factory with a
 * clean destroy() so React can own its lifecycle.
 *
 * Contracts that matter:
 *  - destroy() frees GL resources but never loses the context —
 *    React StrictMode remounts reuse the same canvas/context.
 *  - returns null when reduced motion is on or WebGL is unavailable;
 *    the caller renders a static fallback instead.
 *  - zero layout reads inside the rAF loop; section offsets are
 *    cached in computeRegistry (resize/ResizeObserver only).
 */

import { hexToVec3, type SpineConfig, type SpineEngine, type SpineHud } from './config'
import { buildWorld, C, N_STATIONS } from './geometry'
import { buildCompFS, buildPointVS, POINT_FS, QUAD_VS } from './shaders'

const TAU = Math.PI * 2

function elerp(cur: number, target: number, k: number, dt: number): number {
  const a = 1 - Math.exp(-k * dt)
  const next = cur + (target - cur) * a
  return Math.abs(target - next) < 0.0005 ? target : next
}

export function createSpineEngine(canvas: HTMLCanvasElement, config: SpineConfig): SpineEngine | null {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) return null
  const fine = window.matchMedia('(pointer: fine)').matches

  /* dev escape hatch: ?forcegl accepts software rendering so the world
     can be inspected in VMs/headless browsers */
  const forceGL = new URLSearchParams(window.location.search).has('forcegl')
  const attrs: WebGLContextAttributes = {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: !forceGL,
  }
  const gl = canvas.getContext('webgl', attrs)
  if (!gl) return null

  /* ---------- shader programs ---------- */
  function compile(type: number, src: string): WebGLShader | null {
    const s = gl!.createShader(type)
    if (!s) return null
    gl!.shaderSource(s, src)
    gl!.compileShader(s)
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      console.error(gl!.getShaderInfoLog(s))
      return null
    }
    return s
  }
  function program(vs: string, fs: string): WebGLProgram | null {
    const v = compile(gl!.VERTEX_SHADER, vs)
    const f = compile(gl!.FRAGMENT_SHADER, fs)
    if (!v || !f) return null
    const p = gl!.createProgram()
    if (!p) return null
    gl!.attachShader(p, v)
    gl!.attachShader(p, f)
    gl!.linkProgram(p)
    if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) {
      console.error(gl!.getProgramInfoLog(p))
      return null
    }
    return p
  }

  const progPoints = program(buildPointVS(!!config.dark), POINT_FS)
  const progComp = program(QUAD_VS, buildCompFS(!!config.dark))
  if (!progPoints || !progComp) return null

  /* ---------- geometry ---------- */
  const world = buildWorld(Math.min(window.innerWidth, window.innerHeight))
  const N = world.count
  let drawN = N

  gl.useProgram(progPoints)
  function attach(name: string, data: Float32Array): WebGLBuffer {
    const buf = gl!.createBuffer()!
    gl!.bindBuffer(gl!.ARRAY_BUFFER, buf)
    gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.STATIC_DRAW)
    const loc = gl!.getAttribLocation(progPoints!, name)
    gl!.enableVertexAttribArray(loc)
    gl!.vertexAttribPointer(loc, 3, gl!.FLOAT, false, 0, 0)
    return buf
  }
  const bufHome = attach('aHome', world.home)
  const bufScat = attach('aScatter', world.scat)
  const bufMeta = attach('aMeta', world.meta)
  function rebindPoints() {
    const pairs: Array<[string, WebGLBuffer]> = [
      ['aHome', bufHome],
      ['aScatter', bufScat],
      ['aMeta', bufMeta],
    ]
    for (const [name, buf] of pairs) {
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buf)
      const loc = gl!.getAttribLocation(progPoints!, name)
      gl!.enableVertexAttribArray(loc)
      gl!.vertexAttribPointer(loc, 3, gl!.FLOAT, false, 0, 0)
    }
  }

  const quadBuf = gl.createBuffer()!
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  function bindQuad(prog: WebGLProgram) {
    gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuf)
    const loc = gl!.getAttribLocation(prog, 'aP')
    gl!.enableVertexAttribArray(loc)
    gl!.vertexAttribPointer(loc, 2, gl!.FLOAT, false, 0, 0)
  }

  /* ---------- uniforms ---------- */
  const U: Record<string, WebGLUniformLocation | null> = {}
  for (const n of ['uProj', 'uView', 'uTime', 'uMaxV', 'uFocusV', 'uVel', 'uPulse', 'uPulseV', 'uSizeMul', 'uMinPx', 'uAspect', 'uMouse', 'uAudio', 'uColA', 'uColB', 'uColC']) {
    U[n] = gl.getUniformLocation(progPoints, n)
  }
  const [colA, colB, colC] = config.palette.map(hexToVec3)
  gl.useProgram(progPoints)
  gl.uniform3f(U.uColA, colA[0], colA[1], colA[2])
  gl.uniform3f(U.uColB, colB[0], colB[1], colB[2])
  gl.uniform3f(U.uColC, colC[0], colC[1], colC[2])

  /* ---------- section registry (zero rect reads in rAF) ---------- */
  const sections = config.sections
  const nSec = sections.length
  const sFracs = new Array<number>(nSec).fill(0)
  const V_TARGETS = sections.map((_, i) => (nSec > 1 ? i / (nSec - 1) : 0))
  function computeRegistry() {
    const max = document.documentElement.scrollHeight - window.innerHeight
    sections.forEach((sec, i) => {
      const el = document.getElementById(sec.id)
      if (!el || max <= 0) {
        sFracs[i] = i / (nSec - 1)
        return
      }
      sFracs[i] = Math.min(1, Math.max(0, (el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2) / max))
    })
    sFracs[0] = 0
    sFracs[nSec - 1] = Math.max(sFracs[nSec - 1], 0.999)
  }
  computeRegistry()
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => computeRegistry()) : null
  ro?.observe(document.body)

  function scrollToV(s: number): number {
    if (s <= sFracs[0]) return V_TARGETS[0]
    for (let i = 0; i < sFracs.length - 1; i++) {
      if (s <= sFracs[i + 1]) {
        const t = (s - sFracs[i]) / Math.max(1e-5, sFracs[i + 1] - sFracs[i])
        const sm = t * t * (3 - 2 * t)
        const tb = 0.5 * t + 0.5 * sm
        return V_TARGETS[i] + (V_TARGETS[i + 1] - V_TARGETS[i]) * tb
      }
    }
    return V_TARGETS[V_TARGETS.length - 1]
  }

  /* ---------- HUD subscription ---------- */
  const hudSubs = new Set<(hud: SpineHud) => void>()
  let activeWpt = -1
  let lastPct = ''
  function updateHud(vCam: number) {
    if (hudSubs.size === 0) return
    const max = document.documentElement.scrollHeight - window.innerHeight
    const s = max > 0 ? window.scrollY / max : 0
    let idx = 0
    for (let i = 0; i < sFracs.length; i++) if (s >= sFracs[i] - 0.04) idx = i
    let pct = (vCam * 100).toFixed(1)
    while (pct.length < 5) pct = '0' + pct
    const padded = pct + '%'
    if (idx !== activeWpt || padded !== lastPct) {
      activeWpt = idx
      lastPct = padded
      const hud: SpineHud = { waypoint: idx, pct: padded }
      hudSubs.forEach((cb) => cb(hud))
    }
  }

  /* ---------- sizing ---------- */
  const coarse = !fine
  let dprGov = 1
  let lastW = 0
  let lastH = 0
  let resizeTimer = 0
  function doResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2) * dprGov
    canvas.width = Math.floor(window.innerWidth * dpr)
    canvas.height = Math.floor(window.innerHeight * dpr)
    lastW = window.innerWidth
    lastH = window.innerHeight
    computeRegistry()
    return dpr
  }
  let dpr = doResize()
  const onResize = () => {
    if (coarse && window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 120) return
    clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
      dpr = doResize()
    }, 200)
  }
  window.addEventListener('resize', onResize)

  /* ---------- context loss ---------- */
  let contextLost = false
  const onLost = (e: Event) => {
    e.preventDefault()
    contextLost = true
  }
  const onRestored = () => {
    contextLost = false
    dpr = doResize()
  }
  canvas.addEventListener('webglcontextlost', onLost)
  canvas.addEventListener('webglcontextrestored', onRestored)

  /* ---------- matrices (preallocated) ---------- */
  const proj = new Float32Array(16)
  const view = new Float32Array(16)
  const eye = [0, 0, 0]
  const tgt = [0, 0, 0]
  const c0 = [0, 0, 0]
  const cT = [0, 0, 0]
  function perspective(out: Float32Array, fov: number, asp: number, near: number, far: number) {
    const f = 1 / Math.tan(fov / 2)
    const nf = 1 / (near - far)
    out.fill(0)
    out[0] = f / asp
    out[5] = f
    out[10] = (far + near) * nf
    out[11] = -1
    out[14] = 2 * far * near * nf
  }
  function lookAt(out: Float32Array, e: number[], c: number[]) {
    let zx = e[0] - c[0]
    let zy = e[1] - c[1]
    let zz = e[2] - c[2]
    const zl = Math.sqrt(zx * zx + zy * zy + zz * zz) || 1
    zx /= zl
    zy /= zl
    zz /= zl
    /* up = (0,1,0) */
    let xx = -zz
    const xy2 = 0
    let xz = zx
    const xl = Math.sqrt(xx * xx + xz * xz) || 1
    xx /= xl
    xz /= xl
    const yx = zy * xz - zz * xy2
    const yy = zz * xx - zx * xz
    const yz = zx * xy2 - zy * xx
    out[0] = xx
    out[1] = yx
    out[2] = zx
    out[3] = 0
    out[4] = xy2
    out[5] = yy
    out[6] = zy
    out[7] = 0
    out[8] = xz
    out[9] = yz
    out[10] = zz
    out[11] = 0
    out[12] = -(xx * e[0] + xy2 * e[1] + xz * e[2])
    out[13] = -(yx * e[0] + yy * e[1] + yz * e[2])
    out[14] = -(zx * e[0] + zy * e[1] + zz * e[2])
    out[15] = 1
  }

  /* ---------- render state ---------- */
  let vCam = 0
  let maxV = 0.02
  let smX = 0
  let smY = 0
  let mouseX = 0
  let mouseY = 0
  let vel = 0
  let audio = 0
  let lastScrollY = window.scrollY
  let lastNow = performance.now()
  let lastInput = performance.now()
  let launchPulse = 0
  let pulseV = 0
  let booted = false
  let govStage = 0
  let deltas: number[] = []
  let raf = 0
  let destroyed = false
  const bootFallback = window.setTimeout(() => {
    booted = true
  }, 2500)

  const onMouse = (e: MouseEvent) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1
    mouseY = -((e.clientY / window.innerHeight) * 2 - 1)
    lastInput = performance.now()
  }
  const onScroll = () => {
    lastInput = performance.now()
  }
  const onTouch = () => {
    lastInput = performance.now()
  }
  window.addEventListener('mousemove', onMouse, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('touchstart', onTouch, { passive: true })

  gl.disable(gl.DEPTH_TEST)

  const V_STATIONS = Array.from({ length: N_STATIONS }, (_, i) => i / (N_STATIONS - 1))
  let frameIdx = 0

  function frame(now: number) {
    if (destroyed) return
    raf = requestAnimationFrame(frame)
    if (contextLost) return
    const dt = Math.min(0.05, (now - lastNow) / 1000) || 0.016
    lastNow = now
    frameIdx++

    /* audio energy — a playing track also counts as input activity */
    const level = config.sampleAudio ? config.sampleAudio() : null
    if (level !== null) lastInput = now
    audio = elerp(audio, level ?? 0, 6, dt)

    /* idle demotion: no input 4s → alternate ticks */
    if (now - lastInput > 4000 && frameIdx & 1) return

    /* adaptive governor: 60-frame median post-boot (drop DPR, then halve points) */
    if (govStage < 2 && booted) {
      deltas.push(dt * 1000)
      if (deltas.length >= 60) {
        deltas.sort((a, b) => a - b)
        const med = deltas[30]
        deltas = []
        if (med > 20) {
          govStage++
          if (govStage === 1) {
            dprGov = 1 / Math.min(window.devicePixelRatio || 1, 2)
            dpr = doResize()
          } else {
            drawN = Math.floor(N / 2)
          }
        } else {
          govStage = 2
        }
      }
    }

    /* smoothed signals */
    const max = document.documentElement.scrollHeight - window.innerHeight
    const s = max > 0 ? window.scrollY / max : 0
    vCam = elerp(vCam, scrollToV(s), 8, dt)
    if (vCam > maxV) maxV = vCam
    smX = elerp(smX, mouseX, 4, dt)
    smY = elerp(smY, mouseY, 4, dt)
    const vRaw = Math.min(3000, Math.abs((window.scrollY - lastScrollY) / Math.max(dt, 0.001)))
    lastScrollY = window.scrollY
    vel = elerp(vel, vRaw / 3000, 5, dt)
    if (launchPulse > 0) launchPulse = Math.max(0, launchPulse - dt / 1.2)

    /* camera along the spine */
    const t = now * 0.001
    C(vCam, c0)
    let prox = 0
    for (let si = 0; si < N_STATIONS; si++) {
      const p = Math.exp(-Math.pow((vCam - V_STATIONS[si]) * 18, 2))
      if (p > prox) prox = p
    }
    const rCam = 2.6 + 0.9 * prox
    const phi = TAU * 1.75 * vCam + smX * 0.35 + t * 0.02
    eye[0] = c0[0] + Math.cos(phi) * rCam
    eye[1] = c0[1] + 0.4 + smY * 0.3
    eye[2] = c0[2] + Math.sin(phi) * rCam
    C(Math.min(1, vCam + 0.015), cT)
    tgt[0] = cT[0]
    tgt[1] = cT[1]
    tgt[2] = cT[2]
    const asp = canvas.width / canvas.height
    perspective(proj, 1.0 + 0.25 * Math.min(1, vel * 2.5), asp, 0.1, 48)
    lookAt(view, eye, tgt)

    updateHud(vCam)

    /* uniforms shared by both point passes */
    gl!.useProgram(progPoints)
    gl!.uniformMatrix4fv(U.uProj, false, proj)
    gl!.uniformMatrix4fv(U.uView, false, view)
    gl!.uniform1f(U.uTime, t)
    gl!.uniform1f(U.uMaxV, maxV)
    gl!.uniform1f(U.uFocusV, Math.min(1, vCam + 0.045))
    gl!.uniform1f(U.uVel, vel)
    gl!.uniform1f(U.uPulse, launchPulse)
    gl!.uniform1f(U.uPulseV, pulseV)
    gl!.uniform1f(U.uAspect, asp)
    gl!.uniform1f(U.uAudio, audio)
    gl!.uniform2f(U.uMouse, smX, smY)

    /* paper background, then ink particles with premultiplied "over"
       blending (additive bloom belongs to the dark theme; on paper the
       points darken like ink instead of glowing) */
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null)
    gl!.viewport(0, 0, canvas.width, canvas.height)
    gl!.disable(gl!.BLEND)
    gl!.useProgram(progComp)
    bindQuad(progComp!)
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)
    gl!.enable(gl!.BLEND)
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA)
    gl!.useProgram(progPoints)
    rebindPoints()
    gl!.uniform1f(U.uSizeMul, 7.5 * dpr)
    gl!.uniform1f(U.uMinPx, 0)
    gl!.drawArrays(gl!.POINTS, 0, drawN)
  }
  raf = requestAnimationFrame(frame)

  return {
    destroy() {
      destroyed = true
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      clearTimeout(bootFallback)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('touchstart', onTouch)
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      ro?.disconnect()
      hudSubs.clear()
      gl.deleteBuffer(bufHome)
      gl.deleteBuffer(bufScat)
      gl.deleteBuffer(bufMeta)
      gl.deleteBuffer(quadBuf)
      for (const p of [progPoints, progComp]) if (p) gl.deleteProgram(p)
      /* deliberately NOT losing the context — StrictMode remounts reuse it */
    },
    pulse(v = 0) {
      launchPulse = 1
      pulseV = v
      booted = true
    },
    recomputeRegistry() {
      computeRegistry()
    },
    onHud(cb: (hud: SpineHud) => void) {
      hudSubs.add(cb)
      return () => hudSubs.delete(cb)
    },
  }
}

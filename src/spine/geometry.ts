/**
 * Point-cloud world builder — ported from mohr-media-site/assets/spine.js.
 * Same triple-helix spine, vertebra rings and dust; the six station
 * sculptures are re-themed to the album world:
 *
 *   k  v     section   sculpture
 *   0  0.0   hero      chrome orb (Fibonacci sphere)
 *   1  0.2   listen    vinyl disc (grooves + label, tilted)
 *   2  0.4   tracks    waveform grid (animates in the shader)
 *   3  0.6   story     chain-link torus knot
 *   4  0.8   visuals   speaker-cone vortex
 *   5  1.0   contact   transmission beacons (3 pods)
 */

import { SPINE_SECTIONS } from './config'

const TAU = Math.PI * 2
export const N_STATIONS = SPINE_SECTIONS.length
const LAST = N_STATIONS - 1

/** the spine centerline: gentle helix descending 44 units */
export function C(v: number, out: number[]): number[] {
  out[0] = 1.1 * Math.sin(TAU * 1.25 * v)
  out[1] = -44 * v
  out[2] = 1.1 * Math.sin(TAU * v + 1.7)
  return out
}

export interface World {
  home: Float32Array
  scat: Float32Array
  meta: Float32Array
  count: number
}

export function buildWorld(viewportMin: number): World {
  const SCALE = viewportMin < 700 ? 0.51 : 1
  const N_STR = Math.floor(3600 * SCALE)
  const perRing = Math.floor(180 * SCALE)
  const N_RING = perRing * N_STATIONS
  const N_STN = Math.floor(2700 * SCALE)
  const N_DUST = Math.floor(640 * SCALE)
  const N = N_STR + N_RING + N_STN + N_DUST

  const home = new Float32Array(N * 3)
  const scat = new Float32Array(N * 3)
  const meta = new Float32Array(N * 3)
  const c0 = [0, 0, 0]
  let idx = 0

  function put(x: number, y: number, z: number, v: number, rnd: number, role: number, scatBig: boolean) {
    const j = idx * 3
    home[j] = x
    home[j + 1] = y
    home[j + 2] = z
    const mag = scatBig ? 2 + 4 * Math.random() : 0.05
    const th = Math.random() * TAU
    const ph = Math.acos(2 * Math.random() - 1)
    scat[j] = x + Math.sin(ph) * Math.cos(th) * mag
    scat[j + 1] = y + Math.sin(ph) * Math.sin(th) * mag
    scat[j + 2] = z + Math.cos(ph) * mag
    meta[j] = v
    meta[j + 1] = rnd
    meta[j + 2] = role
    idx++
  }

  let i: number, k: number, v: number, th2: number, rr: number

  /* role 0 — triple-helix strands + chord rungs */
  const nRung = Math.floor(N_STR * 0.08)
  for (i = 0; i < N_STR - nRung; i++) {
    v = (i + Math.random()) / (N_STR - nRung)
    th2 = TAU * 9 * v + (i % 3) * 2.094
    rr = 0.34 + 0.05 * Math.random()
    C(v, c0)
    put(c0[0] + Math.cos(th2) * rr, c0[1], c0[2] + Math.sin(th2) * rr, v, Math.random(), 0, false)
  }
  for (i = 0; i < nRung; i++) {
    v = Math.floor(i / 4) / Math.floor(nRung / 4 || 1)
    const tChord = Math.random()
    th2 = TAU * 9 * v
    rr = 0.36
    const thB = th2 + 2.094
    C(v, c0)
    const x1 = Math.cos(th2) * rr
    const z1 = Math.sin(th2) * rr
    const x2 = Math.cos(thB) * rr
    const z2 = Math.sin(thB) * rr
    put(c0[0] + x1 + (x2 - x1) * tChord, c0[1], c0[2] + z1 + (z2 - z1) * tChord, v, Math.random(), 0, false)
  }

  /* role 1 — vertebra double rings at each station */
  for (k = 0; k < N_STATIONS; k++) {
    const vk = k / LAST
    C(vk, c0)
    for (i = 0; i < perRing; i++) {
      const ringR = (i % 2 === 0 ? 0.85 : 1.15) + (Math.random() - 0.5) * 0.06
      th2 = Math.random() * TAU
      put(c0[0] + Math.cos(th2) * ringR, c0[1] + (Math.random() - 0.5) * 0.04, c0[2] + Math.sin(th2) * ringR, vk, Math.random(), 1, true)
    }
  }

  /* role 2 — station sculptures (hero gets a double-weight share) */
  const STN_W = [2.2, 1, 1, 1, 1, 1]
  const STN_WSUM = STN_W.reduce((a, b) => a + b, 0)
  const GA = Math.PI * (3 - Math.sqrt(5))
  for (k = 0; k < N_STATIONS; k++) {
    const perStn = Math.floor((N_STN * STN_W[k]) / STN_WSUM)
    const vs = k / LAST
    C(vs, c0)
    for (i = 0; i < perStn; i++) {
      let rnd2 = Math.random()
      let x = 0
      let y = 0
      let z = 0
      if (k === 0) {
        /* chrome orb — fib sphere R1.55; hemispheres tinted in shader */
        const yy = 1 - (i / (perStn - 1)) * 2
        const rad = Math.sqrt(Math.max(0, 1 - yy * yy))
        const t3 = GA * i
        const R0 = 1.55 + (rnd2 - 0.5) * 0.1
        x = Math.cos(t3) * rad * R0
        y = yy * R0
        z = Math.sin(t3) * rad * R0
      } else if (k === 1) {
        /* vinyl disc — grooves + dense label ring, tilted toward camera */
        let px: number
        let pz: number
        if (rnd2 < 0.2) {
          /* label */
          const r = 0.12 + Math.random() * 0.26
          th2 = Math.random() * TAU
          px = Math.cos(th2) * r
          pz = Math.sin(th2) * r
        } else {
          /* 13 grooves 0.55 → 1.85 */
          const groove = i % 13
          const r = 0.55 + groove * 0.1 + (Math.random() - 0.5) * 0.03
          th2 = Math.random() * TAU
          px = Math.cos(th2) * r
          pz = Math.sin(th2) * r
        }
        const py = (Math.random() - 0.5) * 0.035
        const tilt = 0.45
        x = px
        y = py * Math.cos(tilt) - pz * Math.sin(tilt)
        z = py * Math.sin(tilt) + pz * Math.cos(tilt)
      } else if (k === 2) {
        /* waveform grid deck — displaced live in the vertex shader */
        x = (Math.random() - 0.5) * 4.6
        y = (Math.random() - 0.5) * 0.1
        z = (Math.random() - 0.5) * 4.6
      } else if (k === 3) {
        /* chain-link torus knot p2 q3, axis vertical, framed tube */
        const t5 = (i / perStn) * TAU
        const kr = 0.95 + 0.42 * Math.cos(3 * t5)
        const kx = kr * Math.cos(2 * t5)
        const ky = kr * Math.sin(2 * t5)
        const kz = 0.42 * Math.sin(3 * t5)
        const e = 0.01
        const kr2 = 0.95 + 0.42 * Math.cos(3 * (t5 + e))
        let tx = kr2 * Math.cos(2 * (t5 + e)) - kx
        let ty = kr2 * Math.sin(2 * (t5 + e)) - ky
        let tz = 0.42 * Math.sin(3 * (t5 + e)) - kz
        const tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1
        tx /= tl
        ty /= tl
        tz /= tl
        let nx = -kx
        let ny = -ky
        const nz = 0
        const nl = Math.sqrt(nx * nx + ny * ny) || 1
        nx /= nl
        ny /= nl
        const bx = ty * nz - tz * ny
        const by = tz * nx - tx * nz
        const bz = tx * ny - ty * nx
        const tube = 0.14 * Math.random()
        const pa2 = Math.random() * TAU
        const ox = Math.cos(pa2) * tube
        const oy = Math.sin(pa2) * tube
        x = (kx + nx * ox + bx * oy) * 1.15
        z = (ky + ny * ox + by * oy) * 1.15
        y = (kz + nz * ox + bz * oy) * 1.6
      } else if (k === 4 && k !== LAST) {
        /* speaker-cone vortex, mouth up, wide open */
        const h = Math.random()
        const ang = h * 14 + Math.random() * 2
        const fr = (0.25 + h * 1.9) * (0.85 + 0.3 * Math.random())
        x = Math.cos(ang) * fr
        y = (h - 0.5) * 3.2
        z = Math.sin(ang) * fr
      } else {
        /* transmission beacons — 3 pods, lead pod brighter */
        const pod2 = i % 3
        const yy3 = 1 - (i / 3 / Math.max(1, perStn / 3 - 1)) * 2
        const rad3 = Math.sqrt(Math.max(0, 1 - yy3 * yy3))
        const t6 = GA * i
        x = [-1.2, 0, 1.2][pod2] + Math.cos(t6) * rad3 * 0.3
        y = yy3 * 0.3
        z = Math.sin(t6) * rad3 * 0.3
        if (pod2 === 0) rnd2 = Math.min(0.959, rnd2 + 0.25)
      }
      put(c0[0] + x, c0[1] + y, c0[2] + z, vs, rnd2, 2, true)
    }
  }

  /* role 3 — transit dust */
  for (i = 0; i < N_DUST; i++) {
    v = Math.random()
    C(v, c0)
    const dr = 6 + Math.random() * 8
    th2 = Math.random() * TAU
    put(c0[0] + Math.cos(th2) * dr, c0[1] + (Math.random() - 0.5) * 3, c0[2] + Math.sin(th2) * dr, v, Math.random(), 3, false)
  }

  const count = idx
  /* shuffle draw order so any drawN prefix samples all roles uniformly */
  for (let a = count - 1; a > 0; a--) {
    const b = (Math.random() * (a + 1)) | 0
    for (let c = 0; c < 3; c++) {
      const ja = a * 3 + c
      const jb = b * 3 + c
      let t2 = home[ja]
      home[ja] = home[jb]
      home[jb] = t2
      t2 = scat[ja]
      scat[ja] = scat[jb]
      scat[jb] = t2
      t2 = meta[ja]
      meta[ja] = meta[jb]
      meta[jb] = t2
    }
  }

  return { home, scat, meta, count }
}

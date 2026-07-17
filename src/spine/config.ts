/**
 * Spine world configuration — sections drive both the camera
 * registry (scroll → position on the spine) and the waypoint rail.
 * Order must match the section order in App.tsx.
 */

export interface SpineSection {
  /** DOM id of the section element */
  id: string
  /** studio-session waypoint label shown in the rail readout */
  label: string
}

export interface SpineConfig {
  sections: SpineSection[]
  /** 3-stop color ramp along the descent: [top, middle, bottom] hex */
  palette: [string, string, string]
  /**
   * Optional per-frame audio level sampler. Return 0..1 while a track
   * is playing (drives waveform amplitude + glow), or null when idle.
   */
  sampleAudio?: () => number | null
  /** after-hours theme: near-black paper, particles lift toward light */
  dark?: boolean
}

export interface SpineHud {
  waypoint: number
  /** zero-padded percent string, e.g. "043.1%" */
  pct: string
}

export interface SpineEngine {
  destroy(): void
  /** fire the assembly pulse (loader completion) */
  pulse(v?: number): void
  recomputeRegistry(): void
  onHud(cb: (hud: SpineHud) => void): () => void
}

export const SPINE_SECTIONS: SpineSection[] = [
  { id: 'top', label: 'SIGNAL IN' },
  { id: 'listen', label: 'MONITORS' },
  { id: 'tracks', label: 'THE TAPE' },
  { id: 'story', label: 'LINER NOTES' },
  { id: 'contact', label: 'BOOKINGS' },
]

/** the descent runs logo blue → teal → green, ink on paper */
export const SPINE_PALETTE: [string, string, string] = ['#1f9eff', '#0fa48f', '#27ae60']

export function hexToVec3(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

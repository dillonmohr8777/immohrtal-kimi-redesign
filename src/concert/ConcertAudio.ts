/**
 * ConcertAudio — audio-reactive level source for the venue engine.
 *
 * Modes:
 *  - 'audio':     an owner-approved preview clip exists at
 *                 public/audio/previews/track-XX.mp3 → analysed live.
 *  - 'synthetic': muted beat envelope generated from the cue's tempo map.
 *                 This is the shipping default until final audio is cleared
 *                 (see KIMI_BLENDER_CONCERT_BRIEF.md — the seven local
 *                 30-second previews never enter this repository).
 *
 * sample() always returns 0..1 for the current wall-clock instant, so the
 * visual pulse keeps time whether or not sound is allowed to play.
 */

import type { ConcertCue } from '../content/concert-cues'

export type ConcertAudioMode = 'audio' | 'synthetic'

export class ConcertAudio {
  mode: ConcertAudioMode = 'synthetic'

  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private element: HTMLAudioElement | null = null
  private bins: Uint8Array<ArrayBuffer> | null = null
  private cue: ConcertCue | null = null

  /** Attach a cue. Probes for a cleared preview clip; falls back to muted timing. */
  async attach(cue: ConcertCue, baseUrl: string): Promise<ConcertAudioMode> {
    this.cue = cue
    this.stopElement()

    if (cue.previewSrc) {
      const url = `${baseUrl}${cue.previewSrc}`
      const available = await this.probe(url)
      if (available) {
        try {
          this.startElement(url)
          this.mode = 'audio'
          return this.mode
        } catch {
          // Autoplay/WebAudio refused — stay synthetic, stay muted.
        }
      }
    }
    this.mode = 'synthetic'
    return this.mode
  }

  private async probe(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, { method: 'HEAD' })
      return res.ok
    } catch {
      return false
    }
  }

  private startElement(url: string) {
    // AudioContext must be created from a user gesture; callers invoke
    // attach() from click handlers, so this is safe.
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) throw new Error('WebAudio unavailable')
    this.ctx = this.ctx ?? new Ctx()
    void this.ctx.resume()

    const el = new Audio(url)
    el.loop = true
    el.crossOrigin = 'anonymous'
    const source = this.ctx.createMediaElementSource(el)
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 512
    this.analyser.smoothingTimeConstant = 0.72
    source.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)
    this.bins = new Uint8Array(this.analyser.frequencyBinCount)
    this.element = el
    void el.play().catch(() => {
      // Playback refused (rare): keep the synthetic clock instead.
      this.mode = 'synthetic'
    })
  }

  private stopElement() {
    if (this.element) {
      this.element.pause()
      this.element.src = ''
      this.element = null
    }
    this.analyser = null
    this.bins = null
  }

  /** 0..1 level for "now". */
  sample(): number {
    if (this.mode === 'audio' && this.analyser && this.bins) {
      this.analyser.getByteFrequencyData(this.bins)
      // Weight the low end (kick/bass) hardest — that is what a crowd feels.
      let low = 0
      let high = 0
      const lowEnd = Math.min(24, this.bins.length)
      for (let i = 0; i < lowEnd; i++) low += this.bins[i]
      for (let i = lowEnd; i < this.bins.length; i++) high += this.bins[i]
      low /= lowEnd * 255
      high /= Math.max(1, this.bins.length - lowEnd) * 255
      return Math.min(1, low * 0.78 + high * 0.3)
    }
    return this.syntheticLevel()
  }

  /** Muted beat envelope from the cue tempo: kick on 1 & 3, hat ticks, breath. */
  private syntheticLevel(): number {
    const bpm = this.cue?.bpm ?? 100
    const t = performance.now() / 1000
    const beats = t * (bpm / 60)
    const bar = beats % 4
    const kickPhase = Math.min(bar % 2, 2 - (bar % 2)) // hits on 0 and 2
    const kick = Math.exp(-4.5 * kickPhase)
    const hat = Math.pow(1 - (beats * 4) % 1, 3) * 0.14
    const breath = 0.08 + 0.05 * Math.sin(t * 0.6)
    return Math.min(1, kick * 0.85 + hat + breath)
  }

  stop() {
    this.stopElement()
  }
}

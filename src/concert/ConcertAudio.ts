import type { ConcertCue } from '../content/concert-cues'

export type ConcertAudioMode = 'audio' | 'synthetic'

/** Real preview playback plus a beat envelope for the stage engine. */
export class ConcertAudio {
  mode: ConcertAudioMode = 'synthetic'

  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private element: HTMLAudioElement | null = null
  private bins: Uint8Array<ArrayBuffer> | null = null
  private cue: ConcertCue | null = null
  private volume = 0.82

  /**
   * Attach synchronously from a click handler. The old implementation awaited
   * a HEAD request first, which discarded browser user activation and caused
   * the otherwise-valid preview clips to be blocked as autoplay.
   */
  attach(cue: ConcertCue, baseUrl: string): ConcertAudioMode {
    this.cue = cue
    this.stopElement()

    if (cue.previewSrc) {
      try {
        this.startElement(`${baseUrl}${cue.previewSrc}`)
        this.mode = 'audio'
        return this.mode
      } catch {
        // A missing/unplayable preview falls back to the synthetic envelope.
      }
    }

    this.mode = 'synthetic'
    return this.mode
  }

  private startElement(url: string) {
    const Ctx = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) throw new Error('WebAudio unavailable')

    this.ctx = this.ctx ?? new Ctx()
    void this.ctx.resume()

    const element = new Audio(url)
    element.loop = true
    element.crossOrigin = 'anonymous'
    element.preload = 'auto'
    element.volume = this.volume

    const source = this.ctx.createMediaElementSource(element)
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 512
    this.analyser.smoothingTimeConstant = 0.72
    source.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)
    this.bins = new Uint8Array(this.analyser.frequencyBinCount)
    this.element = element
    void element.play().catch(() => { this.mode = 'synthetic' })
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

  sample(): number {
    if (this.mode === 'audio' && this.analyser && this.bins) {
      this.analyser.getByteFrequencyData(this.bins)
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

  private syntheticLevel(): number {
    const bpm = this.cue?.bpm ?? 100
    const t = performance.now() / 1000
    const beats = t * (bpm / 60)
    const bar = beats % 4
    const kickPhase = Math.min(bar % 2, 2 - (bar % 2))
    const kick = Math.exp(-4.5 * kickPhase)
    const hat = Math.pow(1 - (beats * 4) % 1, 3) * 0.14
    const breath = 0.08 + 0.05 * Math.sin(t * 0.6)
    return Math.min(1, kick * 0.85 + hat + breath)
  }

  pause() {
    this.element?.pause()
  }

  resume() {
    void this.ctx?.resume()
    void this.element?.play()
  }

  setVolume(value: number) {
    this.volume = Math.min(1, Math.max(0, value))
    if (this.element) this.element.volume = this.volume
  }

  isAudible() {
    return this.mode === 'audio' && Boolean(this.element && !this.element.paused)
  }

  stop() {
    this.stopElement()
  }
}

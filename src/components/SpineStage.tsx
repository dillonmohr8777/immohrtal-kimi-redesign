import { useEffect, useRef, useState } from 'react'
import { createSpineEngine } from '../spine/engine'
import { SPINE_PALETTE, SPINE_SECTIONS, type SpineEngine } from '../spine/config'
import { usePlayer } from '../audio/PlayerContext'

/**
 * Fixed full-viewport canvas hosting the WebGL spine world.
 * Falls back to a static gradient when reduced motion is on or
 * WebGL is unavailable. Feeds live track energy into the engine.
 */
export function SpineStage({ engineRef, dark = false }: { engineRef: { current: SpineEngine | null }; dark?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fallback, setFallback] = useState(false)
  const { playing, getAnalyser } = usePlayer()
  const playingRef = useRef(playing)
  playingRef.current = playing

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const freq = new Uint8Array(32)
    const sampleAudio = (): number | null => {
      if (!playingRef.current) return null
      const analyser = engineAnalyser()
      if (!analyser) return 0.2 // playing but no analyser: gentle constant lift
      analyser.getByteFrequencyData(freq)
      let sum = 0
      for (let i = 1; i < 17; i++) sum += freq[i]
      return Math.min(1, sum / (16 * 200))
    }
    const engineAnalyser = () => getAnalyser()

    /* `dark` is in the dependency array: theme flips rebuild the
       engine with the matching shader constants (cheap, StrictMode-safe) */
    const engine = createSpineEngine(canvas, {
      sections: SPINE_SECTIONS,
      palette: SPINE_PALETTE,
      sampleAudio,
      dark,
    })
    engineRef.current = engine
    if (!engine) setFallback(true)

    /* if the user enables reduced motion mid-session, drop to fallback */
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        engineRef.current?.destroy()
        engineRef.current = null
        setFallback(true)
      }
    }
    mq.addEventListener?.('change', onChange)

    return () => {
      mq.removeEventListener?.('change', onChange)
      engine?.destroy()
      engineRef.current = null
    }
  }, [engineRef, getAnalyser, dark])

  if (fallback) {
    return <div aria-hidden="true" className="stage-fallback" />
  }
  return <canvas ref={canvasRef} aria-hidden="true" className="fixed inset-0 z-0 h-full w-full pointer-events-none" />
}

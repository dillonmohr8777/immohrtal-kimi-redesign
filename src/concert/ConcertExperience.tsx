/**
 * ConcertExperience — "Session 001 // The Venue"
 *
 * Opt-in 3D chapter of the homepage: the Pittsburgh arena built in Blender
 * (blender/scripts/build_scene.py), rendered from
 * public/models/immohrtal-pittsburgh-concert.glb.
 *
 * Guarantees:
 *  - Nothing WebGL-related loads until the visitor presses "Enter the venue".
 *  - No WebGL / load failure → the rendered poster + the rest of the page.
 *  - prefers-reduced-motion → snapped cameras, static crowd, calm lighting.
 *  - All 11 track cue slots selectable; audio-reactive when a cleared
 *    preview clip exists, muted synthetic timing otherwise.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { CONCERT_CAMERAS, concertCues, type ConcertCameraId } from '../content/concert-cues'
import { ConcertAudio, type ConcertAudioMode } from './ConcertAudio'

type Status = 'idle' | 'loading' | 'ready' | 'error'

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  return reduced
}

const BASE = import.meta.env.BASE_URL
const MODEL_URL = `${BASE}models/immohrtal-pittsburgh-concert.glb`
const POSTER_URL = `${BASE}models/concert-poster.jpg`

export function ConcertExperience() {
  const reducedMotion = usePrefersReducedMotion()
  const [webglOk] = useState(detectWebGL)
  const [entered, setEntered] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [activeCamera, setActiveCamera] = useState<ConcertCameraId>('CAM_FOH')
  const [activeTrack, setActiveTrack] = useState(1)
  const [playing, setPlaying] = useState(true)
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [audioMode, setAudioMode] = useState<ConcertAudioMode>('synthetic')

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  // Engine/audio are class instances that must never trigger re-renders.
  const sceneRef = useRef<import('./ConcertScene').ConcertScene | null>(null)
  const audioRef = useRef<ConcertAudio | null>(null)
  const rafRef = useRef(0)
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeCue = concertCues[activeTrack - 1]

  const stopLevelPump = useCallback(() => cancelAnimationFrame(rafRef.current), [])

  const startLevelPump = useCallback(() => {
    stopLevelPump()
    const pump = () => {
      const scene = sceneRef.current
      const audio = audioRef.current
      if (scene && audio) scene.setLevel(audio.sample())
      rafRef.current = requestAnimationFrame(pump)
    }
    rafRef.current = requestAnimationFrame(pump)
  }, [stopLevelPump])

  const selectTrack = useCallback(
    (track: number, { moveCamera = true }: { moveCamera?: boolean } = {}) => {
      const cue = concertCues[track - 1]
      if (!cue) return
      setActiveTrack(track)
      sceneRef.current?.setChapter(cue)
      if (moveCamera) {
        sceneRef.current?.setCamera(cue.camera)
        setActiveCamera(cue.camera as ConcertCameraId)
      }
      const audio = audioRef.current ?? new ConcertAudio()
      audioRef.current = audio
      void audio.attach(cue, BASE).then(setAudioMode)
    },
    [],
  )

  // Auto-advance through the album chapters.
  useEffect(() => {
    if (status !== 'ready' || !playing || !autoAdvance) return
    advanceRef.current = setTimeout(() => {
      selectTrack((activeTrack % concertCues.length) + 1)
    }, activeCue.duration * 1000)
    return () => {
      if (advanceRef.current) clearTimeout(advanceRef.current)
    }
  }, [status, playing, autoAdvance, activeTrack, activeCue.duration, selectTrack])

  const enterVenue = useCallback(() => {
    setProgress(0)
    setEntered(true)
    setStatus('loading')
  }, [])

  // Boot the engine once React has committed the canvas element.
  useEffect(() => {
    if (!entered || status !== 'loading' || sceneRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    ;(async () => {
      try {
        const { ConcertScene } = await import('./ConcertScene')
        if (cancelled) return
        const scene = new ConcertScene({
          canvas,
          modelUrl: MODEL_URL,
          reducedMotion,
          onProgress: (ratio) => setProgress(Math.round(ratio * 100)),
          onReady: () => {
            if (cancelled) return
            setStatus('ready')
            scene.setChapter(concertCues[0])
            scene.play()
            startLevelPump()
            selectTrack(1)
          },
          onError: (message) => {
            if (cancelled) return
            setError(message)
            setStatus('error')
          },
        })
        sceneRef.current = scene
        await scene.load()
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'The venue could not be loaded')
        setStatus('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [entered, status, reducedMotion, selectTrack, startLevelPump])

  // Dispose everything on unmount.
  useEffect(() => {
    return () => {
      stopLevelPump()
      if (advanceRef.current) clearTimeout(advanceRef.current)
      audioRef.current?.stop()
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [stopLevelPump])

  const togglePlay = () => {
    const scene = sceneRef.current
    if (!scene) return
    if (playing) {
      scene.pause()
      stopLevelPump()
      audioRef.current?.stop()
      setPlaying(false)
    } else {
      scene.play()
      startLevelPump()
      selectTrack(activeTrack, { moveCamera: false })
      setPlaying(true)
    }
  }

  const cueIndex = String(activeCue.track).padStart(2, '0')

  return (
    <section className="concert-section" id="venue" aria-labelledby="venue-heading">
      <div className="concert-head">
        <p className="mono-tag">SESSION 001 // THE VENUE</p>
        <h2 id="venue-heading" className="font-display">
          Pittsburgh, <span className="chrome-text">after hours.</span>
        </h2>
        <p className="concert-lede">
          An arena built for <em>Dance With The Delusional</em> — rivers, hills, and yellow bridges
          outside; a packed floor, a live signal, and eleven lighting chapters inside. Built in
          Blender, rendered in your browser.
        </p>
      </div>

      <div className="concert-stage" ref={stageRef} data-entered={entered || undefined}>
        {!entered && (
          <figure className="concert-poster">
            <img src={POSTER_URL} alt="Rendered preview of the IMMOHRTAL Pittsburgh concert venue at night" loading="lazy" />
            <figcaption className="mono-tag">RENDERED IN BLENDER · ARENA DISTRICT, PITTSBURGH PA</figcaption>
            {webglOk && (
              <button className="concert-enter" type="button" onClick={() => void enterVenue()}>
                <span className="concert-enter-ring" aria-hidden="true" />
                Enter the venue
                <span className="concert-enter-sub">3D · sound-reactive · 11 chapters</span>
              </button>
            )}
            {!webglOk && (
              <p className="concert-note" role="note">
                This device does not support WebGL, so the live venue stays as a render.
                The album, story, and videos below all work normally.
              </p>
            )}
          </figure>
        )}

        {entered && (
          <>
            <canvas ref={canvasRef} className="concert-canvas" aria-label="Interactive 3D concert venue" />
            {status === 'loading' && (
              <div className="concert-loading" role="status" aria-live="polite">
                <p className="mono-tag">LOADING THE VENUE</p>
                <div className="concert-progress"><span style={{ width: `${progress}%` }} /></div>
                <p className="concert-loading-pct">{progress}%</p>
              </div>
            )}
            {status === 'error' && (
              <div className="concert-fallback" role="alert">
                <img src={POSTER_URL} alt="Rendered preview of the IMMOHRTAL Pittsburgh concert venue" />
                <p>The 3D venue could not load ({error}). Here is the rendered poster instead.</p>
              </div>
            )}
            {status === 'ready' && (
              <div className="concert-hud">
                <div className="concert-nowplaying">
                  <span className="mono-tag">{cueIndex} · {activeCue.chapter}</span>
                  <strong>{activeCue.title}</strong>
                  <span className={`concert-mode ${audioMode === 'audio' ? 'live' : ''}`}>
                    {audioMode === 'audio' ? 'live audio-reactive' : 'muted timing · synthetic beat'}
                  </span>
                </div>

                <div className="concert-controls" role="group" aria-label="Venue controls">
                  <button type="button" className="concert-btn" onClick={togglePlay} aria-pressed={playing}>
                    {playing ? 'Pause' : 'Resume'}
                  </button>
                  <button
                    type="button"
                    className="concert-btn"
                    onClick={() => setAutoAdvance((v) => !v)}
                    aria-pressed={autoAdvance}
                  >
                    Auto-advance {autoAdvance ? 'on' : 'off'}
                  </button>
                </div>

                <div className="concert-rail" role="group" aria-label="Camera viewpoints">
                  {CONCERT_CAMERAS.map((cam) => (
                    <button
                      key={cam.id}
                      type="button"
                      className="concert-chip"
                      aria-pressed={activeCamera === cam.id}
                      onClick={() => {
                        sceneRef.current?.setCamera(cam.id)
                        setActiveCamera(cam.id)
                      }}
                    >
                      {cam.label}
                    </button>
                  ))}
                </div>

                <div className="concert-tracks" role="group" aria-label="Album chapters">
                  {concertCues.map((cue) => (
                    <button
                      key={cue.track}
                      type="button"
                      className="concert-track"
                      aria-pressed={activeTrack === cue.track}
                      onClick={() => selectTrack(cue.track)}
                      title={`${cue.title} — ${cue.chapter}`}
                    >
                      <span className="concert-track-num">{String(cue.track).padStart(2, '0')}</span>
                      <span className="concert-track-dot" style={{ background: cue.primary }} />
                    </button>
                  ))}
                </div>

                {reducedMotion && (
                  <p className="concert-note">Reduced motion is on: cameras snap, the crowd rests, lighting stays calm.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <p className="concert-footnote">
        Seven 30-second preview clips drive audio-reactive lighting the moment they are cleared for
        the public build; until then every chapter runs on muted timing. All eleven cue slots of
        <em> Dance With The Delusional</em> are wired and waiting.
      </p>
    </section>
  )
}

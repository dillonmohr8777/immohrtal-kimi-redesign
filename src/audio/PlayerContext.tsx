import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { tracks } from '../content/album'
import { initAnalytics, track as trackEvent } from '../lib/analytics'

interface PlayerState {
  currentIndex: number | null
  playing: boolean
  time: number
  duration: number
  /** index of a track whose file failed to load (missing placeholder) */
  errorIndex: number | null
  playTrack: (index: number) => void
  toggle: () => void
  seek: (time: number) => void
  /** analyser for the visualizer — null until first playback */
  getAnalyser: () => AnalyserNode | null
}

const PlayerContext = createContext<PlayerState | null>(null)

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used inside <PlayerProvider>')
  return ctx
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [errorIndex, setErrorIndex] = useState<number | null>(null)

  // one hidden <audio> element for the whole site
  useEffect(() => {
    initAnalytics()
    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio

    const onTime = () => setTime(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || 0)
    const onEnd = () => setPlaying(false)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audioCtxRef.current?.close().catch(() => {})
    }
  }, [])

  // WebAudio graph is created lazily on the first user-initiated play,
  // so autoplay policies never block it.
  const ensureAnalyser = useCallback(() => {
    const audio = audioRef.current
    if (!audio || audioCtxRef.current) return
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      const source = ctx.createMediaElementSource(audio)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.82
      source.connect(analyser)
      analyser.connect(ctx.destination)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
    } catch {
      // analyser is a nice-to-have — playback still works without it
    }
  }, [])

  const playTrack = useCallback(
    (index: number) => {
      trackEvent('preview_play', { track: tracks[index]?.title ?? String(index) })
      const audio = audioRef.current
      const track = tracks[index]
      if (!audio || !track?.src) return
      ensureAnalyser()
      audioCtxRef.current?.resume().catch(() => {})

      if (currentIndex === index) {
        if (audio.paused) void audio.play().catch(() => setErrorIndex(index))
        else audio.pause()
        return
      }
      setErrorIndex(null)
      setCurrentIndex(index)
      setTime(0)
      audio.src = track.src
      void audio.play().catch(() => {
        setErrorIndex(index)
        setPlaying(false)
      })
    },
    [currentIndex, ensureAnalyser],
  )

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio || currentIndex === null) return
    if (audio.paused) void audio.play().catch(() => setErrorIndex(currentIndex))
    else audio.pause()
  }, [currentIndex])

  const seek = useCallback((t: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = t
    setTime(t)
  }, [])

  const getAnalyser = useCallback(() => analyserRef.current, [])

  const value = useMemo(
    () => ({ currentIndex, playing, time, duration, errorIndex, playTrack, toggle, seek, getAnalyser }),
    [currentIndex, playing, time, duration, errorIndex, playTrack, toggle, seek, getAnalyser],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

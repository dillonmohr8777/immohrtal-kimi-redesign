import { useEffect, useRef, useState } from 'react'
import { artist } from '../content/album'
import { prefersReducedMotion } from '../hooks/useReveal'
import type { SpineEngine } from '../spine/config'

const CHECKS: Array<[number, string]> = [
  [0, 'SIGNAL ......... LOCKED'],
  [30, 'MASTERS ........ LOADED'],
  [60, 'LEVELS ......... HOT'],
  [90, 'TRANSMISSION ... LIVE'],
]

/**
 * Console-boot overlay (≤1.3s), the studio powering on before the
 * page. Fires the engine's assembly pulse when it completes.
 * Never rendered under reduced motion.
 */
export function Loader({ engineRef }: { engineRef: { current: SpineEngine | null } }) {
  const [gone, setGone] = useState(() => prefersReducedMotion())
  const [done, setDone] = useState(false)
  const countRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLElement>(null)
  const checkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (gone) {
      engineRef.current?.pulse()
      return
    }
    const t0 = performance.now()
    const BOOT_MS = 1300
    let raf = 0
    let checkIdx = -1
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / BOOT_MS)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = Math.round(eased * 100)
      if (countRef.current) countRef.current.textContent = String(v).padStart(3, '0')
      if (barRef.current) barRef.current.style.transform = `scaleX(${eased})`
      for (let i = CHECKS.length - 1; i >= 0; i--) {
        if (v >= CHECKS[i][0]) {
          if (checkIdx !== i && checkRef.current) {
            checkIdx = i
            checkRef.current.textContent = CHECKS[i][1]
          }
          break
        }
      }
      if (p < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setDone(true)
        engineRef.current?.pulse()
        window.setTimeout(() => setGone(true), 700)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (gone) return null

  return (
    <div id="loader" className={done ? 'done' : ''} aria-hidden="true">
      {artist.logo ? (
        <img src={artist.logo} alt="" width={1320} height={1204} />
      ) : (
        <span className="font-display chrome-text text-3xl uppercase tracking-wide">{artist.name}</span>
      )}
      <span className="font-mono mt-3 text-[11px] tracking-[0.24em]" style={{ color: 'var(--faint)' }}>
        {artist.albumTitle.toUpperCase()} // CUEING UP
      </span>
      <div className="count font-mono" aria-hidden="true">
        <span ref={countRef}>000</span>
      </div>
      <div className="bar">
        <i ref={barRef} />
      </div>
      <div ref={checkRef} className="check font-mono">
        SIGNAL ......... LOCKED
      </div>
    </div>
  )
}

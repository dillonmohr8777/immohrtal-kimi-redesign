import { useEffect, useRef, useState } from 'react'
import { SPINE_SECTIONS, type SpineEngine } from '../spine/config'
import { prefersReducedMotion } from '../hooks/useReveal'

/**
 * Desktop waypoint rail, tick per section, live studio readout:
 * "TRK 02 · MONITORS · LEVELS 043.1%". Waypoint changes go through
 * React state (rare); the per-frame percent is a direct textContent
 * write so we never re-render at 60fps.
 */
export function SpineRail({ engineRef }: { engineRef: { current: SpineEngine | null } }) {
  const [waypoint, setWaypoint] = useState(0)
  const [live, setLive] = useState(false)
  const pctRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    /* engine is created in a sibling effect, subscribe on next tick */
    let unsub: (() => void) | undefined
    const id = window.setTimeout(() => {
      const engine = engineRef.current
      if (!engine) return
      setLive(true)
      unsub = engine.onHud(({ waypoint: w, pct }) => {
        setWaypoint((prev) => (prev === w ? prev : w))
        if (pctRef.current) pctRef.current.textContent = pct
      })
    }, 0)
    return () => {
      clearTimeout(id)
      unsub?.()
    }
  }, [engineRef])

  if (!live) return null

  return (
    <nav id="rail" aria-label="Section waypoints" className="hidden lg:flex">
      {SPINE_SECTIONS.map((sec, i) => (
        <span key={sec.id} className="contents">
          <button
            type="button"
            className={`tick ${i === waypoint ? 'on' : ''}`}
            aria-label={`Track ${i}, ${sec.label}`}
            aria-current={i === waypoint ? 'true' : undefined}
            onClick={() =>
              document.getElementById(sec.id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
            }
          />
          {i < SPINE_SECTIONS.length - 1 && <span className="stem" aria-hidden="true" />}
        </span>
      ))}
      <div className="readout" aria-hidden="true">
        <em>
          TRK 0{waypoint} · {SPINE_SECTIONS[waypoint].label}
        </em>{' '}
        · LEVELS <span ref={pctRef}>000.0%</span>
      </div>
    </nav>
  )
}

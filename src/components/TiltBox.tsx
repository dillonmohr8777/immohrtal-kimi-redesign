import { useRef, type ReactNode } from 'react'
import { prefersReducedMotion } from '../hooks/useReveal'

/**
 * Mouse-follow 3D tilt (fine pointers only, rect cached on enter,
 * rAF-throttled). Wrap any card that should feel like an object.
 */
export function TiltBox({ children, max = 7, className = '' }: { children: ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const rect = useRef<DOMRect | null>(null)
  const queued = useRef(false)
  const pos = useRef({ x: 0, y: 0 })
  const enabled = () => window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion()

  return (
    <div
      ref={ref}
      className={className}
      style={{ transition: 'transform 0.18s ease-out' }}
      onMouseEnter={() => {
        if (enabled()) rect.current = ref.current?.getBoundingClientRect() ?? null
      }}
      onMouseMove={(e) => {
        pos.current = { x: e.clientX, y: e.clientY }
        if (queued.current || !rect.current) return
        queued.current = true
        requestAnimationFrame(() => {
          queued.current = false
          const r = rect.current
          const el = ref.current
          if (!r || !el) return
          const px = (pos.current.x - r.left) / r.width - 0.5
          const py = (pos.current.y - r.top) / r.height - 0.5
          el.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${py * -max}deg) translateY(-6px) scale(1.015)`
        })
      }}
      onMouseLeave={() => {
        rect.current = null
        if (ref.current) ref.current.style.transform = ''
      }}
    >
      {children}
    </div>
  )
}

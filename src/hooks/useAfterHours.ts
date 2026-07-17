import { useEffect, useState } from 'react'

/**
 * After-hours mode: the whole site drops into the dark studio look
 * between midnight and 6am local time, or whenever the visitor asks
 * for it from the footer toggle. The choice persists in localStorage.
 *
 * Modes: 'auto' (clock decides) | 'dark' | 'light'
 */
export type ThemeMode = 'auto' | 'dark' | 'light'

const KEY = 'immohrtal-theme'
const listeners = new Set<() => void>()

function readMode(): ThemeMode {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'dark' || v === 'light') return v
  } catch {
    /* storage blocked: stay on auto */
  }
  return 'auto'
}

let mode: ThemeMode = typeof window === 'undefined' ? 'auto' : readMode()

function isAfterHours(): boolean {
  return new Date().getHours() < 6
}

export function resolveDark(m: ThemeMode = mode): boolean {
  return m === 'dark' || (m === 'auto' && isAfterHours())
}

function notify() {
  /* html-level class so overscroll edges match the theme */
  document.documentElement.classList.toggle('after-hours', resolveDark(mode))
  listeners.forEach((l) => l())
}

export function cycleTheme() {
  mode = mode === 'auto' ? 'dark' : mode === 'dark' ? 'light' : 'auto'
  try {
    if (mode === 'auto') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, mode)
  } catch {
    /* fine: the choice just won't persist */
  }
  notify()
}

export function useAfterHours(): { mode: ThemeMode; dark: boolean } {
  const [, force] = useState(0)

  useEffect(() => {
    const l = () => force((n) => n + 1)
    listeners.add(l)
    document.documentElement.classList.toggle('after-hours', resolveDark(mode))
    /* in auto, re-check the clock so crossing 6am flips the theme live */
    const t = window.setInterval(() => {
      if (mode === 'auto') notify()
    }, 60_000)
    return () => {
      listeners.delete(l)
      window.clearInterval(t)
    }
  }, [])

  return { mode, dark: resolveDark(mode) }
}

import { useEffect, useRef, useState } from 'react'

/** The element's rendered width, so an SVG viewBox can match it and text keeps its size. */
export function useWidth<T extends HTMLElement>(fallback = 320) {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.round(entry.contentRect.width))))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/** A round axis top in keystrokes per minute: a multiple of 30, so ticks are round in kps too. */
export const niceMax = (values: number[]) => Math.ceil(Math.max(...values) / 30) * 30

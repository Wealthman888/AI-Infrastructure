import { useEffect, useRef, useState } from 'react'

export default function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [grown, setGrown] = useState(false)

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isTouch || reduceMotion) return
    setEnabled(true)

    const move = (e: MouseEvent) => {
      if (!dotRef.current) return
      dotRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
    }

    const onEnter = (e: Event) => {
      if ((e.target as HTMLElement).closest('.magnetic-cta')) setGrown(true)
    }
    const onLeave = (e: Event) => {
      if ((e.target as HTMLElement).closest('.magnetic-cta')) setGrown(false)
    }

    window.addEventListener('mousemove', move)
    document.addEventListener('mouseover', onEnter)
    document.addEventListener('mouseout', onLeave)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseover', onEnter)
      document.removeEventListener('mouseout', onLeave)
    }
  }, [])

  if (!enabled) return null

  return (
    <div
      ref={dotRef}
      className="pointer-events-none fixed left-0 top-0 z-[999] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-gold)] mix-blend-difference transition-[width,height] duration-200"
      style={{ width: grown ? 56 : 16, height: grown ? 56 : 16 }}
    />
  )
}

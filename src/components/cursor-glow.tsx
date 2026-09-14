'use client'

import { useEffect, useRef } from 'react'

const SIZE = 560
const EASING = 0.12

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = glowRef.current
    if (!el) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let targetX = -9999
    let targetY = -9999
    let curX = -9999
    let curY = -9999
    let hasMoved = false
    let raf = 0

    const onMove = (event: MouseEvent) => {
      targetX = event.clientX
      targetY = event.clientY
      if (!hasMoved) {
        hasMoved = true
        el.style.opacity = '1'
      }
    }

    const onLeave = (event: MouseEvent) => {
      if (event.relatedTarget === null) {
        targetX = -9999
        targetY = -9999
      }
    }

    const onBlur = () => {
      targetX = -9999
      targetY = -9999
    }

    const loop = () => {
      curX += (targetX - curX) * EASING
      curY += (targetY - curY) * EASING
      el.style.transform = `translate3d(${curX - SIZE / 2}px, ${curY - SIZE / 2}px, 0)`
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove)
    document.documentElement.addEventListener('mouseleave', onLeave)
    window.addEventListener('blur', onBlur)
    raf = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('blur', onBlur)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={glowRef}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-30 rounded-full opacity-0 transition-opacity duration-700"
      style={{
        width: SIZE,
        height: SIZE,
        transform: 'translate3d(-9999px, -9999px, 0)',
        background:
          'radial-gradient(circle, rgba(59, 130, 246, 0.14) 0%, rgba(59, 130, 246, 0.06) 40%, transparent 70%)',
      }}
    />
  )
}
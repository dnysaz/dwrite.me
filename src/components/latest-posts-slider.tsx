'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { BlogPost } from '@/lib/blog'
import { BlogPostCard } from '@/components/blog-grid'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const AUTO_MS = 4000
const SWIPE_THRESHOLD = 60

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (subscribe) => {
      const mq = window.matchMedia(query)
      mq.addEventListener('change', subscribe)
      return () => mq.removeEventListener('change', subscribe)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export function LatestPostsSlider({
  posts,
  title = 'Latest Blog Post',
  defaultImage = null,
}: {
  posts: BlogPost[]
  title?: string
  defaultImage?: string | null
}) {
  const isLg = useMediaQuery('(min-width: 1024px)')
  const isSm = useMediaQuery('(min-width: 640px)')
  const perView = isLg ? 3 : isSm ? 2 : 1
  const slides = Math.max(1, Math.ceil(posts.length / perView))

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)

  const trackRef = useRef<HTMLDivElement>(null)
  const resumeTimerRef = useRef<number | null>(null)
  const dragCaptureRef = useRef<number | null>(null)
  const dragRef = useRef({
    active: false,
    startX: 0,
    startIndex: 0,
    moved: 0,
    dx: 0,
  })
  const suppressClickRef = useRef(false)

  const current = index % slides

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => {
      setIndex((i) => {
        const total = Math.max(1, Math.ceil(posts.length / perView))
        return ((i + 1) % total) + total
      })
    }, AUTO_MS)
    return () => window.clearInterval(id)
  }, [paused, perView, posts.length])

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current)
    }
  }, [])

  const resumeSoon = (delay = 1200) => {
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = window.setTimeout(() => {
      resumeTimerRef.current = null
      setPaused(false)
    }, delay)
  }

  const goTo = (next: number) => {
    setPaused(true)
    resumeSoon(AUTO_MS)
    setIndex(() => {
      const total = Math.max(1, Math.ceil(posts.length / perView))
      return ((next % total) + total) % total
    })
  }

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startIndex: current,
      moved: 0,
      dx: 0,
    }
    setDragging(true)
    setPaused(true)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return
    const dx = event.clientX - dragRef.current.startX
    dragRef.current.dx = dx
    dragRef.current.moved = Math.abs(dx)

    if (
      dragCaptureRef.current === null &&
      dragRef.current.moved > 6 &&
      trackRef.current
    ) {
      dragCaptureRef.current = event.pointerId
      try {
        trackRef.current.setPointerCapture(event.pointerId)
      } catch {
        dragCaptureRef.current = null
      }
    }

    setDragOffset(dx)
  }

  const onPointerUp = () => {
    if (!dragRef.current.active) return
    dragCaptureRef.current = null
    const { startIndex, moved, dx } = dragRef.current
    dragRef.current.active = false
    setDragging(false)
    setDragOffset(0)

    if (moved >= SWIPE_THRESHOLD) {
      suppressClickRef.current = true
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 150)
      if (dx < -SWIPE_THRESHOLD) goTo(startIndex + 1)
      else if (dx > SWIPE_THRESHOLD) goTo(startIndex - 1)
    }

    resumeSoon()
  }

  const onPointerCancel = () => {
    dragCaptureRef.current = null
    dragRef.current.active = false
    setDragging(false)
    setDragOffset(0)
    resumeSoon()
  }

  const handleTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      event.preventDefault()
      event.stopPropagation()
    }
  }

  return (
    <section className="flex flex-col gap-10 border-t border-border py-24">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h2>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label="Previous posts"
            onClick={() => goTo(current - 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next posts"
            onClick={() => goTo(current + 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className="relative overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onClickCapture={handleTrackClick}
      >
        <div
          ref={trackRef}
          className="flex touch-pan-y"
          style={{
            transform: `translateX(calc(${-current * (100 / perView)}% + ${dragOffset}px))`,
            transition: dragging ? 'none' : 'transform 500ms ease',
          }}
        >
          {posts.map((post, i) => (
            <div
              key={`${post.slug}-${i}`}
              className="w-full shrink-0 px-1.5 sm:w-1/2 lg:w-1/3"
            >
              <BlogPostCard post={post} defaultImage={defaultImage} />
            </div>
          ))}
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:w-12"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:w-12"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {Array.from({ length: slides }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${
                i === current
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-border hover:bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>

        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          View All Posts
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
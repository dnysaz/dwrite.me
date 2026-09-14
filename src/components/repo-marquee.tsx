'use client'

import { useEffect, useRef } from 'react'
import { formatCount, languageColors, type GithubRepo } from '@/lib/github'

const SPEED = 18 // px per second
const IDLE_RESUME_MS = 2500

export function RepoMarquee({ repos }: { repos: GithubRepo[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const resumeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let raf = 0
    let last = performance.now()

    const step = (now: number) => {
      const dt = (now - last) / 1000
      last = now

      if (!pausedRef.current && !document.hidden) {
        el.scrollLeft += SPEED * dt
        const half = el.scrollWidth / 2
        if (el.scrollLeft >= half) el.scrollLeft -= half
      }

      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)

    const pause = () => {
      pausedRef.current = true
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = window.setTimeout(() => {
        pausedRef.current = false
      }, IDLE_RESUME_MS)
    }

    el.addEventListener('wheel', pause, { passive: true })
    el.addEventListener('touchstart', pause, { passive: true })
    el.addEventListener('pointerdown', pause, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current)
      el.removeEventListener('wheel', pause)
      el.removeEventListener('touchstart', pause)
      el.removeEventListener('pointerdown', pause)
    }
  }, [])

  const cards = repos.concat(repos)

  return (
    <div
      ref={containerRef}
      className="relative flex cursor-grab overflow-x-auto overscroll-x-contain active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none sticky left-0 z-10 w-16 shrink-0 bg-gradient-to-r from-background to-transparent sm:w-24"
      />
      <div className="flex w-max shrink-0 gap-4 py-2">
        {cards.map((repo, i) => {
          const color = repo.language
            ? languageColors[repo.language] ?? '#94a3b8'
            : '#94a3b8'

          return (
            <a
              key={`${repo.id}-${i}`}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-64 shrink-0 flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
            >
              <h3 className="truncate text-base font-semibold text-primary">
                {repo.name}
              </h3>
              {repo.description && (
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {repo.description}
                </p>
              )}
              <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                {repo.language && (
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {repo.language}
                  </span>
                )}
                <span>★ {formatCount(repo.stargazers_count)}</span>
              </div>
            </a>
          )
        })}
      </div>
      <div
        aria-hidden
        className="pointer-events-none sticky right-0 z-10 w-16 shrink-0 bg-gradient-to-l from-background to-transparent sm:w-24"
      />
    </div>
  )
}
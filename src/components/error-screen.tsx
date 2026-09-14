'use client'

import Link from 'next/link'
import {
  Bug,
  CloudOff,
  Coffee,
  Ghost,
  Hammer,
  Home,
  RotateCcw,
  ShieldX,
  SearchX,
  Bot,
  type LucideIcon,
} from 'lucide-react'

// Icon dikirim sebagai nama (string) supaya halaman server bisa memakai
// komponen client ini tanpa melanggar batas serialisasi RSC.
const ICONS: Record<string, LucideIcon> = {
  ghost: Ghost,
  bug: Bug,
  shieldx: ShieldX,
  bot: Bot,
  coffee: Coffee,
  hammer: Hammer,
  cloudoff: CloudOff,
  searchx: SearchX,
}

export type ErrorIconName = keyof typeof ICONS

export function ErrorScreen({
  code,
  icon,
  title,
  description,
  resetLabel,
  onReset,
  secondaryHref,
  secondaryLabel,
}: {
  code: string
  icon: ErrorIconName
  title: string
  description: string
  resetLabel?: string
  onReset?: () => void
  secondaryHref?: string
  secondaryLabel?: string
}) {
  const Icon = ICONS[icon] ?? Ghost

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-16 text-center">
      {/* Bubble latar sesuai tema homepage */}
      <div
        aria-hidden
        className="pointer-events-none fixed -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-6">
        <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-border bg-card shadow-lg">
          <Icon className="h-20 w-20 text-primary" strokeWidth={1.5} />
          <span
            aria-hidden
            className="absolute -bottom-1 left-1/2 h-3 w-3/4 -translate-x-1/2 rounded-full bg-primary/20 blur-md"
          />
        </div>

        <p
          aria-hidden
          className="select-none text-7xl font-black tracking-tighter text-primary/15 sm:text-8xl"
        >
          {code}
        </p>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {onReset && resetLabel && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <RotateCcw className="h-4 w-4" />
              {resetLabel}
            </button>
          )}
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {secondaryLabel}
            </Link>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

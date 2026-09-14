'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'

export function MobileNav({
  links,
  loggedIn,
}: {
  links: { href: string; label: string }[]
  loggedIn: boolean
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const allLinks = loggedIn
    ? [...links, { href: '/dashboard', label: 'Dashboard' }]
    : links

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-muted"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 z-10 border-b border-border bg-background/95 backdrop-blur">
          <nav className="mx-auto flex w-full max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {allLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2.5 text-base font-medium transition-colors hover:bg-muted hover:text-foreground ${
                    isActive
                      ? 'bg-muted text-foreground underline decoration-primary decoration-2 underline-offset-4'
                      : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </div>
  )
}
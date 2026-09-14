'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MobileNav } from '@/components/mobile-nav'
import { NavLinks } from '@/components/nav-links'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About Me' },
  { href: '/contact', label: 'Contact' },
  { href: '/help', label: 'Help' },
]

export function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false)

  // Cek login di sisi client dari cookie sesi Supabase.
  // Ini membuat Navbar tidak pernah menyentuh cookies() di server,
  // sehingga halaman publik tetap bisa dirender statis/ISR (cepat).
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setLoggedIn(Boolean(data.session))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(Boolean(session))
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-foreground"
        >
          dwrite.me
        </Link>

        <div className="hidden items-center gap-5 text-base font-medium sm:flex sm:gap-6">
          <NavLinks links={navLinks} loggedIn={loggedIn} />
        </div>

        <MobileNav links={navLinks} loggedIn={loggedIn} />
      </nav>
    </header>
  )
}

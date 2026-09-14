import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { MobileNav } from '@/components/mobile-nav'
import { NavLinks } from '@/components/nav-links'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About Me' },
  { href: '/contact', label: 'Contact' },
  { href: '/help', label: 'Help' },
]

export async function Navbar() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  const user = data?.user

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
          <NavLinks links={navLinks} loggedIn={Boolean(user)} />
        </div>

        <MobileNav links={navLinks} loggedIn={Boolean(user)} />
      </nav>
    </header>
  )
}
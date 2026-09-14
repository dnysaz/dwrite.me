'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const baseLink =
  'underline-offset-4 transition-colors'

const idleLink = 'text-muted-foreground hover:text-foreground hover:underline hover:decoration-primary hover:decoration-2'

const activeLink = 'text-foreground underline decoration-primary decoration-2'

export function NavLinks({
  links,
  loggedIn,
}: {
  links: { href: string; label: string }[]
  loggedIn: boolean
}) {
  const pathname = usePathname()
  const allLinks = loggedIn
    ? [...links, { href: '/dashboard', label: 'Dashboard' }]
    : links

  return (
    <>
      {allLinks.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href !== '/' && pathname.startsWith(link.href))
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`${baseLink} ${isActive ? activeLink : idleLink}`}
          >
            {link.label}
          </Link>
        )
      })}
    </>
  )
}
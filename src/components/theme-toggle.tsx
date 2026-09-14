'use client'

import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="fixed right-6 bottom-6 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg transition-colors hover:bg-muted"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
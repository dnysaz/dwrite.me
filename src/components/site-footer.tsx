import { LogIn, Mail } from 'lucide-react'
import { GithubIcon, InstagramIcon, WhatsAppIcon } from '@/components/icons'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:gap-4 sm:px-6">
        <p className="text-center text-sm text-muted-foreground sm:text-left">
          © 2026 dwrite.me · Ketut Dana
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium">
          <a
            href="https://github.com/dnysaz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <GithubIcon className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="https://wa.me/6285792721649"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <WhatsAppIcon className="h-4 w-4" />
            WhatsApp
          </a>
          <a
            href="https://instagram.com/kdanays"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <InstagramIcon className="h-4 w-4" />
            Instagram
          </a>
          <a
            href="mailto:danayasa2@gmail.com"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mail className="h-4 w-4" />
            Email
          </a>
          <a
            href="/login"
            className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
          >
            <LogIn className="h-4 w-4" />
            Login
          </a>
        </div>
      </div>
    </footer>
  )
}
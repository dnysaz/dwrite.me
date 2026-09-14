import { Mail } from 'lucide-react'
import { GithubIcon, InstagramIcon, WhatsAppIcon } from '@/components/icons'

const contacts = [
  {
    label: { en: 'WhatsApp', id: 'WhatsApp' },
    value: '+62 857-9272-1649',
    href: 'https://wa.me/6285792721649',
    external: true,
    icon: <WhatsAppIcon className="h-6 w-6" />,
  },
  {
    label: { en: 'Email', id: 'Email' },
    value: 'danayasa2@gmail.com',
    href: 'mailto:danayasa2@gmail.com',
    external: false,
    icon: <Mail className="h-6 w-6" />,
  },
  {
    label: { en: 'Instagram', id: 'Instagram' },
    value: '@kdanays',
    href: 'https://instagram.com/kdanays',
    external: true,
    icon: <InstagramIcon className="h-6 w-6" />,
  },
  {
    label: { en: 'GitHub', id: 'GitHub' },
    value: '@dnysaz',
    href: 'https://github.com/dnysaz',
    external: true,
    icon: <GithubIcon className="h-6 w-6" />,
  },
] as const

export function ContactCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {contacts.map((contact) => (
        <a
          key={contact.value}
          href={contact.href}
          {...(contact.external
            ? { target: '_blank', rel: 'noopener noreferrer' as const }
            : {})}
          className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-muted"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors group-hover:border-primary/40">
            {contact.icon}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm text-muted-foreground">
              {contact.label.en}
            </span>
            <span className="truncate text-base font-semibold">
              {contact.value}
            </span>
          </span>
        </a>
      ))}
    </div>
  )
}
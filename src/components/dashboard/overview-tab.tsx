import Image from 'next/image'
import { FileText, Inbox, User } from 'lucide-react'

export function OverviewTab({
  name,
  avatarUrl,
  email,
  postsCount,
  messagesCount,
}: {
  name: string
  avatarUrl: string | null
  email: string
  postsCount: number
  messagesCount: number
}) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-xl font-bold text-primary">
            {initials || 'KD'}
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 className="truncate text-2xl font-bold tracking-tight">{name}</h2>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{postsCount}</span>
            <span className="text-sm text-muted-foreground">Blog posts</span>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Inbox className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold">{messagesCount}</span>
            <span className="text-sm text-muted-foreground">
              Contact messages
            </span>
          </div>
        </div>
      </div>

      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        Manage your blog, update your profile & password, and log out using the
        tabs above.
      </p>
    </div>
  )
}
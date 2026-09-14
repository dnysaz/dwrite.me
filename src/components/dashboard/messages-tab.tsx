'use client'

import { useState } from 'react'
import { Archive, Mail, MailOpen, Trash2 } from 'lucide-react'
import {
  permanentlyDeleteMessage,
  setMessageStatus,
} from '@/app/dashboard/actions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { DashboardMessage } from '@/components/dashboard/dashboard-client'

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Makassar',
  })
}

type SubTab = 'new' | 'inbox' | 'deleted'

const PAGE_SIZE = 10

function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<>]+)/g)
  return (
    <>
      {parts.map((part, index) =>
        /^https?:\/\//i.test(part) ? (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
          >
            {part}
          </a>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}

function MessageCard({
  message,
  tab,
  expanded,
  onToggle,
}: {
  message: DashboardMessage
  tab: SubTab
  expanded: boolean
  onToggle: () => void
}) {
  const isNew =
    message.status === 'new' || (message.status !== 'deleted' && !message.is_read)
  const long = message.message.length > 120 || message.message.includes('\n')

  return (
    <li
      className={`flex flex-col gap-3 rounded-2xl border p-5 ${
        isNew && tab !== 'deleted'
          ? 'border-primary/40 bg-primary/5'
          : 'border-border bg-card'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{message.name}</h3>
            {isNew && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                New
              </span>
            )}
          </div>
          <a
            href={`mailto:${message.email}`}
            className="truncate text-sm text-primary hover:underline"
          >
            {message.email}
          </a>
        </div>
        <time className="text-xs text-muted-foreground">
          {formatDate(message.created_at)}
        </time>
      </div>

      <p
        className={`whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground ${
          expanded ? '' : 'line-clamp-2'
        }`}
      >
        <LinkifiedText text={message.message} />
      </p>
      {long && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="w-fit text-sm font-semibold text-primary hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {tab === 'new' && (
          <form action={setMessageStatus}>
            <input type="hidden" name="id" value={message.id} />
            <input type="hidden" name="status" value="read" />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <MailOpen className="h-4 w-4" />
              Mark read
            </button>
          </form>
        )}

        {tab === 'inbox' && (
          <form action={setMessageStatus}>
            <input type="hidden" name="id" value={message.id} />
            <input type="hidden" name="status" value="new" />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <Mail className="h-4 w-4" />
              Mark unread
            </button>
          </form>
        )}

        {tab !== 'deleted' && (
          <form action={setMessageStatus}>
            <input type="hidden" name="id" value={message.id} />
            <input type="hidden" name="status" value="deleted" />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </form>
        )}

        {tab === 'deleted' && (
          <ConfirmDialog
            title="Delete permanently?"
            description={`Message from ${message.name} (${message.email}) will be permanently deleted. This action cannot be undone.`}
            confirmLabel="Delete"
            formAction={permanentlyDeleteMessage}
            trigger={
              <button
                type="button"
                aria-label={`Delete ${message.name}'s message permanently`}
                className="inline-flex items-center gap-1.5 rounded-full border border-destructive px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
                Delete permanently
              </button>
            }
          >
            <input type="hidden" name="id" value={message.id} />
          </ConfirmDialog>
        )}
      </div>
    </li>
  )
}

function emptyState(tab: SubTab) {
  if (tab === 'new') {
    return 'No new messages. Messages sent from the contact form will appear here.'
  }
  if (tab === 'inbox') {
    return 'No read messages yet. Messages you mark as read will appear here.'
  }
  return 'No deleted messages.'
}

export function MessagesTab({ messages }: { messages: DashboardMessage[] }) {
  const [tab, setTab] = useState<SubTab>('new')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const newMessages = messages.filter((message) => message.status === 'new')
  const inboxMessages = messages.filter((message) => message.status === 'read')
  const deletedMessages = messages.filter(
    (message) => message.status === 'deleted',
  )

  const subTabs = [
    { id: 'new', label: 'New', count: newMessages.length, icon: Mail },
    {
      id: 'inbox',
      label: 'Inbox',
      count: inboxMessages.length,
      icon: MailOpen,
    },
    {
      id: 'deleted',
      label: 'Deleted',
      count: deletedMessages.length,
      icon: Archive,
    },
  ] as const

  const current =
    tab === 'new' ? newMessages : tab === 'inbox' ? inboxMessages : deletedMessages
  const visible = current.slice(0, visibleCount)
  const hasMore = visibleCount < current.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Messages</h2>
      </div>

      <div className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1">
        {subTabs.map(({ id, label, count, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id)
              setExpandedId(null)
              setVisibleCount(PAGE_SIZE)
            }}
            aria-current={tab === id ? 'page' : undefined}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            <span
              className={`inline-flex min-w-4 items-center justify-center rounded-full px-1.5 text-xs font-bold leading-none ${
                tab === id
                  ? 'bg-primary-foreground text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {current.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {emptyState(tab)}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              tab={tab}
              expanded={expandedId === message.id}
              onToggle={() =>
                setExpandedId(expandedId === message.id ? null : message.id)
              }
            />
          ))}
        </ul>
      )}

      {current.length > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min(visibleCount, current.length)} of {current.length}{' '}
            messages
          </p>
          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  )
}
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { LayoutDashboard, FileText, Inbox, Settings } from 'lucide-react'
import { OverviewTab } from '@/components/dashboard/overview-tab'
import { BlogTab } from '@/components/dashboard/blog-tab'
import { SettingsTab } from '@/components/dashboard/settings-tab'
import { MessagesTab } from '@/components/dashboard/messages-tab'
import type { GeminiKeyStatus } from '@/app/dashboard/actions'

export type DashboardProfile = {
  id?: string
  display_name: string | null
  avatar_url: string | null
  bio_en: string | null
}

export type DashboardPost = {
  id: string
  title: string
  slug: string
  status: string
  published_at: string | null
  read_time_minutes: number
  categories: { name: string } | { name: string }[] | null
}

export type DashboardMessage = {
  id: string
  name: string
  email: string
  message: string
  is_read: boolean
  status: string
  created_at: string
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'messages', label: 'Messages', icon: Inbox },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

type TabId = (typeof tabs)[number]['id']

export function DashboardClient({
  email,
  profile,
  posts,
  postsCount,
  messagesCount,
  unreadMessagesCount,
  messages,
  siteOgImage,
  geminiKeyStatus,
  encryptionConfigured,
}: {
  email: string
  profile: DashboardProfile | null
  posts: DashboardPost[]
  postsCount: number
  messagesCount: number
  unreadMessagesCount: number
  messages: DashboardMessage[]
  siteOgImage: string | null
  geminiKeyStatus: GeminiKeyStatus
  encryptionConfigured: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const requestedTab = searchParams.get('tab')
  const activeTab: TabId = tabs.some((tab) => tab.id === requestedTab)
    ? (requestedTab as TabId)
    : 'dashboard'

  const goToTab = (id: TabId) => {
    router.push(
      id === 'dashboard' ? '/dashboard' : `/dashboard?tab=${id}`,
      { scroll: false },
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Dashboard
        </h1>
        <p className="text-base text-muted-foreground">
          Welcome back, {profile?.display_name ?? email}
        </p>
      </div>

      <div className="inline-flex w-fit items-center gap-1 rounded-full border border-border bg-card p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => goToTab(id)}
            aria-current={activeTab === id ? 'page' : undefined}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === 'messages' && unreadMessagesCount > 0 && (
              <span
                aria-label={`${unreadMessagesCount} unread messages`}
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold leading-none text-white"
              >
                {unreadMessagesCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <OverviewTab
          name={profile?.display_name ?? email}
          avatarUrl={profile?.avatar_url ?? null}
          email={email}
          postsCount={postsCount}
          messagesCount={messagesCount}
        />
      )}

      {activeTab === 'blog' && <BlogTab posts={posts} />}

      {activeTab === 'messages' && <MessagesTab messages={messages} />}

      {activeTab === 'settings' && (
        <SettingsTab
          email={email}
          initialName={profile?.display_name ?? ''}
          initialAvatarUrl={profile?.avatar_url ?? null}
          initialBioEn={profile?.bio_en ?? ''}
          initialOgImageUrl={siteOgImage}
          geminiKeyStatus={geminiKeyStatus}
          encryptionConfigured={encryptionConfigured}
        />
      )}
    </div>
  )
}
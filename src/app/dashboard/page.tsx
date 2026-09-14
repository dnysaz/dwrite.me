import { redirect } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { getDashboardData, getGeminiKeyStatus } from '@/app/dashboard/actions'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

export default async function DashboardPage() {
  const data = await getDashboardData()

  if (!data) {
    redirect('/login')
  }

  const geminiKeyStatus = await getGeminiKeyStatus()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:px-6">
        <DashboardClient
          email={data.user.email ?? ''}
          profile={data.profile}
          posts={data.posts}
          postsCount={data.postsCount}
          messagesCount={data.messagesCount}
          unreadMessagesCount={data.unreadMessagesCount}
          messages={data.messages}
          siteOgImage={data.siteOgImage}
          geminiKeyStatus={geminiKeyStatus}
          encryptionConfigured={Boolean(process.env.APP_ENCRYPTION_KEY)}
        />
      </main>
    </div>
  )
}
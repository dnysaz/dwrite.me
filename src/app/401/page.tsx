import type { Metadata } from 'next'
import { ErrorScreen } from '@/components/error-screen'

export const metadata: Metadata = {
  title: 'Login Required',
}

export default function UnauthorizedPage() {
  return (
    <ErrorScreen
      code="401"
      emoji="🤖"
      icon="bot"
      title="You need to sign in first."
      description="This area is only for the blog owner. Sign in to continue, or head back to the blog."
      secondaryHref="/login"
      secondaryLabel="Go to Login"
    />
  )
}

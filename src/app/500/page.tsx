import type { Metadata } from 'next'
import { ErrorScreen } from '@/components/error-screen'

export const metadata: Metadata = {
  title: 'Server Error',
}

export default function ServerErrorPage() {
  return (
    <ErrorScreen
      code="500"
      emoji="☕"
      icon="coffee"
      title="The server is taking a coffee break."
      description="We could not process this request right now. It is usually temporary — try again in a moment."
      secondaryHref="/blog"
      secondaryLabel="Read the Blog"
    />
  )
}

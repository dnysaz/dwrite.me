import type { Metadata } from 'next'
import { ErrorScreen } from '@/components/error-screen'

export const metadata: Metadata = {
  title: 'Page Not Found',
}

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      emoji="👻"
      icon="ghost"
      title="This page went ghost-hunting."
      description="The page you are looking for does not exist, moved, or never did. Let us get you back to something real."
    />
  )
}

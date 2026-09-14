import type { Metadata } from 'next'
import { ErrorScreen } from '@/components/error-screen'

export const metadata: Metadata = {
  title: 'Under Maintenance',
}

export default function MaintenancePage() {
  return (
    <ErrorScreen
      code="503"
      icon="hammer"
      title="Under maintenance — be right back."
      description="The site is getting a quick tune-up. This page will be back online shortly."
      secondaryHref="/blog"
      secondaryLabel="Read the Blog"
    />
  )
}

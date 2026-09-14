import type { Metadata } from 'next'
import { ErrorScreen } from '@/components/error-screen'

export const metadata: Metadata = {
  title: 'Access Denied',
}

export default function ForbiddenPage() {
  return (
    <ErrorScreen
      code="403"
      icon="shieldx"
      title="No entry for humans… or anyone."
      description="You do not have permission to open this area. If you think this is a mistake, contact the site owner."
    />
  )
}

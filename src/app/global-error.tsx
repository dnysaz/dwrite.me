'use client'

import { ErrorScreen } from '@/components/error-screen'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">
        <ErrorScreen
          code="500"
          icon="cloudoff"
          title="Something crashed up there."
          description="The whole page hit a snag it could not recover from. A refresh usually fixes this one."
          resetLabel="Reload"
          onReset={reset}
        />
      </body>
    </html>
  )
}

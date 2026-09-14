'use client'

import { ErrorScreen } from '@/components/error-screen'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorScreen
      code="500"
      icon="bug"
      title="A tiny bug got loose."
      description="Something went wrong on our side while loading this page. It has been noted — give it another try."
      resetLabel="Try again"
      onReset={reset}
    />
  )
}

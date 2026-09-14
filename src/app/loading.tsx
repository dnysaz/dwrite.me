export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="sticky top-0 z-10 h-16 border-b border-border bg-background/80" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="h-12 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="h-5 w-96 max-w-full animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="aspect-[2/1] w-full animate-pulse rounded-xl bg-muted" />
              <div className="h-5 w-3/4 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

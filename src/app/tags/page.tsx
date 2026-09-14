import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { collectTags, getPublishedPosts } from '@/lib/blog'
import { siteUrl } from '@/lib/seo'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Tags',
  description: 'Browse all tags used across the blog articles.',
  alternates: { canonical: siteUrl('/tags') },
}

export default async function TagsPage() {
  const posts = await getPublishedPosts()
  const tags = collectTags(posts)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Tags
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Browse all articles by tag.
          </p>
        </div>

        {tags.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No tags yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { getPublishedPosts } from '@/lib/blog'
import { SITE_CATEGORIES } from '@/lib/categories'
import { siteUrl } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse all blog categories.',
  alternates: { canonical: siteUrl('/category') },
}

export default async function CategoryPage() {
  const posts = await getPublishedPosts()
  const counts = new Map<string, number>()
  for (const post of posts) {
    if (!post.category_name) continue
    counts.set(
      post.category_name,
      (counts.get(post.category_name) ?? 0) + 1,
    )
  }

  const categories = [
    ...new Set([
      ...SITE_CATEGORIES.filter((name) => counts.has(name)),
      ...[...counts.keys()].filter(
        (name) => !SITE_CATEGORIES.includes(name as never),
      ),
    ]),
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Categories
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Browse all articles by category.
          </p>
        </div>

        {categories.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
            No categories yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {categories.map((name) => (
              <Link
                key={name}
                href={`/category/${encodeURIComponent(name)}`}
                className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                {name}
                {counts.has(name) && (
                  <span className="ml-2 text-xs font-normal opacity-70">
                    {counts.get(name)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

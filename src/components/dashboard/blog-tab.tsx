import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, PenLine, Plus, Trash2 } from 'lucide-react'
import { deletePost } from '@/app/dashboard/actions'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { DashboardPost } from '@/components/dashboard/dashboard-client'

function formatDate(value: string | null) {
  if (!value) return 'Draft'
  return new Date(value).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  })
}

function categoryName(
  categories: DashboardPost['categories'],
): string | null {
  if (Array.isArray(categories)) return categories[0]?.name ?? null
  return categories?.name ?? null
}

export function BlogTab({ posts }: { posts: DashboardPost[] }) {
  const router = useRouter()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Blog Posts</h2>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {posts.length} posts
          </span>
          <Link
            href="/dashboard/create-post"
            onMouseEnter={() => router.prefetch('/dashboard/create-post')}
            onFocus={() => router.prefetch('/dashboard/create-post')}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Post
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          No posts yet. Create your first post with the New Post button.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold">
                    {post.title}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      post.status === 'published'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {post.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {categoryName(post.categories) ?? 'No category'} ·{' '}
                  {formatDate(post.published_at)} ·{' '}
                  {post.read_time_minutes} min read
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/dashboard/create-post?id=${post.id}`}
                  onMouseEnter={() =>
                    router.prefetch(`/dashboard/create-post?id=${post.id}`)
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  <PenLine className="h-4 w-4" />
                  Edit
                </Link>
                {post.status === 'published' && (
                  <Link
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View
                  </Link>
                )}
                <ConfirmDialog
                  title="Delete this post?"
                  description="This post will be permanently deleted, including its thumbnail image. This action cannot be undone."
                  confirmLabel="Delete"
                  formAction={deletePost}
                  trigger={
                    <button
                      type="button"
                      aria-label={`Delete ${post.title}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  }
                >
                  <input type="hidden" name="id" value={post.id} />
                </ConfirmDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
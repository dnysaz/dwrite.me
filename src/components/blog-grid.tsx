import Link from 'next/link'
import Image from 'next/image'
import type { BlogPost } from '@/lib/blog'

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  })
}

function postImage(
  post: Pick<BlogPost, 'cover_image_url'>,
  defaultImage: string | null,
) {
  if (post.cover_image_url && /^https?:\/\//i.test(post.cover_image_url)) {
    return post.cover_image_url
  }
  return defaultImage
}

function CardImage({
  post,
  defaultImage,
}: {
  post: BlogPost
  defaultImage: string | null
}) {
  const src = postImage(post, defaultImage)
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-muted to-muted" />
    )
  }
  return (
    <Image
      src={src}
      alt={post.title}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="object-cover transition-transform duration-300 group-hover:scale-105"
    />
  )
}

export function BlogGrid({
  posts,
  defaultImage,
}: {
  posts: BlogPost[]
  defaultImage?: string | null
}) {
  if (posts.length === 0) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        No published posts yet.
      </p>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <BlogPostCard
          key={post.slug}
          post={post}
          defaultImage={defaultImage ?? null}
        />
      ))}
    </div>
  )
}

export function BlogPostCard({
  post,
  defaultImage,
}: {
  post: BlogPost
  defaultImage?: string | null
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <CardImage post={post} defaultImage={defaultImage ?? null} />
        {post.category_name && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
            {post.category_name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <time>{formatDate(post.published_at)}</time>
          {post.published_at && <span aria-hidden="true">•</span>}
          <span>{post.read_time_minutes} min read</span>
        </div>
        <h2 className="text-lg font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
          {post.title}
        </h2>
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
      </div>
    </Link>
  )
}

export function RelatedPostCard({
  post,
  defaultImage,
}: {
  post: BlogPost
  defaultImage?: string | null
}) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/50"
    >
      <div className="relative aspect-[3/2] overflow-hidden">
        <CardImage post={post} defaultImage={defaultImage ?? null} />
        {post.category_name && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">
            {post.category_name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-base font-bold leading-snug tracking-tight transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-auto text-sm text-muted-foreground">
          by Ketut Dana <span aria-hidden="true">•</span>{' '}
          {post.read_time_minutes} min read
        </p>
      </div>
    </Link>
  )
}
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { RelatedPostCard } from '@/components/blog-grid'
import { getPostBySlug, getPublishedPosts, getRelatedPosts, publicImage } from '@/lib/blog'
import { sanitizePostContent } from '@/lib/sanitize'
import { getSiteOgImage } from '@/lib/site'
import { firstWords, httpsUrl, SITE_NAME, siteUrl, stripHtmlToText } from '@/lib/seo'

// ISR: halaman artikel di-cache 5 menit; revalidatePath saat publish/update
// (dari dashboard) menyegarkan segera.
export const revalidate = 300

export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) return { title: 'Post Not Found' }

  const description = firstWords(stripHtmlToText(post.content), 100)
  const defaultImage = await getSiteOgImage()
  const image = httpsUrl(post.cover_image_url) ?? defaultImage

  return {
    title: post.title,
    description,
    alternates: { canonical: siteUrl(`/blog/${post.slug}`) },
    openGraph: {
      type: 'article',
      title: post.title,
      description,
      url: siteUrl(`/blog/${post.slug}`),
      siteName: SITE_NAME,
      images: image
        ? [{ url: image, alt: post.title }]
        : [],
      publishedTime: post.published_at ?? undefined,
      tags: post.tags ?? undefined,
      section: post.category_name ?? undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: image ? [image] : [],
    },
  }
}

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  })
}

function formatAuthorBio(bio: string) {
  const parts = bio.split(/(https?:\/\/[^\s]+)/g)
  return parts.map((part, index) =>
    /^https?:\/\//i.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline dark:text-blue-400"
      >
        {part}
      </a>
    ) : (
      part
    ),
  )
}

function AuthorAvatar({ name, src }: { name: string; src: string | null }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={64}
        height={64}
        className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
      />
    )
  }

  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-xl font-bold text-primary">
      {initials || 'KD'}
    </span>
  )
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  post.content = sanitizePostContent(post.content)

  const defaultImage = await getSiteOgImage()
  const heroImage = publicImage(post.cover_image_url, defaultImage)
  const relatedPosts = await getRelatedPosts(slug, post.category_name, 3)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-16 sm:px-6">
        <Link
          href="/blog"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        <article className="flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              {post.title}
            </h1>
            {post.category_name && (
              <Link
                href={`/category/${encodeURIComponent(post.category_name)}`}
                className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                {post.category_name}
              </Link>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <time>{formatDate(post.published_at)}</time>
              <span aria-hidden="true">•</span>
              <span>{post.read_time_minutes} min read</span>
              <span aria-hidden="true">•</span>
              <span>by {post.author_name ?? 'Ketut Dana'}</span>
            </div>
          </header>

          <div className="relative aspect-[2/1] overflow-hidden rounded-2xl border border-border">
            {heroImage ? (
              <Image
                src={heroImage}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-muted to-muted" />
            )}
          </div>

          <div
            className="prose break-words whitespace-pre-line text-lg leading-relaxed text-foreground/90 [&_a]:text-blue-600 [&_a]:underline-offset-2 [&_a:hover]:underline dark:[&_a]:text-blue-400"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {(post.tags?.length ?? 0) > 0 && (
            <footer className="border-t border-border pt-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Tags:
                </span>
                {post.tags!.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </footer>
          )}
        </article>

        <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            About Author
          </h2>
          <div className="flex items-start gap-4">
            <AuthorAvatar
              name={post.author_name ?? 'Ketut Dana'}
              src={post.author_avatar_url}
            />
            <div className="flex min-w-0 flex-col gap-2">
              <p className="text-lg font-semibold leading-tight">
                {post.author_name ?? 'Ketut Dana'}
              </p>
              {post.author_bio && (
                <p className="whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {formatAuthorBio(post.author_bio)}
                </p>
              )}
            </div>
          </div>
        </section>

        {relatedPosts.length > 0 && (
          <section className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Related Articles
            </h2>
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
              {relatedPosts.map((related) => (
                <RelatedPostCard
                  key={related.slug}
                  post={related}
                  defaultImage={defaultImage}
                />
              ))}
            </div>
          </section>
        )}

        <div className="border-t border-border pt-8">
          <Link
            href="/blog"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </main>
    </div>
  )
}
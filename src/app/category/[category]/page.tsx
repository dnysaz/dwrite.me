import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { BlogGrid } from '@/components/blog-grid'
import { getPostsByCategory, getPublishedPosts } from '@/lib/blog'
import { getSiteOgImage } from '@/lib/site'
import { siteUrl } from '@/lib/seo'

export const revalidate = 300

export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  const categories = [
    ...new Set(
      posts
        .map((post) => post.category_name)
        .filter((name): name is string => Boolean(name)),
    ),
  ]
  return categories.map((category) => ({
    category: encodeURIComponent(category),
  }))
}

type Params = { params: Promise<{ category: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params
  const decoded = decodeURIComponent(category)

  return {
    title: `Category: ${decoded}`,
    description: `Articles in the "${decoded}" category.`,
    alternates: { canonical: siteUrl(`/category/${category}`) },
  }
}

export default async function CategoryPostsPage({ params }: Params) {
  const { category } = await params
  const decoded = decodeURIComponent(category)
  const posts = await getPostsByCategory(decoded)

  if (posts.length === 0) notFound()

  const defaultImage = await getSiteOgImage()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/category"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All Categories
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {decoded}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {posts.length} article{posts.length > 1 ? 's' : ''} in &quot;
            {decoded}&quot;
          </p>
        </div>

        <BlogGrid posts={posts} defaultImage={defaultImage} />
      </main>
    </div>
  )
}

import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { BlogGrid } from '@/components/blog-grid'
import { getPublishedPosts } from '@/lib/blog'
import { getSiteOgImage } from '@/lib/site'
import { siteUrl } from '@/lib/seo'

// ISR: halaman daftar post di-cache 5 menit (menit kecepatan, tetap fresh).

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Daily notes by Ketut Dana about coding, AI, open source, networking, and self development.',
  alternates: { canonical: siteUrl('/blog') },
  openGraph: {
    type: 'website',
    title: 'Blog | dwrite.me',
    description:
      'Daily notes about coding, AI, open source, networking, and self development.',
    url: siteUrl('/blog'),
  },
  twitter: {
    card: 'summary',
    title: 'Blog | dwrite.me',
    description: 'Daily notes by Ketut Dana about coding, AI, and open source.',
  },
}

export default async function BlogPage() {
  const posts = await getPublishedPosts()
  const defaultImage = await getSiteOgImage()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-12 px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Blog
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Daily notes about coding, AI, open source, networking, and self
            development.
          </p>
        </div>

        <BlogGrid posts={posts} defaultImage={defaultImage} />
      </main>
    </div>
  )
}
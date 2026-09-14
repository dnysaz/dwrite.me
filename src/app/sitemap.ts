import type { MetadataRoute } from 'next'
import { getPublishedPosts } from '@/lib/blog'
import { siteUrl } from '@/lib/seo'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl('/'), changeFrequency: 'monthly', priority: 1 },
    { url: siteUrl('/blog'), changeFrequency: 'weekly', priority: 0.8 },
    { url: siteUrl('/about'), changeFrequency: 'monthly', priority: 0.7 },
    { url: siteUrl('/contact'), changeFrequency: 'yearly', priority: 0.6 },
    { url: siteUrl('/help'), changeFrequency: 'yearly', priority: 0.4 },
  ]

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: siteUrl(`/blog/${post.slug}`),
    lastModified: post.published_at
      ? new Date(post.published_at).toISOString()
      : undefined,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...postRoutes]
}
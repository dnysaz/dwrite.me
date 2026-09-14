import { createAnonClient } from '@/lib/supabase/server'

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_url: string | null
  read_time_minutes: number
  published_at: string | null
  tags: string[] | null
  category_name: string | null
  author_name: string | null
  author_avatar_url: string | null
  author_bio: string | null
}

type AuthorRow = {
  display_name: string | null
  avatar_url: string | null
  bio_en: string | null
}

type RawRow = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_url: string | null
  read_time_minutes: number
  published_at: string | null
  tags: string[] | null
  categories: { name: string } | { name: string }[] | null
  profiles?: AuthorRow | AuthorRow[] | null
}

function normalize(row: RawRow): BlogPost {
  const cat = row.categories
  const category_name = Array.isArray(cat) ? (cat[0]?.name ?? null) : (cat?.name ?? null)
  const author = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    cover_image_url: row.cover_image_url,
    read_time_minutes: row.read_time_minutes,
    published_at: row.published_at,
    tags: row.tags,
    category_name,
    author_name: author?.display_name ?? null,
    author_avatar_url: author?.avatar_url ?? null,
    author_bio: author?.bio_en ?? null,
  }
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const supabase = createAnonClient()
  const { data } = await supabase
    .from('blog_posts')
    .select(
      'id, title, slug, excerpt, content, cover_image_url, read_time_minutes, published_at, tags, categories:blog_categories(name)',
    )
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false })

  return (data as RawRow[] | null)?.map(normalize) ?? []
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createAnonClient()
  const { data } = await supabase
    .from('blog_posts')
    .select(
      'id, title, slug, excerpt, content, cover_image_url, read_time_minutes, published_at, tags, profiles(display_name, avatar_url, bio_en), categories:blog_categories(name)',
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  const post = data ? normalize(data as RawRow) : null
  if (!post) return null

  if (!post.author_name && !post.author_avatar_url) {
    const { data: fallback } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, bio_en')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (fallback) {
      post.author_name = fallback.display_name
      post.author_avatar_url = fallback.avatar_url
      post.author_bio = fallback.bio_en
    }
  }

  return post
}

export async function getPostsByCategory(
  categoryName: string,
): Promise<BlogPost[]> {
  const posts = await getPublishedPosts()
  const target = categoryName.toLowerCase()
  return posts.filter((post) => post.category_name?.toLowerCase() === target)
}

export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  const posts = await getPublishedPosts()
  const target = tag.toLowerCase()
  return posts.filter(
    (post) =>
      post.tags?.some(
        (postTag) => postTag.trim().toLowerCase() === target,
      ) ?? false,
  )
}

export function collectTags(posts: BlogPost[]): string[] {
  const tags = new Set<string>()
  for (const post of posts) {
    for (const tag of post.tags ?? []) {
      const trimmed = tag.trim()
      if (trimmed) tags.add(trimmed)
    }
  }
  return [...tags].sort((a, b) => a.localeCompare(b))
}

export async function getRelatedPosts(
  currentSlug: string,
  categoryName: string | null,
  count = 3,
): Promise<BlogPost[]> {
  const supabase = createAnonClient()
  const { data } = await supabase
    .from('blog_posts')
    .select(
      'id, title, slug, excerpt, content, cover_image_url, read_time_minutes, published_at, tags, categories:blog_categories(name)',
    )
    .eq('status', 'published')
    .not('slug', 'eq', currentSlug)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(50)

  const posts = (data as RawRow[] | null)?.map(normalize) ?? []

  if (categoryName) {
    posts.sort((a, b) => {
      const aMatch = a.category_name === categoryName ? 0 : 1
      const bMatch = b.category_name === categoryName ? 0 : 1
      return aMatch - bMatch
    })
  }

  return posts.slice(0, count)
}

export function publicImage(url: string | null, fallback: string | null) {
  if (url && /^https?:\/\//i.test(url)) return url
  return fallback
}
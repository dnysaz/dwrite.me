import { Navbar } from '@/components/navbar'
import { createClient } from '@/lib/supabase/server'
import { sanitizePostContent } from '@/lib/sanitize'
import { CATEGORY_OPTIONS } from '@/lib/categories'
import {
  CreatePostForm,
  type EditablePost,
} from '@/components/dashboard/create-post-form'

export const metadata = {
  title: 'Create Post',
}

function categoryNameFrom(
  categories: unknown,
): string | null {
  const cat = categories as
    | { name?: string | null }
    | Array<{ name?: string | null }>
    | null
  if (Array.isArray(cat)) return cat[0]?.name ?? null
  return cat?.name ?? null
}

export default async function CreatePostPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams

  // Tidak ada cek auth di sini: middleware sudah memproteksi semua route
  // /dashboard/* (redirect ke /login bila belum auth), dan action simpan
  // post tetap memverifikasi sesi sendiri. Ini menghemat satu network hop
  // auth sebelum halaman bisa dirender.
  let post: EditablePost | null = null
  if (id) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('blog_posts')
      .select(
        'id, title, slug, content, category_id, cover_image_url, tags, status, categories:blog_categories(name)',
      )
      .eq('id', id)
      .maybeSingle()
    if (data?.content) {
      data.content = sanitizePostContent(data.content)
    }
    post = (data as EditablePost | null) ?? null
    if (post) {
      post.category_name = categoryNameFrom(data?.categories)
      post.category_id = null
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {post ? 'Edit Post' : 'Create Post'}
        </h1>
        <CreatePostForm categories={CATEGORY_OPTIONS} post={post} />
      </main>
    </div>
  )
}
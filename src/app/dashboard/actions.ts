'use server'

import { cache } from 'react'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sanitizePostContent } from '@/lib/sanitize'

export type ActionState =
  | { message?: string; error?: string; success?: boolean }
  | undefined

function getPublicAvatarUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`
}

function getPublicStorageUrl(bucket: string, path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

function extractStoragePathFromUrl(
  url: string | null | undefined,
  bucket: string,
) {
  if (!url) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const index = url.indexOf(marker)
  if (index === -1) return null
  const path = url.slice(index + marker.length).split(/[?#]/)[0]
  return path || null
}

const MAX_UPLOAD_BYTES = 512 * 1024

// ---------------------------------------------------------------------------
// Gemini API key: disimpan terenkripsi AES-256-GCM di site_settings.
// Kunci enkripsi = APP_ENCRYPTION_KEY (secret key milik pemilik situs).
// Nilai tidak pernah dikirim kembali ke browser, hanya status + awalan.
// ---------------------------------------------------------------------------
const GEMINI_KEY_SETTING = 'gemini_api_key'
const GEMINI_KEY_COLUMN = 'gemini_api_key_enc'

function getEncryptionKey(providedSecret?: string): Buffer | null {
  const secret = providedSecret ?? process.env.APP_ENCRYPTION_KEY
  if (!secret) return null
  // Terima secret dalam bentuk apa pun; normalisasi jadi 32 byte via SHA-256.
  return crypto.createHash('sha256').update(secret, 'utf8').digest()
}

function encryptSecret(plain: string): string | null {
  const key = getEncryptionKey()
  if (!key) return null
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

function decryptSecret(payload: string): string | null {
  const key = getEncryptionKey()
  if (!key) return null
  const [ivHex, tagHex, dataHex] = payload.split(':')
  if (!ivHex || !tagHex || !dataHex) return null
  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivHex, 'hex'),
    )
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
    return Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    // Secret key salah / data rusak
    return null
  }
}

export type GeminiKeyStatus = {
  configured: boolean
  masked: string | null
  updatedAt: string | null
}

export async function getGeminiKeyStatus(): Promise<GeminiKeyStatus> {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select(`${GEMINI_KEY_COLUMN}, updated_at`)
    .eq('key', GEMINI_KEY_SETTING)
    .maybeSingle()

  const stored = typeof data?.[GEMINI_KEY_COLUMN] === 'string' ? (data![GEMINI_KEY_COLUMN] as string) : null
  const decrypted = stored ? decryptSecret(stored) : null

  return {
    configured: Boolean(decrypted) || Boolean(process.env.GEMINI_API_KEY),
    masked: decrypted
      ? `${decrypted.slice(0, 6)}••••••••••••`
      : process.env.GEMINI_API_KEY
        ? '(from environment)'
        : null,
    updatedAt: data?.updated_at ?? null,
  }
}

export async function saveGeminiApiKey(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const secretKey = String(formData.get('secret_key') ?? '')
  const apiKey = String(formData.get('api_key') ?? '').trim()

  if (!secretKey) {
    return { error: 'Please enter your secret key (APP_ENCRYPTION_KEY).' }
  }
  const encryptionKey = getEncryptionKey(secretKey)
  if (!encryptionKey) {
    return {
      error:
        'APP_ENCRYPTION_KEY is not configured on the server. Add it to your environment first.',
    }
  }

  // Verifikasi secret key dengan mencoba decrypt key yang sudah tersimpan (jika ada)
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('site_settings')
    .select(GEMINI_KEY_COLUMN)
    .eq('key', GEMINI_KEY_SETTING)
    .maybeSingle()
  const existingEnc =
    typeof existing?.[GEMINI_KEY_COLUMN] === 'string'
      ? (existing![GEMINI_KEY_COLUMN] as string)
      : null

  if (existingEnc && !decryptSecret(existingEnc)) {
    return { error: 'Secret key is wrong — could not unlock the stored API key.' }
  }

  if (!apiKey) {
    return { error: 'Please paste your Gemini API key.' }
  }
  // Google memakai dua format key: lama "AIza..." dan baru "AQ...."
  const looksLikeGeminiKey =
    /^AIza[0-9A-Za-z_-]{30,}$/.test(apiKey) ||
    /^AQ\.[0-9A-Za-z_-]{30,}$/.test(apiKey)
  if (!looksLikeGeminiKey) {
    return {
      error:
        'That does not look like a Gemini API key (should start with "AIza" or "AQ.").',
    }
  }

  // Test langsung ke server Gemini — hanya simpan kalau key benar-benar berfungsi.
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: 'Reply with exactly: OK' }] },
          ],
          generationConfig: { maxOutputTokens: 10 },
        }),
        signal: controller.signal,
      },
    )
    clearTimeout(timeout)

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      let message = `Google rejected this key (HTTP ${response.status}).`
      if (response.status === 400) message = 'Google rejected this API key as invalid.'
      if (response.status === 403)
        message =
          'This key is valid but not allowed to use the Gemini API (check key restrictions in AI Studio).'
      if (response.status === 429)
        message = 'Rate limit reached on this key. Wait a moment and try again.'
      try {
        const parsed = JSON.parse(detail)
        if (parsed?.error?.message) message = `Google said: ${parsed.error.message}`
      } catch {
        // pakai pesan default
      }
      return { error: message }
    }
  } catch (error) {
    return {
      error:
        error instanceof Error && error.name === 'AbortError'
          ? 'Test call to Google timed out. Check your connection and try again.'
          : `Could not reach Google to verify the key: ${
              error instanceof Error ? error.message : 'unknown'
            }`,
    }
  }

  const encrypted = encryptSecret(apiKey)
  if (!encrypted) {
    return { error: 'Failed to encrypt the API key.' }
  }

  const { error } = await supabase.from('site_settings').upsert(
    {
      key: GEMINI_KEY_SETTING,
      // Kolom `value` bertipe NOT NULL di skema — isi penanda agar insert pertama tidak gagal.
      value: 'gemini-api-key-encrypted',
      [GEMINI_KEY_COLUMN]: encrypted,
    },
    { onConflict: 'key' },
  )

  if (error) {
    return { error: `Failed to save API key: ${error.message}` }
  }

  revalidatePath('/dashboard')
  return { message: 'API Key Gemini is Configured' }
}

function validateThumbnailFile(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'Image size must be 512 KB or smaller.'
  }
  if (!file.type.startsWith('image/')) {
    return 'File must be an image (WebP/JPG/PNG).'
  }
  return null
}

export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export const getDashboardData = cache(async () => {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return null

  // Semua query dijalankan PARALEL — sebelumnya berurutan sehingga dashboard lama.
  const [
    profileRes,
    postsRes,
    postsCountRes,
    messagesCountRes,
    unreadRes,
    messagesRes,
    ogImageRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('blog_posts')
      .select(
        'id, title, slug, status, published_at, read_time_minutes, categories:blog_categories(name)',
      )
      .order('created_at', { ascending: false }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new'),
    supabase
      .from('messages')
      .select('id, name, email, message, is_read, status, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'site_og_image')
      .maybeSingle(),
  ])

  return {
    user,
    profile: profileRes.data,
    posts: postsRes.data ?? [],
    postsCount: postsCountRes.count ?? 0,
    messagesCount: messagesCountRes.count ?? 0,
    unreadMessagesCount: unreadRes.count ?? 0,
    messages: messagesRes.data ?? [],
    siteOgImage:
      typeof ogImageRes.data?.value === 'string' ? ogImageRes.data.value : null,
  }
})

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const displayName = String(formData.get('display_name') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const avatar = formData.get('avatar')

  if (!displayName) {
    return { error: 'Name is required.' }
  }

  let avatarUrl: string | undefined

  if (avatar instanceof File && avatar.size > 0) {
    if (!avatar.type.startsWith('image/')) {
      return { error: 'File must be an image (PNG/JPG/etc).' }
    }
    if (avatar.size > MAX_UPLOAD_BYTES) {
      return { error: 'Image size must be 512 KB or smaller.' }
    }

    const path = `${user.id}/avatar.webp`

    await supabase.storage
      .from('avatars')
      .remove([
        `${user.id}/avatar.png`,
        `${user.id}/avatar.jpg`,
        `${user.id}/avatar.jpeg`,
      ])

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, avatar, { upsert: true, contentType: avatar.type })

    if (uploadError) {
      return { error: `Failed to upload avatar: ${uploadError.message}` }
    }

    avatarUrl = getPublicAvatarUrl(path)
  }

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        display_name: displayName,
        avatar_url: avatarUrl ?? undefined,
        bio_en: bio || null,
      },
      { onConflict: 'id' },
    )

  if (error) {
    return { error: `Failed to save profile: ${error.message}` }
  }

  revalidatePath('/dashboard')
  return { message: 'Profile updated successfully.' }
}

export async function updateOgImage(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const raw = formData.get('og_image')
  if (!(raw instanceof File) || raw.size === 0) {
    return { error: 'Please choose an image file first.' }
  }

  const ogImageError = validateThumbnailFile(raw)
  if (ogImageError) return { error: ogImageError }

  const supabase = await createClient()

  const path = `${user.id}/og-image.webp`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, raw, { upsert: true, contentType: 'image/webp' })

  if (uploadError) {
    return { error: `Failed to upload OG image: ${uploadError.message}` }
  }

  const { error: settingError } = await supabase
    .from('site_settings')
    .upsert(
      { key: 'site_og_image', value: getPublicAvatarUrl(path) },
      { onConflict: 'key' },
    )

  if (settingError) {
    return { error: `Failed to save setting: ${settingError.message}` }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  return { message: 'OG image updated successfully.' }
}

export async function updatePassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const newPassword = String(formData.get('new_password') ?? '')
  const confirmPassword = String(formData.get('confirm_password') ?? '')

  if (newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (newPassword !== confirmPassword) {
    return { error: 'Password confirmation does not match.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { error: `Failed to change password: ${error.message}` }
  }

  return { message: 'Password changed successfully.' }
}

export async function setMessageStatus(formData: FormData) {
  const user = await getUser()
  if (!user) redirect('/login')

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '')
  if (!id || !['new', 'read', 'deleted'].includes(status)) return

  const supabase = await createClient()
  await supabase
    .from('messages')
    .update({ status, is_read: status === 'new' ? false : true })
    .eq('id', id)
  revalidatePath('/dashboard')
}

export async function permanentlyDeleteMessage(formData: FormData) {
  const user = await getUser()
  if (!user) redirect('/login')

  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()
  await supabase.from('messages').delete().eq('id', id)
  revalidatePath('/dashboard')
}

export async function deletePost(formData: FormData) {
  const user = await getUser()
  if (!user) redirect('/login')

  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('cover_image_url')
    .eq('id', id)
    .maybeSingle()

  await supabase.from('blog_posts').delete().eq('id', id)

  if (post?.cover_image_url) {
    const path = extractStoragePathFromUrl(post.cover_image_url, 'post-images')
    if (path) {
      await supabase.storage.from('post-images').remove([path])
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/blog', 'layout')
}

export type GeminiArticleResult = {
  title: string
  content: string
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  seoNotes: string[]
  tags: string[]
  wordCount: number
  embedded: { title: string; url: string } | null
}

const GEMINI_STYLES = ['santai', 'fokus', 'komedi', 'korporat'] as const
const GEMINI_LENGTHS = ['medium', 'max'] as const
const GEMINI_LANGUAGES = ['indonesia', 'english'] as const

export async function generateArticleWithGemini(
  formData: FormData,
): Promise<{ data?: GeminiArticleResult; error?: string }> {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Rate limit biaya API: maks 15 generate per user per jam.
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count: recentGenerations } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', user.id)
    .gte('created_at', windowStart)
  if ((recentGenerations ?? 0) >= 15) {
    return {
      error:
        'Generation limit reached (15/hour). Please wait before generating more articles.',
    }
  }

  // Ambil API key dari database (terenkripsi) dulu; fallback ke environment.
  let apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
  const { data: keySetting } = await supabase
    .from('site_settings')
    .select(GEMINI_KEY_COLUMN)
    .eq('key', GEMINI_KEY_SETTING)
    .maybeSingle()
  const storedEnc =
    typeof keySetting?.[GEMINI_KEY_COLUMN] === 'string'
      ? (keySetting![GEMINI_KEY_COLUMN] as string)
      : null
  const storedKey = storedEnc ? decryptSecret(storedEnc) : null
  if (storedKey) apiKey = storedKey
  if (!apiKey) {
    return {
      error:
        'Gemini API key is not configured. Set it in Dashboard → Settings → Gemini API Key.',
    }
  }

  const topic = String(formData.get('topic') ?? '').trim()
  const details = String(formData.get('details') ?? '').trim()
  const keywords = String(formData.get('keywords') ?? '')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 15)
  const style = String(formData.get('style') ?? 'santai')
  const length = String(formData.get('length') ?? 'medium')
  const language = String(formData.get('language') ?? 'indonesia')
  const runSeo = formData.get('seo') === 'on'
  const categoryName = String(formData.get('category_id') ?? '').trim()
  const currentPostId = String(formData.get('current_post_id') ?? '').trim()

  if (!topic) return { error: 'Article topic or title is required.' }
  if (topic.length > 300) return { error: 'Topic is too long (max 300 characters).' }
  if (details.length > 4000) return { error: 'Post details are too long (max 4000 characters).' }
  if (keywords.some((keyword) => keyword.length > 60)) {
    return { error: 'Each keyword must be 60 characters or fewer.' }
  }
  if (categoryName.length > 100) {
    return { error: 'Category name is too long.' }
  }
  if (!GEMINI_STYLES.includes(style as never)) {
    return { error: 'Unknown writing style.' }
  }
  if (!GEMINI_LENGTHS.includes(length as never)) {
    return { error: 'Unknown article length option.' }
  }
  if (!GEMINI_LANGUAGES.includes(language as never)) {
    return { error: 'Unknown article language.' }
  }

  let relatedQuery = supabase
    .from('blog_posts')
    .select('title, slug, categories:blog_categories(name)')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3)
  if (categoryName) relatedQuery = relatedQuery.eq('categories.name', categoryName)
  if (currentPostId) relatedQuery = relatedQuery.neq('id', currentPostId)

  const { data: relatedPosts } = await relatedQuery

  const siteBase =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://dwrite.me'
  const relatedList = (relatedPosts ?? [])
    .filter((post) => post.slug && post.title)
    .map((post) => ({ title: post.title, url: `${siteBase}/blog/${post.slug}` }))
  const related = relatedList[0] ?? null

  const styleGuide: Record<string, string> = {
    santai:
      'santai dan ringan seperti ngobrol dengan teman; kalimat singkat, hangat, hindari istilah berat',
    fokus:
      'padat dan sistematis, straight to the point; tiap paragraf membahas satu ide inti',
    komedi:
      'ringan dengan sedikit humor yang tetap relevan, tidak memaksakan lelucon, tetap informatif',
    korporat:
      'formal, profesional, sopan, struktur rapi dan terorganisir',
  }

  const lengthGuide: Record<string, string> = {
    medium: 'singkat: 350–480 kata (harus di bawah 500 kata)',
    max: 'maksimal: panjang, antara 900–1.500 kata',
  }

  const languageGuide: Record<string, string> = {
  indonesia: 'Bahasa Indonesia yang natural',
  english: 'English, natural and fluent',
}

const embedInstruction = related
    ? `Ada artikel lain di kategori yang sama:
- Judul: ${related.title}
- URL: ${related.url}

Sisipkan SEKALI tautan ke artikel itu di TENGAH artikel (kira-kira pada 40–60% isi), secara natural lewat kalimat penghubung di dalam satu <p>. Tautan dan teks di sekitarnya harus ditulis sesuai bahasa artikel (${languageGuide[language]}). Jangan memaksakan; pastikan mengalir dengan konteks kalimat. Jangan pernah menyebut bahwa ini rekomendasi AI.`
    : `Tidak ada artikel lain yang cocok untuk di-embed. Jangan buat tautan apa pun selain yang disebutkan instruksi lain.`

  const relatedBlockInstruction = relatedList.length
    ? `Sisipkan SATU blok daftar artikel terkait di antara dua paragraf (kira-kira pada 55–75% isi, TIDAK di awal dan TIDAK di akhir artikel). Aturan blok:\n- HANYA satu <div> dengan atribut class persis "related-inline".\n- Di dalamnya: satu <p> berisi judul blok: "Related Articles You Might Need" (terjemahkan sesuai bahasa artikel: ${languageGuide[language]}), lalu satu <ul> dengan SATU <li> untuk SETIAP artikel di bawah ini, maksimal ${relatedList.length}.\n- Setiap <li> berisi tepat satu <a> dengan href URL di bawah, dan teks tautan adalah judul artikel (jangan diubah).\n- Jangan menambahkan teks lain, penjelasan, atau tanggal di dalam blok.\n- Artikel terkait:\n${relatedList.map((item) => `- ${item.title} | ${item.url}`).join('\n')}`
    : `Tidak ada artikel terkait yang tersedia. JANGAN buat <div class="related-inline"> atau blok daftar artikel apa pun.`

  const detailsInstruction = details
    ? `\n\nDetail post dari penulis (WAJIB diikuti):\n"""${details}"""\nGunakan detail di atas untuk memperkaya isi artikel: masukkan semua poin penting yang disebutkan, kembangkan dengan contoh konkret, dan jaga agar sudut pandang serta target pembaca sesuai arahan penulis. Detail ini adalah sumber utama setelah topik; jangan mengabaikannya.`
    : ''

  const keywordsInstruction = keywords.length
    ? `\n\nKata kunci wajib (WAJIB masuk ke artikel):\n${keywords.map((keyword) => `- ${keyword}`).join('\n')}\nAturan kata kunci:\n- Setiap kata kunci di atas harus muncul secara natural di dalam artikel (minimal 1–3 kali untuk kata kunci utama, sesuai kepadatan yang sehat untuk SEO).\n- Selipkan di posisi yang mengalir: dalam kalimat, sub-judul, atau list — JANGAN menyisipkan kata kunci secara paksa atau berulang-ulang yang terasa spam.\n- Kata kunci boleh disesuaikan bentuknya (huruf besar/kecil atau bentuk kata) agar natural sesuai bahasa artikel (${languageGuide[language]}).`
    : ''

  const prompt = `Kamu adalah penulis senior blog pribadi dwrite.me. Tulis artikel blog baru berdasarkan topik berikut.

Topik / Tema: ${topic}
${categoryName ? `Kategori: ${categoryName}` : 'Kategori: (tidak dipilih)'}
Bahasa artikel: ${languageGuide[language]}
Gaya bahasa: ${styleGuide[style]}
Panjang: ${lengthGuide[length]}${detailsInstruction}${keywordsInstruction}

Aturan konten:
1. Tulis SELURUH artikel (judul, isi, SEO, hashtag) hanya dalam bahasa: ${languageGuide[language]}. Jangan mencampur bahasa lain kecuali istilah teknis yang memang umum.
2. Bahasa natural, segar, dan tidak generik. Jangan gunakan emoji.
3. Judul (title) menarik, maksimal 60 karakter.
4. Struktur artikel hanya pakai tag HTML yang diizinkan: <p>, <h2>, <h3>, <ul>, <li>, <strong>, <em>, <blockquote>, <a>. Setiap paragraf (termasuk list item) sudah terbungkus tag. Jangan pakai <br> beruntun, tag lain, atau HTML di luar fragment. Pengecualian: <div class="related-inline"> dari instruksi blok artikel terkait di bawah.
5. Pakai setidaknya satu <h2> sebagai sub-judul untuk artikel berukuran panjang.
6. Pastikan jumlah kata sesuai target di atas.

Instruksi embedding:
${embedInstruction}

Instruksi blok artikel terkait:
${relatedBlockInstruction}
${runSeo ? '' : 'SEO check tidak diminta sesi ini: tetap isi field SEO dengan nilai singkat yang masuk akal, tapi tidak perlu riset optimal.\n'}

Instruksi hashtag:
- Buat PERSIS 5 hashtag yang relevan dengan artikel. Tanpa tanda #, huruf kecil, satu kata atau frase singkat.

Output: berikan SATU objek JSON valid, tanpa markdown fence, dengan skema persis:
{
  "title": string,
  "content": string, // fragment HTML sesuai aturan
  "metaTitle": string, // tajuk SEO maksimal 60 karakter
  "metaDescription": string, // ringkasan 120–160 karakter untuk hasil pencarian
  "focusKeyword": string, // kata kunci utama artikel
  "seoNotes": [string, string, string], // 3 catatan SEO ringkas untuk artikel ini
  "tags": [string, string, string, string, string] // 5 hashtag
}`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90_000)

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.9,
            maxOutputTokens: 8192,
            responseSchema: {
              type: 'OBJECT',
              properties: {
                title: { type: 'STRING' },
                content: { type: 'STRING' },
                metaTitle: { type: 'STRING' },
                metaDescription: { type: 'STRING' },
                focusKeyword: { type: 'STRING' },
                seoNotes: { type: 'ARRAY', items: { type: 'STRING' } },
                tags: { type: 'ARRAY', items: { type: 'STRING' } },
              },
              required: [
                'title',
                'content',
                'metaTitle',
                'metaDescription',
                'focusKeyword',
                'seoNotes',
                'tags',
              ],
            },
          },
        }),
        signal: controller.signal,
      },
    )

    clearTimeout(timeout)

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      let message = `Gemini API error (${response.status}).`
      if (response.status === 429) message = 'Gemini rate limit reached. Please wait a moment and try again.'
      if (response.status >= 500) message = 'Gemini service is temporarily unavailable. Please try again later.'
      if (detail) {
        try {
          const parsed = JSON.parse(detail)
          if (parsed?.error?.message) message = parsed.error.message
        } catch {
          // biarkan pesan default
        }
      }
      return { error: message }
    }

    const json = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> }
      }>
    }
    const text = (json.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? '')
      .join('')

    if (!text) return { error: 'Gemini returned no result. Please try again.' }

    const parsed = JSON.parse(text) as {
      title?: string
      content?: string
      metaTitle?: string
      metaDescription?: string
      focusKeyword?: string
      seoNotes?: string[]
      tags?: string[]
    }

    if (!parsed.title || !parsed.content) {
      return { error: 'Gemini returned an invalid result. Please try again.' }
    }

    const wordCount = stripHtml(parsed.content)
      .split(' ')
      .filter(Boolean).length

    return {
      data: {
        title: parsed.title.slice(0, 120),
        content: parsed.content,
        metaTitle: parsed.metaTitle?.slice(0, 70) ?? '',
        metaDescription: parsed.metaDescription?.slice(0, 200) ?? '',
        focusKeyword: parsed.focusKeyword ?? '',
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean).slice(0, 5)
          : [],
        seoNotes: Array.isArray(parsed.seoNotes)
          ? parsed.seoNotes.filter(Boolean).slice(0, 6)
          : [],
        wordCount,
        embedded: related,
      },
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { error: 'Gemini timed out. Try a shorter topic.' }
    }
    return { error: `Failed to reach Gemini: ${error instanceof Error ? error.message : 'unknown'}` }
  }
}

type UpdatePostExtra = { content: string; tags: string[] }

export async function updatePost(
  extra: UpdatePostExtra,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const id = String(formData.get('id') ?? '').trim()
  if (!id) return { error: 'Post ID not found.' }

  const title = String(formData.get('title') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim() || slugify(title)
  const categoryName = String(formData.get('category_id') ?? '').trim() || null
  const content = sanitizePostContent(extra.content)
  const tags = normalizeTags(extra.tags)
  const action = String(formData.get('action') ?? 'draft')

  if (!title) return { error: 'Title is required.' }
  if (!content || !content.trim()) return { error: 'Content is required.' }
  if (!slug) return { error: 'Title cannot be converted to a slug.' }

  const supabase = await createClient()

  const categoryId = await resolveCategoryId(supabase, categoryName)

  const { data: existing } = await supabase
    .from('blog_posts')
    .select('cover_image_url, published_at')
    .eq('id', id)
    .maybeSingle()

  if (!existing) return { error: 'Post not found.' }

  let coverImageUrl: string | null = existing.cover_image_url
  const rawThumbnail = formData.get('thumbnail')
  if (rawThumbnail instanceof File && rawThumbnail.size > 0) {
    const thumbnailError = validateThumbnailFile(rawThumbnail)
    if (thumbnailError) return { error: thumbnailError }

    const path = `posts/${crypto.randomUUID()}.webp`
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(path, rawThumbnail, {
        contentType: 'image/webp',
        upsert: false,
      })

    if (uploadError) {
      return { error: `Failed to upload image: ${uploadError.message}` }
    }
    coverImageUrl = getPublicStorageUrl('post-images', path)
  }

  const status = action === 'publish' ? 'published' : 'draft'
  const publishedAt =
    status === 'published' ? (existing.published_at ?? new Date().toISOString()) : null

  const { error } = await supabase
    .from('blog_posts')
    .update({
      title,
      slug,
      excerpt: stripHtml(content).slice(0, 160),
      content,
      category_id: categoryId,
      cover_image_url: coverImageUrl,
      tags,
      read_time_minutes: estimateReadTime(content),
      status,
      published_at: publishedAt,
    })
    .eq('id', id)

  if (error) {
    if (coverImageUrl !== existing.cover_image_url && coverImageUrl) {
      const newPath = extractStoragePathFromUrl(coverImageUrl, 'post-images')
      if (newPath) await supabase.storage.from('post-images').remove([newPath])
    }
    if (error.code === '23505') return { error: 'Slug is already taken. Change the title.' }
    return { error: `Failed to save post: ${error.message}` }
  }

  if (coverImageUrl !== existing.cover_image_url && existing.cover_image_url) {
    const oldPath = extractStoragePathFromUrl(existing.cover_image_url, 'post-images')
    if (oldPath) await supabase.storage.from('post-images').remove([oldPath])
  }

  revalidatePath('/dashboard')
  revalidatePath('/blog', 'layout')
  return { success: true }
}

/* helpers */

function normalizeTags(tags: string[]): string[] {
  return Array.isArray(tags)
    ? tags
        .map((tag) => String(tag).replace(/^#/, '').trim())
        .filter((tag) => tag.length > 0 && tag.length <= 40)
        .slice(0, 15)
    : []
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function estimateReadTime(html: string) {
  const words = stripHtml(html).split(' ').filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

async function resolveCategoryId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryRef: string | null,
) {
  if (!categoryRef) return null

  // The form's <option value={c.id}> submits a category ID, not a name.
  // Accept both so the action keeps working for other callers.
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (isUuid.test(categoryRef)) {
    const { data: byId } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('id', categoryRef)
    if (byId && byId.length > 0) return byId[0].id
  }

  const { data: existing } = await supabase
    .from('blog_categories')
    .select('id')
    .eq('name', categoryRef)
    .maybeSingle()
  if (existing?.id) return existing.id

  // blog_categories.id has no default and slug is NOT NULL UNIQUE,
  // so both must be provided — otherwise the insert fails and the
  // post silently ends up with category_id = null.
  const slug =
    categoryRef
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || `kategori-${Date.now()}`

  const { data: created } = await supabase
    .from('blog_categories')
    .insert({ id: crypto.randomUUID(), name: categoryRef, slug })
    .select('id')
    .single()

  if (created?.id) return created.id

  // Slug conflict (or another insert race): retry lookup in case the
  // category was created by a concurrent request, then give up cleanly.
  const { data: retry } = await supabase
    .from('blog_categories')
    .select('id')
    .eq('name', categoryRef)
    .maybeSingle()
  return retry?.id ?? null
}

type CreatePostExtra = { content: string; tags: string[] }

export async function createPost(
  extra: CreatePostExtra,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getUser()
  if (!user) redirect('/login')

  const title = String(formData.get('title') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim() || slugify(title)
  const categoryName = String(formData.get('category_id') ?? '').trim() || null
  const content = sanitizePostContent(extra.content)
  const tags = normalizeTags(extra.tags)

  if (!title) return { error: 'Title is required.' }
  if (!content || !content.trim()) return { error: 'Content is required.' }
  if (!slug) return { error: 'Title cannot be converted to a slug.' }

  const excerpt = stripHtml(content).slice(0, 160)
  const action = String(formData.get('action') ?? 'draft')
  const status = action === 'publish' ? 'published' : 'draft'
  const publishedAt = status === 'published' ? new Date().toISOString() : null

  const supabase = await createClient()

  const categoryId = await resolveCategoryId(supabase, categoryName)

  let coverImageUrl: string | null = null
  const rawThumbnail = formData.get('thumbnail')
  if (rawThumbnail instanceof File && rawThumbnail.size > 0) {
    const thumbnailError = validateThumbnailFile(rawThumbnail)
    if (thumbnailError) return { error: thumbnailError }

    const path = `posts/${crypto.randomUUID()}.webp`
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(path, rawThumbnail, {
        contentType: 'image/webp',
        upsert: false,
      })

    if (uploadError) {
      return { error: `Failed to upload image: ${uploadError.message}` }
    }
    coverImageUrl = getPublicStorageUrl('post-images', path)
  }

  // Pastikan baris profil user ada (hilang jika tabel profiles ter-truncate saat
  // supabase-schema.sql dijalankan). Tanpa ini insert di bawah gagal karena FK author_id.
  await supabase.from('profiles').upsert(
    {
      id: user.id,
      display_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  )

  const { error } = await supabase.from('blog_posts').insert({
    title,
    slug,
    excerpt,
    content,
    category_id: categoryId,
    author_id: user.id,
    cover_image_url: coverImageUrl,
    tags,
    read_time_minutes: estimateReadTime(content),
    status,
    published_at: publishedAt,
  })

  if (error) {
    if (coverImageUrl) {
      const path = extractStoragePathFromUrl(coverImageUrl, 'post-images')
      if (path) await supabase.storage.from('post-images').remove([path])
    }
    if (error.code === '23505') return { error: 'Slug is already taken. Change the title.' }
    return { error: `Failed to save post: ${error.message}` }
  }

  revalidatePath('/dashboard')
  revalidatePath('/blog', 'layout')
  return { success: true }
}
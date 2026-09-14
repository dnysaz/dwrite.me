'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type LoginState = { error?: string } | undefined

function safeNextPath(value: FormDataEntryValue | null): string {
  const next = typeof value === 'string' ? value : ''
  if (!next.startsWith('/') || next.startsWith('//')) return '/dashboard'
  return next
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = safeNextPath(formData.get('next'))

  if (!email || !password) {
    return { error: 'Please fill in both email and password.' }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      error:
        error.message === 'Invalid login credentials'
          ? 'Invalid email or password.'
          : error.message,
    }
  }

  // Self-heal: pastikan baris profil ada (hilang jika tabel di-truncate).
  // Tanpa ini, jika akun sudah ada sebelum trigger on_auth_user_created dipasang,
  // profil tidak akan dibuat otomatis saat login.
  if (data.user) {
    await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        display_name:
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email,
      },
      { onConflict: 'id', ignoreDuplicates: true },
    )
  }

  revalidatePath('/', 'layout')
  redirect(next)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
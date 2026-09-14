'use server'

import { createClient } from '@/lib/supabase/server'

export type ContactActionState = {
  error?: string
  success?: boolean
} | null

const MAX_PER_HOUR = 5

export async function sendMessage(
  _prevState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  // Honeypot: kolom tersembunyi yang hanya diisi bot. Dibuang diam-diam
  // (sukses palsu) supaya bot tidak belajar dari pesan error.
  const honeypot = String(formData.get('website') ?? '').trim()
  if (honeypot) return { success: true }

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()

  if (!name || !email || !message) {
    return { error: 'All fields are required.' }
  }
  if (name.length > 100) {
    return { error: 'Name is too long (max 100 characters).' }
  }
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Invalid email address.' }
  }
  if (message.length > 5000) {
    return { error: 'Message is too long (max 5000 characters).' }
  }

  const supabase = await createClient()

  // Rate limit: maks MAX_PER_HOUR pesan per email per jam (fail-open bila RPC error).
  const { data: recentCount } = await supabase.rpc('count_recent_messages', {
    p_email: email,
    p_minutes: 60,
  })
  if (typeof recentCount === 'number' && recentCount >= MAX_PER_HOUR) {
    return {
      error: `Too many messages sent recently. Please try again in a few minutes.`,
    }
  }

  const { error } = await supabase
    .from('messages')
    .insert({ name, email, message })

  if (error) {
    return { error: `Failed to send message: ${error.message}` }
  }

  return { success: true }
}
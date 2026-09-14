import { createClient } from '@/lib/supabase/server'
import { httpsUrl } from '@/lib/seo'

export async function getSiteOgImage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'site_og_image')
    .maybeSingle()
  return httpsUrl(data?.value ?? null) ?? null
}
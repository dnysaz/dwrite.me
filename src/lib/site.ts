import { createAnonClient } from '@/lib/supabase/server'
import { httpsUrl } from '@/lib/seo'

export async function getSiteOgImage() {
  const supabase = createAnonClient()
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'site_og_image')
    .maybeSingle()
  return httpsUrl(data?.value ?? null) ?? null
}

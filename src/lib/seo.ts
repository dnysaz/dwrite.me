export const SITE_NAME = 'dwrite.me'
export const SITE_TITLE = 'Ketut Dana — Web Developer & AI Enthusiast'
export const SITE_DESCRIPTION =
  'Personal portfolio of Ketut Dana, Web Developer & AI Enthusiast from Bali. Blog about coding, AI, open source, networking, and self development.'

export function siteUrl(path = '') {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://dwrite.me'
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

export function stripHtmlToText(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function firstWords(text: string, count = 100) {
  return text.split(/\s+/).filter(Boolean).slice(0, count).join(' ')
}

export function httpsUrl(url: string | null | undefined) {
  return url && /^https?:\/\//i.test(url) ? url : undefined
}
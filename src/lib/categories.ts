export const SITE_CATEGORIES = [
  'Tutorial',
  'Life',
  'Artificial Intelligence',
  'General Information',
  'Casual',
  'Programming',
] as const

export type SiteCategory = (typeof SITE_CATEGORIES)[number]

export const CATEGORY_OPTIONS = SITE_CATEGORIES.map((name) => ({
  id: name,
  name,
}))
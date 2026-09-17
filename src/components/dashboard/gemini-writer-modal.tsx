'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  Check,
  CheckCircle2,
  Copy,
  Hash,
  Link2,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react'
import {
  generateArticleWithGemini,
  type GeminiArticleResult,
} from '@/app/dashboard/actions'

const STYLES = [
  { value: 'santai', label: 'Casual' },
  { value: 'fokus', label: 'Focused' },
  { value: 'komedi', label: 'Comedy' },
  { value: 'korporat', label: 'Corporate' },
] as const

const LENGTHS = [
  { value: 'medium', label: 'Short · <500 words' },
  { value: 'max', label: 'Max · 1,500 words' },
] as const

const LANGUAGES = [
  { value: 'indonesia', label: 'Indonesia' },
  { value: 'english', label: 'English' },
] as const

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard blocked — ignore
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-primary" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? 'Copied' : label}
    </button>
  )
}

function SeoRow({
  title,
  text,
  target,
}: {
  title: string
  text: string
  target: { min?: number; max: number }
}) {
  const count = text.length
  const ok =
    count <= target.max && (target.min === undefined || count >= target.min)
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
            ok ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}
        >
          {count} chars
        </span>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{text}</p>
      <CopyButton text={text} label="Copy" />
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  )
}

const inputClass =
  'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring'

export function GeminiWriterModal({
  open,
  onClose,
  categories,
  initialCategory,
  currentPostId,
  onInserted,
}: {
  open: boolean
  onClose: () => void
  categories: string[]
  initialCategory: string
  currentPostId?: string | null
  onInserted: (data: GeminiArticleResult, category: string) => void
}) {
  const [topic, setTopic] = useState('')
  const [details, setDetails] = useState('')
  const [keywords, setKeywords] = useState('')
  const [style, setStyle] = useState('santai')
  const [length, setLength] = useState('medium')
  const [language, setLanguage] = useState<'indonesia' | 'english'>('indonesia')
  const [category, setCategory] = useState(initialCategory)
  const [seo, setSeo] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeminiArticleResult | null>(null)

  if (!open || typeof document === 'undefined') return null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const trimmed = topic.trim()
    if (!trimmed) {
      setError('Please fill in the article topic or title first.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.set('topic', trimmed)
    const detailsValue = details.trim()
    const keywordsValue = keywords.trim()
    if (detailsValue) formData.set('details', detailsValue)
    if (keywordsValue) formData.set('keywords', keywordsValue)
    formData.set('style', style)
    formData.set('length', length)
    formData.set('language', language)
    if (seo) formData.set('seo', 'on')
    if (category) formData.set('category_id', category)
    if (currentPostId) formData.set('current_post_id', currentPostId)

    const response = await generateArticleWithGemini(formData)
    setLoading(false)

    if (response.error) {
      setError(response.error)
      return
    }
    setResult(response.data ?? null)
  }

  const insert = () => {
    if (!result) return
    onInserted(result, category)
    onClose()
    setResult(null)
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create Article with Gemini"
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
      <header className="flex items-center gap-3 border-b border-border px-6 py-3 sm:px-8">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white">
          <Sparkles className="h-4.5 w-4.5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="text-base font-bold tracking-tight">
            Create Article with Gemini
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            Topic, details & keywords — AI writes a full draft with SEO and 5
            hashtags.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 sm:px-8">
        {!result ? (
          <form
            id="gemini-form"
            onSubmit={submit}
            className="grid gap-4 md:grid-cols-2"
          >
            {/* Topic — full width */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <FieldLabel>Topic / Title</FieldLabel>
              <input
                id="gemini-topic"
                autoFocus
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Example: How prompt engineering works for beginners"
                className={inputClass}
              />
            </div>

            {/* Details — left column */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Post Details (optional)</FieldLabel>
              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={4}
                placeholder="What must the article cover? Key points, angle, audience, examples."
                className={`${inputClass} resize-y leading-relaxed`}
              />
            </div>

            {/* Keywords + Language — right column */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Keywords (optional)</FieldLabel>
                <input
                  value={keywords}
                  onChange={(event) => setKeywords(event.target.value)}
                  placeholder="SEO, SEM, AI, how to"
                  className={inputClass}
                />
                <span className="text-xs text-muted-foreground">
                  Separate with commas — woven into the article for SEO.
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Language</FieldLabel>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((option) => (
                    <Chip
                      key={option.value}
                      active={language === option.value}
                      onClick={() => setLanguage(option.value)}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            {/* Style — left column */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Writing style</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {STYLES.map((option) => (
                  <Chip
                    key={option.value}
                    active={style === option.value}
                    onClick={() => setStyle(option.value)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Length — right column */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Article length</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {LENGTHS.map((option) => (
                  <Chip
                    key={option.value}
                    active={length === option.value}
                    onClick={() => setLength(option.value)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Category — left column */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Category</FieldLabel>
              <div className="flex flex-wrap gap-2">
                <Chip active={category === ''} onClick={() => setCategory('')}>
                  None
                </Chip>
                {categories.map((name) => (
                  <Chip
                    key={name}
                    active={category === name}
                    onClick={() => setCategory(name)}
                  >
                    {name}
                  </Chip>
                ))}
              </div>
            </div>

            {/* SEO — right column */}
            <div className="flex flex-col gap-1.5">
              <FieldLabel>SEO Checker</FieldLabel>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5">
                <input
                  type="checkbox"
                  checked={seo}
                  onChange={(event) => setSeo(event.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">
                    Show meta title, description & focus keyword
                  </span>
                </span>
              </label>
            </div>

            {/* Info banner — full width, compact */}
            <div className="flex items-start gap-2 rounded-xl bg-muted px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground md:col-span-2">
              <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {category ? (
                  <>
                    Gemini reviews{' '}
                    <strong className="font-semibold text-foreground">
                      {category}
                    </strong>{' '}
                    and auto-embeds a same-category article link, plus a related
                    articles list and 5 hashtags.
                  </>
                ) : (
                  <>
                    No category selected. Pick one so Gemini can embed a
                    same-category article link and write 5 relevant hashtags.
                  </>
                )}
              </span>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Article ready — {result.wordCount} words ·{' '}
              {language === 'english' ? 'English' : 'Indonesia'} ·{' '}
              {category || 'No category'}
            </div>

            {result.embedded && (
              <div className="flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Same-category article link embedded in the middle:{' '}
                  <strong className="font-semibold text-foreground">
                    {result.embedded.title}
                  </strong>
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Title
              </span>
              <p className="text-2xl font-bold leading-tight">{result.title}</p>
            </div>

            {result.tags.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" /> 5 auto hashtags
                </span>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {seo && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  SEO Checker
                </span>
                {result.metaTitle && (
                  <SeoRow
                    title="Meta Title"
                    text={result.metaTitle}
                    target={{ max: 60 }}
                  />
                )}
                {result.metaDescription && (
                  <SeoRow
                    title="Meta Description"
                    text={result.metaDescription}
                    target={{ min: 120, max: 160 }}
                  />
                )}
                {result.focusKeyword && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Focus keyword
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                        {result.focusKeyword}
                      </span>
                      <CopyButton text={result.focusKeyword} label="Copy" />
                    </div>
                  </div>
                )}
                {result.seoNotes.length > 0 && (
                  <ul className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-4">
                    {result.seoNotes.map((note, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm leading-relaxed text-foreground/80"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {note}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky footer — actions always visible without scrolling */}
      <footer className="border-t border-border bg-background px-6 py-3 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          {!result ? (
            <>
              <p
                className={`min-w-0 flex-1 text-xs leading-snug ${
                  error ? 'font-medium text-destructive' : 'text-muted-foreground'
                }`}
              >
                {error ?? 'All fields except Topic are optional.'}
              </p>
              <button
                type="submit"
                form="gemini-form"
                disabled={loading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Gemini is writing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Article
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                Scroll up to review the draft before inserting.
              </p>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Back to settings
              </button>
              <button
                type="button"
                onClick={insert}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Check className="h-4 w-4" />
                Use this article
              </button>
            </>
          )}
        </div>
      </footer>
      </div>
    </div>,
    document.body,
  )
}

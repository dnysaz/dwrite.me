'use client'

import { startTransition, useEffect, useActionState, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Link2,
  Save,
  Send,
  SeparatorHorizontal,
  Sparkles,
  X,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  createPost,
  updatePost,
  type ActionState,
} from '@/app/dashboard/actions'
import {
  compressImageToWebp,
  formatBytes,
  ImageValidationError,
  validateImageFile,
} from '@/lib/image'
import { GeminiWriterModal } from '@/components/dashboard/gemini-writer-modal'

type Category = { id: string; name: string }

export type EditablePost = {
  id: string
  title: string
  slug: string
  content: string
  category_id: string | null
  category_name: string | null
  cover_image_url: string | null
  tags: string[] | null
  status: string
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

const DRAFT_PREFIX = 'dwrite:post-draft:'

function draftKey(isEdit: boolean, postId: string | null | undefined) {
  return isEdit ? `${DRAFT_PREFIX}${postId ?? 'edit'}` : `${DRAFT_PREFIX}new`
}

function readDraft(key: string) {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as {
      title?: string
      content?: string
      tags?: string[]
      categoryId?: string
    }
  } catch {
    return null
  }
}

function writeDraft(key: string, data: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // storage penuh atau diblokir — abaikan
  }
}

function clearDraft(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // abaikan
  }
}

function FieldMessage({ state }: { state: ActionState }) {
  if (!state) return null
  if (state.error) {
    return (
      <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
        {state.error}
      </p>
    )
  }
  return (
    <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
      {state.message}
    </p>
  )
}

const BLOCK_TAGS = [
  'P',
  'DIV',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'BLOCKQUOTE',
  'PRE',
] as const

function collectBlocks(
  editor: HTMLElement,
  range: Range,
): HTMLElement[] {
  const blocks = new Set<HTMLElement>()
  const collectFrom = (node: Node) => {
    const isEl = node.nodeType === Node.ELEMENT_NODE
    let el: HTMLElement | null = isEl
      ? (node as HTMLElement)
      : (node.parentElement ?? null)
    while (el && el !== editor && !BLOCK_TAGS.includes(el.tagName as never)) {
      el = el.parentElement
    }
    if (el && el !== editor && !['UL', 'OL', 'LI'].includes(el.tagName)) {
      blocks.add(el)
    }
  }
  collectFrom(range.startContainer)
  collectFrom(range.endContainer)

  const root = range.commonAncestorContainer
  const rootEl =
    root.nodeType === Node.ELEMENT_NODE
      ? (root as HTMLElement)
      : root.parentElement
  if (rootEl) {
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_ELEMENT)
    let node = walker.nextNode()
    while (node) {
      const el = node as HTMLElement
      if (
        BLOCK_TAGS.includes(el.tagName as never) &&
        !['UL', 'OL', 'LI'].includes(el.tagName)
      ) {
        blocks.add(el)
      }
      node = walker.nextNode()
    }
  }
  return [...blocks]
}

function leafTextPoint(
  range: Range,
): { node: Text; index: number } | null {
  let container = range.startContainer
  let offset = range.startOffset
  let guard = 0
  while (container.nodeType === Node.ELEMENT_NODE && guard++ < 12) {
    const children = container.childNodes
    const child = children[offset]
    if (child) {
      if (child.nodeType === Node.TEXT_NODE) {
        return { node: child as Text, index: 0 }
      }
      container = child
      offset = 0
      continue
    }
    const last = children.length ? children[children.length - 1] : null
    if (last && last.nodeType === Node.TEXT_NODE) {
      return { node: last as Text, index: (last.nodeValue ?? '').length }
    }
    return null
  }
  if (container.nodeType === Node.TEXT_NODE) {
    return { node: container as Text, index: offset }
  }
  return null
}

function placeCaret(sel: Selection, target: Node) {
  const caret = document.createRange()
  if (target.nodeType === Node.ELEMENT_NODE) {
    caret.selectNodeContents(target)
    caret.collapse(false)
  } else {
    caret.setStart(target, 0)
    caret.collapse(false)
  }
  sel.removeAllRanges()
  sel.addRange(caret)
}

let pendingLinkRange: Range | null = null

function MiniEditor({
  defaultHtml,
  onChange,
}: {
  defaultHtml: string
  onChange: (html: string) => void
}) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkTitle, setLinkTitle] = useState('')

  useEffect(() => {
    if (editorRef.current && defaultHtml && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = defaultHtml
    }
  }, [defaultHtml])

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
  }

  const syncContent = (editor: HTMLDivElement | null) => {
    onChange(editor?.innerHTML ?? '')
  }

  const insertLink = (
    editor: HTMLDivElement | null,
    href: string,
    titleText: string,
  ) => {
    if (!editor) return
    editor.focus()
    const sel = window.getSelection()
    if (!sel) return

    let range: Range | null = null
    if (
      pendingLinkRange &&
      editor.contains(pendingLinkRange.startContainer)
    ) {
      range = pendingLinkRange
    } else if (sel.rangeCount > 0) {
      range = sel.getRangeAt(0)
    }
    if (!range) return

    const selectedText = range.toString().trim() || null
    const anchor = document.createElement('a')
    anchor.href = href
    if (titleText) anchor.title = titleText
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.textContent = titleText || selectedText || href

    range.deleteContents()
    range.insertNode(anchor)

    const caret = document.createRange()
    caret.setStartAfter(anchor)
    caret.collapse(true)
    sel.removeAllRanges()
    sel.addRange(caret)
    syncContent(editor)
  }

  const toggleBlockFormat = (
    editor: HTMLDivElement,
    tag: 'h1' | 'h2' | 'h3' | 'blockquote' | 'pre',
  ) => {
    const sel = window.getSelection()
    if (!sel) return
    if (sel.rangeCount === 0) {
      const range = document.createRange()
      range.selectNodeContents(editor)
      range.collapse(false)
      sel.addRange(range)
    }
    const range = sel.getRangeAt(0)

    const blocks = collectBlocks(editor, range)
    if (blocks.length > 0) {
      const allSame = blocks.every((b) => b.tagName.toLowerCase() === tag)
      const target = allSame ? 'p' : tag
      const converted = blocks.map((b) => {
        const el = document.createElement(target)
        el.innerHTML = b.innerHTML
        b.replaceWith(el)
        return el
      })
      placeCaret(sel, converted[converted.length - 1] ?? converted[0])
      syncContent(editor)
      return
    }

    const point = leafTextPoint(range)
    if (!point) return
    const text = point.node.nodeValue ?? ''
    const start = text.lastIndexOf('\n', point.index - 1) + 1
    const rawEnd = text.indexOf('\n', point.index)
    const end = rawEnd === -1 ? text.length : rawEnd

    const wrapRange = document.createRange()
    wrapRange.setStart(point.node, start)
    wrapRange.setEnd(point.node, end)
    const el = document.createElement(tag)
    el.textContent = wrapRange.toString()
    wrapRange.deleteContents()
    wrapRange.insertNode(el)
    placeCaret(sel, el)
    syncContent(editor)
  }

  const insertDivider = (editor: HTMLDivElement) => {
    editor.focus()
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || !sel.anchorNode) return

    let inserted = false
    if (document.queryCommandSupported('insertHorizontalRule')) {
      inserted = document.execCommand('insertHorizontalRule')
    }
    if (!inserted) {
      const range = sel.getRangeAt(0)
      const hr = document.createElement('hr')
      range.deleteContents()
      range.insertNode(hr)
      const p = document.createElement('p')
      p.appendChild(document.createElement('br'))
      if (hr.nextSibling) {
        hr.parentNode?.insertBefore(p, hr.nextSibling)
      } else {
        hr.parentNode?.appendChild(p)
      }
      const caret = document.createRange()
      caret.selectNodeContents(p)
      caret.collapse(true)
      sel.removeAllRanges()
      sel.addRange(caret)
    }
    syncContent(editor)
  }

  const closeLink = () => {
    setLinkOpen(false)
    setLinkUrl('')
    setLinkTitle('')
    pendingLinkRange = null
  }

  const openLinkDialog = () => {
    const sel = window.getSelection()
    pendingLinkRange =
      sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null
    setLinkTitle('')
    setLinkOpen(true)
  }

  const confirmLink = (
    event: FormEvent<HTMLFormElement>,
    editor: HTMLDivElement | null,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    const raw = linkUrl.trim()
    if (!raw) return
    const titleText = linkTitle.trim()

    let href = raw
    if (/^mailto:/i.test(href) || /^tel:/i.test(href)) {
      href = href
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      href = `mailto:${raw}`
    } else if (!/^https?:\/\//i.test(href)) {
      href = `https://${href}`
    }

    insertLink(editor, href, titleText)
    closeLink()
  }

  const buttons = [
    {
      label: 'B',
      title: 'Bold',
      cmd: (editor: HTMLDivElement) => {
        exec('bold')
        syncContent(editor)
      },
    },
    {
      label: 'I',
      title: 'Italic',
      cmd: (editor: HTMLDivElement) => {
        exec('italic')
        syncContent(editor)
      },
    },
    {
      label: 'U',
      title: 'Underline',
      cmd: (editor: HTMLDivElement) => {
        exec('underline')
        syncContent(editor)
      },
    },
    {
      label: 'H1',
      title: 'Heading 1',
      cmd: (editor: HTMLDivElement) => toggleBlockFormat(editor, 'h1'),
    },
    {
      label: 'H2',
      title: 'Heading 2',
      cmd: (editor: HTMLDivElement) => toggleBlockFormat(editor, 'h2'),
    },
    {
      label: 'H3',
      title: 'Heading 3',
      cmd: (editor: HTMLDivElement) => toggleBlockFormat(editor, 'h3'),
    },
    {
      label: '•',
      title: 'Bullet list',
      cmd: (editor: HTMLDivElement) => {
        exec('insertUnorderedList')
        syncContent(editor)
      },
    },
    {
      label: '1.',
      title: 'Numbered list',
      cmd: (editor: HTMLDivElement) => {
        exec('insertOrderedList')
        syncContent(editor)
      },
    },
    {
      label: '❝',
      title: 'Blockquote',
      cmd: (editor: HTMLDivElement) => toggleBlockFormat(editor, 'blockquote'),
    },
    {
      label: '<>',
      title: 'Code block',
      cmd: (editor: HTMLDivElement) => toggleBlockFormat(editor, 'pre'),
    },
    { label: '🔗', title: 'Insert link', cmd: () => openLinkDialog() },
    {
      label: '',
      title: 'Horizontal divider',
      cmd: (editor: HTMLDivElement) => insertDivider(editor),
      icon: <SeparatorHorizontal className="h-4 w-4" />,
    },
    {
      label: '✕',
      title: 'Clear formatting',
      cmd: (editor: HTMLDivElement) => {
        exec('removeFormat')
        syncContent(editor)
      },
    },
  ]

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted px-2 py-1.5">
        {buttons.map((b) => (
          <button
            key={b.label || b.title}
            type="button"
            title={b.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault()
              const editor = editorRef.current
              b.cmd(editor as HTMLDivElement)
              editor?.focus()
            }}
            className="inline-flex items-center justify-center rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            {b.icon ?? b.label}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(editorRef.current?.innerHTML ?? '')}
        className="prose min-h-[32rem] px-4 py-3 text-base leading-relaxed outline-none empty:before:pointer-events-none empty:before:text-muted-foreground/60 empty:before:content-['Write_your_post_content_here...']"
      />

      {linkOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Insert link"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
          <button
            type="button"
            aria-label="Close dialog"
            onClick={closeLink}
            className="absolute inset-0 cursor-default bg-black/50"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              type="button"
              aria-label="Close dialog"
              onClick={closeLink}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Link2 className="h-5 w-5" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold tracking-tight">Insert link</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Enter a URL or email, then the title to display as the link
                  text in the post.
                </p>
              </div>
            </div>

            <form
              onSubmit={(event) => confirmLink(event, editorRef.current)}
              className="mt-6 flex flex-col gap-4"
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="link-url"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  URL or email
                </label>
                <input
                  id="link-url"
                  autoFocus
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  placeholder="https://example.com or email@domain.com"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="link-title"
                  className="text-sm font-semibold text-muted-foreground"
                >
                  Link title
                </label>
                <input
                  id="link-title"
                  value={linkTitle}
                  onChange={(event) => setLinkTitle(event.target.value)}
                  placeholder="Text shown in the post (optional)"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeLink}
                  className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Insert
                </button>
              </div>
            </form>
          </div>
        </div>,
          document.body,
        )}
    </div>
  )
}

function TagInput({
  initialTags,
  onChange,
}: {
  initialTags: string[]
  onChange: (tags: string[]) => void
}) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [input, setInput] = useState('')

  const addTag = (value: string) => {
    const clean = value.replace(/,/g, '').trim()
    if (!clean) return
    if (tags.includes(clean)) return

    const next = [...tags, clean]
    setTags(next)
    onChange(next)
  }

  const removeTag = (tagToRemove: string) => {
    const next = tags.filter((tag) => tag !== tagToRemove)
    setTags(next)
    onChange(next)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(input)
      setInput('')
    } else if (event.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-2.5 pr-1.5 text-sm font-semibold text-primary"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
              className="rounded-full p-0.5 text-primary/60 transition-colors hover:bg-primary/20 hover:text-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) {
              addTag(input)
              setInput('')
            }
          }}
          placeholder={tags.length === 0 ? 'AI, coding, tutorial' : 'Add tag...'}
          className="min-w-[6rem] flex-1 bg-transparent py-1 text-base outline-none placeholder:text-muted-foreground/60"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add a tag. Click x to remove.
      </p>
    </div>
  )
}

export function CreatePostForm({
  categories,
  post = null,
}: {
  categories: Category[]
  post?: EditablePost | null
}) {
  const isEdit = Boolean(post)

  const router = useRouter()
  const key = draftKey(isEdit, post?.id)

  const [title, setTitle] = useState(post?.title ?? '')
  const [content, setContent] = useState(post?.content ?? '')
  const [categoryId, setCategoryId] = useState(post?.category_name ?? '')
  const [tags, setTags] = useState<string[]>(post?.tags ?? [])

  const [hydrated, setHydrated] = useState(false)
  const [restored, setRestored] = useState(false)
  const [restoredDismissed, setRestoredDismissed] = useState(false)
  const [editorKey, setEditorKey] = useState(0)

  const fileRef = useRef<HTMLInputElement>(null)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null)
  const [fileInfo, setFileInfo] = useState<{
    original: string
    result: string
  } | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const slug = slugify(title)

  const [state, formAction, pending] = useActionState(
    isEdit
      ? updatePost.bind(null, { content, tags })
      : createPost.bind(null, { content, tags }),
    undefined,
  )

  const [geminiOpen, setGeminiOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    const id = setTimeout(() => {
      if (cancelled) return
      const draft = readDraft(key)
      if (
        draft &&
        (draft.title || draft.content || draft.tags?.length || draft.categoryId)
      ) {
        const sameAsPost =
          isEdit &&
          post !== null &&
          draft.title === post.title &&
          draft.content === post.content &&
          (draft.categoryId ?? '') === (post.category_name ?? '') &&
          JSON.stringify(draft.tags ?? []) === JSON.stringify(post.tags ?? [])
        if (!sameAsPost) setRestored(true)
        setTitle(draft.title ?? '')
        setContent(draft.content ?? '')
        setTags(Array.isArray(draft.tags) ? draft.tags : [])
        setCategoryId(draft.categoryId ?? '')
        setEditorKey((k) => k + 1)
      }
      setHydrated(true)
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [key, isEdit, post])

  useEffect(() => {
    if (!hydrated) return
    const sameAsPost =
      isEdit &&
      post !== null &&
      title === post.title &&
      content === post.content &&
      (categoryId ?? '') === (post.category_name ?? '') &&
      JSON.stringify(tags) === JSON.stringify(post.tags ?? [])
    if (sameAsPost) {
      clearDraft(key)
    } else {
      writeDraft(key, { title, content, tags, categoryId })
    }
  }, [title, content, tags, categoryId, key, hydrated, isEdit, post])

  useEffect(() => {
    if (state?.success) {
      clearDraft(key)
      router.push('/dashboard?tab=blog')
    }
  }, [state, key, router])

  useEffect(() => {
    return () => {
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl)
    }
  }, [previewBlobUrl])

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFileError(null)
    setFileInfo(null)
    const file = event.target.files?.[0]
    if (!file) return

    try {
      validateImageFile(file)
      setProcessing(true)
      const blob = await compressImageToWebp(file)
      setProcessing(false)

      setCompressedBlob(blob)
      setFileInfo({
        original: formatBytes(file.size),
        result: formatBytes(blob.size),
      })
      setPreviewBlobUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return URL.createObjectURL(blob)
      })
    } catch (error) {
      setProcessing(false)
      setCompressedBlob(null)
      setPreviewBlobUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return null
      })
      setFileError(
        error instanceof ImageValidationError
          ? error.message
          : 'Failed to process image.',
      )
      event.target.value = ''
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (fileError || processing) return

    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null
    const action = submitter?.value ?? 'draft'

    const formData = new FormData(event.currentTarget)
    formData.set('action', action)
    if (compressedBlob) {
      formData.set('thumbnail', compressedBlob, 'thumbnail.webp')
    }
    startTransition(() => formAction(formData))
  }

  const showNewPreview = previewBlobUrl !== null
  const previewSrc = showNewPreview ? previewBlobUrl : post?.cover_image_url

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10"
    >
      {isEdit && (
        <input type="hidden" name="id" value={post?.id ?? ''} />
      )}

      <div className="flex flex-1 flex-col gap-5">
        {restored && !restoredDismissed && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
            <span>Your saved draft has been restored.</span>
            <button
              type="button"
              aria-label="Close notification"
              onClick={() => setRestoredDismissed(true)}
              className="rounded-full p-0.5 text-primary/60 transition-colors hover:bg-primary/20 hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
        <input
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Post title..."
          required
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-2xl font-bold outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={() => setGeminiOpen(true)}
          title="Create with Gemini"
          aria-label="Create with Gemini"
          className="flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <Sparkles className="h-4 w-4" />
          AI
        </button>
      </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="slug"
            className="text-sm font-semibold text-muted-foreground"
          >
            Slug
          </label>
          <input
            id="slug"
            value={slug}
            disabled
            className="cursor-not-allowed rounded-xl border border-border bg-muted px-4 py-3 text-base text-muted-foreground outline-none"
          />
          <input type="hidden" name="slug" value={slug} />
        </div>

        <MiniEditor key={editorKey} defaultHtml={content} onChange={setContent} />
      </div>

      <aside className="flex w-full flex-col gap-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:w-72 lg:shrink-0 lg:overflow-y-auto">
        <div className="flex flex-col gap-2">
          <label htmlFor="category_id" className="text-sm font-semibold">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="tags" className="text-sm font-semibold">
            Tags
          </label>
          <TagInput
            key={editorKey}
            initialTags={tags}
            onChange={setTags}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">Thumbnail</label>

          {previewSrc ? (
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-border">
              {showNewPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt="Thumbnail preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={previewSrc}
                  alt="Thumbnail preview"
                  fill
                  sizes="288px"
                  className="object-cover"
                />
              )}
            </div>
          ) : (
            <div className="flex aspect-[3/2] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
              <span className="text-sm">No thumbnail yet</span>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            name="thumbnail"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60"
          >
            <Camera className="h-4 w-4" />
            {processing
              ? 'Processing image...'
              : isEdit && !previewSrc
                ? 'Upload thumbnail'
                : previewSrc
                  ? 'Replace thumbnail'
                  : 'Upload thumbnail'}
          </button>

          {fileError && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {fileError}
            </p>
          )}
          {fileInfo && (
            <p className="text-xs text-muted-foreground">
              Compressed to WebP: {fileInfo.original} → {fileInfo.result}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Max 512 KB, automatically compressed to WebP (~128 KB).
          </p>
        </div>

        <FieldMessage state={state} />

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="submit"
            name="action"
            value="draft"
            disabled={pending || processing}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isEdit ? 'Save as Draft' : 'Save as Draft'}
          </button>
          <button
            type="submit"
            name="action"
            value="publish"
            disabled={pending || processing}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {isEdit ? 'Update & Publish' : 'Publish'}
          </button>
        </div>

        <Link
          href="/dashboard?tab=blog"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>
      </aside>

      <GeminiWriterModal
        key={String(geminiOpen)}
        open={geminiOpen}
        onClose={() => setGeminiOpen(false)}
        categories={categories.map((c) => c.name)}
        initialCategory={categoryId}
        currentPostId={post?.id}
        onInserted={(data, category) => {
          setTitle(data.title)
          setContent(data.content)
          setCategoryId(category)
          setTags(data.tags ?? [])
          setEditorKey((key) => key + 1)
        }}
      />
    </form>
  )
}
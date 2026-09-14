'use client'

import { useEffect, useRef, useState } from 'react'
import { sendMessage, type ContactActionState } from '@/app/actions/contact'

export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [state, setState] = useState<ContactActionState>(null)
  const [sending, setSending] = useState(false)
  const messageRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = messageRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }, [message])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending) return

    setSending(true)
    try {
      const formData = new FormData(event.currentTarget)
      const result = await sendMessage(null, formData)
      setState(result)
      if (result?.success) {
        setName('')
        setEmail('')
        setMessage('')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6"
    >
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <div className="flex flex-col gap-2">
        <label
          htmlFor="contact-name"
          className="text-sm font-semibold"
        >
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="contact-email"
          className="text-sm font-semibold"
        >
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          maxLength={320}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="contact-message"
          className="text-sm font-semibold"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          ref={messageRef}
          required
          rows={1}
          maxLength={5000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Write your message here..."
          className="min-h-24 max-h-60 resize-none overflow-y-auto rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="self-end rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {sending ? 'Sending...' : 'Submit'}
      </button>

      {state?.error && (
        <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
          Thank you! Your message has been sent.
        </p>
      )}
    </form>
  )
}
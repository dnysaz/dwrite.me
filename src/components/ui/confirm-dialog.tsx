'use client'

import { useRef, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Delete',
  trigger,
  formAction,
  children,
}: {
  title: string
  description?: string
  confirmLabel?: string
  trigger: React.ReactNode
  formAction: (formData: FormData) => void | Promise<void>
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger}
      </span>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="Tutup dialog"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/50"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              type="button"
              aria-label="Tutup dialog"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold tracking-tight">{title}</h3>
                {description && (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <form
              ref={formRef}
              action={formAction}
              className="mt-6 flex justify-end gap-2"
            >
              {children}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-destructive/90"
              >
                {confirmLabel}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
'use client'

import { startTransition, useActionState, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, EyeOff, KeyRound, LogOut, Mail, Save, ShieldCheck, Upload } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import {
  saveGeminiApiKey,
  updatePassword,
  updateProfile,
  updateOgImage,
  type ActionState,
  type GeminiKeyStatus,
} from '@/app/dashboard/actions'
import {
  compressImageToWebp,
  formatBytes,
  ImageValidationError,
  validateImageFile,
} from '@/lib/image'

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

function PasswordInput({
  id,
  name,
  label,
  autoComplete,
}: {
  id: string
  name: string
  label: string
  autoComplete: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          required
          minLength={8}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-11 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={
            visible ? 'Hide password' : 'Show password'
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  )
}

export function SettingsTab({
  email,
  initialName,
  initialAvatarUrl,
  initialBioEn,
  initialOgImageUrl,
  geminiKeyStatus,
  encryptionConfigured,
}: {
  email: string
  initialName: string
  initialAvatarUrl: string | null
  initialBioEn: string
  initialOgImageUrl: string | null
  geminiKeyStatus: GeminiKeyStatus
  encryptionConfigured: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<{
    original: string
    result: string
  } | null>(null)
  const [processing, setProcessing] = useState(false)

  const ogFileRef = useRef<HTMLInputElement>(null)
  const [ogPreviewUrl, setOgPreviewUrl] = useState<string | null>(null)
  const [ogFileError, setOgFileError] = useState<string | null>(null)
  const [ogFileInfo, setOgFileInfo] = useState<{
    original: string
    result: string
  } | null>(null)
  const [ogProcessing, setOgProcessing] = useState(false)

  const [profileState, profileAction, profilePending] = useActionState(
    updateProfile,
    undefined,
  )
  const [passwordState, passwordAction, passwordPending] = useActionState(
    updatePassword,
    undefined,
  )
  const [ogState, ogAction, ogPending] = useActionState(
    updateOgImage,
    undefined,
  )
  const [geminiState, geminiAction, geminiPending] = useActionState(
    saveGeminiApiKey,
    undefined,
  )
  const [showSecret, setShowSecret] = useState(false)

  const effectiveAvatar = previewUrl ?? initialAvatarUrl
  const effectiveOgImage = ogPreviewUrl ?? initialOgImageUrl
  const initials = initialName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (fileError || processing) return

    const formData = new FormData(event.currentTarget)
    const avatar = formData.get('avatar')
    if (avatar instanceof File && avatar.size > 0) {
      try {
        validateImageFile(avatar)
        setProcessing(true)
        const blob = await compressImageToWebp(avatar)
        setProcessing(false)
        setFileInfo({
          original: formatBytes(avatar.size),
          result: formatBytes(blob.size),
        })
        formData.set('avatar', blob, 'avatar.webp')
      } catch (error) {
        setProcessing(false)
        setFileError(
          error instanceof ImageValidationError
            ? error.message
            : 'Failed to process avatar.',
        )
        return
      }
    }
    startTransition(() => profileAction(formData))
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setFileError(null)
    setFileInfo(null)
    const url = URL.createObjectURL(file)
    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return url
    })
  }

  const handleOgImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setOgFileError(null)
    setOgFileInfo(null)
    const url = URL.createObjectURL(file)
    setOgPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return url
    })
  }

  const handleOgImageSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (ogFileError || ogProcessing) return

    const formData = new FormData(event.currentTarget)
    const ogImage = formData.get('og_image')
    if (!(ogImage instanceof File) || ogImage.size === 0) {
      setOgFileError('Please choose an image file first.')
      return
    }

    try {
      validateImageFile(ogImage)
      setOgProcessing(true)
      const blob = await compressImageToWebp(ogImage)
      setOgProcessing(false)
      setOgFileInfo({
        original: formatBytes(ogImage.size),
        result: formatBytes(blob.size),
      })
      formData.set('og_image', blob, 'og-image.webp')
    } catch (error) {
      setOgProcessing(false)
      setOgFileError(
        error instanceof ImageValidationError
          ? error.message
          : 'Failed to process OG image.',
      )
      return
    }
    startTransition(() => ogAction(formData))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Profil & avatar */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold tracking-tight">Profile</h2>

        <form
          onSubmit={handleProfileSubmit}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              {effectiveAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={effectiveAvatar}
                  alt="Avatar preview"
                  width={80}
                  height={80}
                  className="h-20 w-20 shrink-0 rounded-full border border-border object-cover"
                />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-border bg-primary/10 text-2xl font-bold text-primary">
                  {initials || 'KD'}
                </span>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
              >
                <Upload className="h-4 w-4" />
                Upload avatar
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              name="avatar"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
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

          <div className="flex flex-col gap-2">
            <label htmlFor="display_name" className="text-sm font-semibold">
              Display name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              defaultValue={initialName}
              className="rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="bio" className="text-sm font-semibold">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              defaultValue={initialBioEn}
              placeholder="Short bio about yourself..."
              className="resize-none rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            This bio appears on the About Author card in blog posts.
          </p>

          <FieldMessage state={profileState} />

          <button
            type="submit"
            disabled={profilePending || processing}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {profilePending || processing ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </section>

      {/* OG image (SEO) */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold tracking-tight">SEO — Open Graph Image</h2>
        <p className="text-sm text-muted-foreground">
          This image is used as the preview when your site link is shared on
          social media (WhatsApp, X, Facebook) and as the OG image of the
          homepage. Ideal ratio is 1200 × 630 px.
        </p>

        <form onSubmit={handleOgImageSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative flex aspect-[1200/630] w-full max-w-xs shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
              {effectiveOgImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={effectiveOgImage}
                  alt="Open Graph preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="px-4 text-center text-sm text-muted-foreground">
                  No OG image yet
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => ogFileRef.current?.click()}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <Upload className="h-4 w-4" />
              Upload OG image
            </button>
          </div>
          <input
            ref={ogFileRef}
            type="file"
            name="og_image"
            accept="image/*"
            className="hidden"
            onChange={handleOgImageChange}
          />

          {ogFileError && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {ogFileError}
            </p>
          )}
          {ogFileInfo && (
            <p className="text-xs text-muted-foreground">
              Compressed to WebP: {ogFileInfo.original} → {ogFileInfo.result}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Max 512 KB, automatically compressed to WebP (~128 KB).
          </p>

          <FieldMessage state={ogState} />

          <button
            type="submit"
            disabled={ogPending || ogProcessing}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {ogPending || ogProcessing ? 'Saving...' : 'Save OG image'}
          </button>
        </form>
      </section>

      {/* Email (tidak bisa diubah) */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold tracking-tight">Account</h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="account_email" className="text-sm font-semibold">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="account_email"
              type="email"
              value={email}
              disabled
              title="Email cannot be changed"
              className="w-full cursor-not-allowed rounded-xl border border-border bg-muted px-4 py-3 pl-11 text-base text-muted-foreground outline-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Email cannot be changed. Contact an admin if you need changes.
          </p>
        </div>
      </section>

      {/* Gemini API key (disimpan terenkripsi di database) */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold tracking-tight">Gemini API Key</h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              geminiKeyStatus.configured
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {geminiKeyStatus.configured ? 'Configured' : 'Not configured'}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {geminiKeyStatus.masked ? (
            <>
              Stored key:{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {geminiKeyStatus.masked}
              </code>
              {geminiKeyStatus.updatedAt && (
                <span className="text-xs">
                  {' '}· saved {new Date(geminiKeyStatus.updatedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </>
          ) : (
            'No API key stored yet. Get one free at aistudio.google.com/apikey.'
          )}{' '}
          The key is encrypted with your secret key before it is stored — it is
          never shown in full again.
        </p>
        {!encryptionConfigured && (
          <div className="flex flex-col gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-foreground/90">
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              APP_ENCRYPTION_KEY is not configured on the server
            </span>
            <span>
              This secret key must be set in the server environment (it is the
              root key, so it cannot live in the database). Run this in your
              terminal to generate one:
              <code className="mt-1 block rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                openssl rand -base64 32
              </code>
              Then add it to{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                .env.local</code
              >{' '}
              (or your hosting env vars) as{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                APP_ENCRYPTION_KEY=&lt;generated-key&gt;
              </code>{' '}
              and restart the dev server.
            </span>
          </div>
        )}
        <form action={geminiAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="secret_key" className="text-sm font-semibold">
                Secret key
              </label>
              <div className="relative">
                <input
                  id="secret_key"
                  name="secret_key"
                  type={showSecret ? 'text' : 'password'}
                  autoComplete="off"
                  placeholder="APP_ENCRYPTION_KEY from your server"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-11 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((value) => !value)}
                  aria-label={showSecret ? 'Hide secret key' : 'Show secret key'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showSecret ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="api_key" className="text-sm font-semibold">
                Gemini API key
              </label>
              <input
                id="api_key"
                name="api_key"
                type="password"
                autoComplete="off"
                placeholder="AIza..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {geminiState?.message ? (
            <p className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-bold text-primary">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              {geminiState.message}
            </p>
          ) : (
            <FieldMessage state={geminiState} />
          )}

          <button
            type="submit"
            disabled={geminiPending}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <KeyRound className="h-4 w-4" />
            {geminiPending ? 'Saving...' : 'Save API key'}
          </button>
        </form>
      </section>

      {/* Ganti password */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold tracking-tight">Password</h2>
        <form action={passwordAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <PasswordInput
              id="new_password"
              name="new_password"
              label="New password"
              autoComplete="new-password"
            />
            <PasswordInput
              id="confirm_password"
              name="confirm_password"
              label="Confirm password"
              autoComplete="new-password"
            />
          </div>

          <FieldMessage state={passwordState} />

          <button
            type="submit"
            disabled={passwordPending}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {passwordPending ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>

      {/* Logout */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold tracking-tight">Session</h2>
        <form action={logout}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full border border-destructive px-6 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </form>
      </section>
    </div>
  )
}
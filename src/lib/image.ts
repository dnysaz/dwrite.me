/**
 * Util kompresi gambar sisi-klien (browser).
 *
 * Semua gambar yang di-upload user (avatar, thumbnail post) WAJIB melewati
 * util ini dulu sebelum dikirim ke server untuk disimpan di Supabase Storage.
 * Tujuannya hemat tempat di bucket:
 *   - file asli input  : maksimal 512 KB (MAX_UPLOAD_BYTES)
 *   - hasil kompresi   : WebP, target ±128 KB (TARGET_BYTES), sisi ≤ MAX_DIMENSION
 */

export const MAX_UPLOAD_BYTES = 512 * 1024 // 512 KB
export const TARGET_BYTES = 128 * 1024 // 128 KB
export const MAX_DIMENSION = 1600 // px, sisi terpanjang

export class ImageValidationError extends Error {}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function validateImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new ImageValidationError('File must be an image (JPG, PNG, WebP, etc).')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError(
      `Image size must be 512 KB or smaller. Your file is ${formatBytes(file.size)}.`,
    )
  }
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImageValidationError('Image is corrupted or the format is not supported.'))
    }
    img.src = url
  })
}

async function loadSource(file: File): Promise<HTMLImageElement | ImageBitmap> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // beberapa browser lama / tipe file tertentu → fallback <img>
    }
  }
  return loadImageElement(file)
}

function sourceSize(source: HTMLImageElement | ImageBitmap) {
  if ('naturalWidth' in source) {
    return { width: source.naturalWidth, height: source.naturalHeight }
  }
  return { width: source.width, height: source.height }
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality),
  )
}

async function findTargetQuality(
  canvas: HTMLCanvasElement,
): Promise<Blob> {
  const fallback = () => canvasToWebp(canvas, 0.85)
  let quality = 0.85
  let lastBlob: Blob | null = null

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const blob = await canvasToWebp(canvas, quality)
    if (!blob) throw new ImageValidationError('This browser does not support WebP encoding.')
    lastBlob = blob
    if (blob.size <= TARGET_BYTES) return blob
    quality = Math.max(0.15, quality - 0.15)
  }

  const resolved = lastBlob ?? (await fallback())
  if (!resolved) throw new ImageValidationError('This browser does not support WebP encoding.')
  return resolved
}

/**
 * Kompres gambar menjadi blob WebP dengan ukuran target ±128 KB.
 * - Validasi: tipe harus gambar, ukuran ≤ 512 KB.
 * - Gambar diperkecil dulu agar sisi terpanjang ≤ MAX_DIMENSION.
 * - Kualitas dinaik/turunkan otomatis sampai ukuran ≤ target.
 */
export async function compressImageToWebp(file: File): Promise<Blob> {
  validateImageFile(file)

  const source = await loadSource(file)
  const { width: srcWidth, height: srcHeight } = sourceSize(source)

  const scale = Math.min(1, MAX_DIMENSION / Math.max(srcWidth, srcHeight))
  const width = Math.max(1, Math.round(srcWidth * scale))
  const height = Math.max(1, Math.round(srcHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageValidationError('Canvas is not available in this browser.')
  ctx.drawImage(source, 0, 0, width, height)

  return findTargetQuality(canvas)
}
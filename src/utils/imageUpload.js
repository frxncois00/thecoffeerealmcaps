export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024
export const IMAGE_UPLOAD_ACCEPT = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'

const MIME_EXTENSIONS = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
}

const CANONICAL_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MIME_ALIASES = {
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
  'image/x-png': 'image/png',
}

function detectedMimeType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png'
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp'
  return ''
}

async function verifyImageCanBeDecoded(file, label) {
  const validateDimensions = (width, height) => {
    if (!width || !height) throw new Error()
    if (width * height > 40_000_000) throw new Error(`${label} dimensions are too large. Choose an image under 40 megapixels.`)
  }

  if (typeof Image === 'function' && typeof URL?.createObjectURL === 'function') {
    const objectUrl = URL.createObjectURL(file)
    try {
      const dimensions = await new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
        image.onerror = reject
        image.src = objectUrl
      })
      validateDimensions(dimensions.width, dimensions.height)
      return
    } catch (error) {
      if (error?.message?.includes('40 megapixels')) throw error
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }

  if (typeof globalThis.createImageBitmap === 'function') {
    let bitmap
    try {
      bitmap = await globalThis.createImageBitmap(file)
      validateDimensions(bitmap.width, bitmap.height)
      return
    } catch (error) {
      if (error?.message?.includes('40 megapixels')) throw error
    } finally {
      bitmap?.close?.()
    }
  }

  throw new Error(`${label} is damaged or is not a valid JPG, PNG, or WEBP image.`)
}

export async function validateImageFile(file, { label = 'Image', maxBytes = IMAGE_UPLOAD_MAX_BYTES } = {}) {
  if (!file) throw new Error(`Choose a ${label.toLowerCase()} to upload.`)
  if (!file.size) throw new Error(`${label} cannot be empty.`)
  if (file.size > maxBytes) throw new Error(`${label} must be 5 MB or smaller.`)

  const filenameExtension = String(file.name || '').split('.').pop()?.toLowerCase()
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const detectedType = detectedMimeType(bytes)
  const declaredType = MIME_ALIASES[file.type] || file.type
  if (!CANONICAL_EXTENSIONS[detectedType]) {
    throw new Error(`${label} must be a JPG/JPEG, PNG, or WEBP image. GIFs, videos, and documents are not allowed.`)
  }
  if (declaredType && declaredType !== 'application/octet-stream' && declaredType !== detectedType) {
    throw new Error(`${label} content does not match its file type. Renamed GIFs, videos, and other files are not allowed.`)
  }
  if (!filenameExtension || !MIME_EXTENSIONS[detectedType].includes(filenameExtension)) {
    throw new Error(`${label} filename and file type do not match. Use an original JPG/JPEG, PNG, or WEBP image.`)
  }

  await verifyImageCanBeDecoded(file, label)
  return { extension: CANONICAL_EXTENSIONS[detectedType], mimeType: detectedType }
}

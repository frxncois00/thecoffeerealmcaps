import { timingSafeEqual } from 'node:crypto'

export function authorizedOcrKey(provided, expected) {
  if (!expected || !provided) return false
  const left = Buffer.from(provided)
  const right = Buffer.from(expected)
  return left.length === right.length && timingSafeEqual(left, right)
}

export function supportedImageFormat(format) {
  return ['jpeg', 'png', 'webp'].includes(format)
}

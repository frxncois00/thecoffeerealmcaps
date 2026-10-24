export function slidingPageNumbers(page, totalPages) {
  const length = Math.min(3, Math.max(1, totalPages))
  const start = Math.max(1, Math.min(page - 1, totalPages - length + 1))
  return Array.from({ length }, (_, index) => start + index)
}

// Placeholder identities seeded by 20260809180000_admin_content_and_system_settings.sql.
// Keep them available to the admin editor, but never present them as customer reviews.
const SAMPLE_TESTIMONIAL_IDS = new Set([
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  'default-mika',
  'default-ari',
  'default-nico',
])

export function normalizePublishedTestimonials(rows = []) {
  if (!Array.isArray(rows)) return []
  // Preserve the administrator's query order and exact quote/identity values.
  return rows.filter((row) => row?.visible === true && !SAMPLE_TESTIMONIAL_IDS.has(row.id))
}

const MAX_UNCOMPRESSED_BYTES = 25 * 1024 * 1024
const MAX_ENTRIES = 1000
const MAX_RATIO = 100

export function validateWorkbookZip(buffer) {
  const view = new DataView(buffer)
  let end = -1
  for (let offset = buffer.byteLength - 22; offset >= Math.max(0, buffer.byteLength - 65557); offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50 && offset + 22 + view.getUint16(offset + 20, true) === buffer.byteLength) {
      end = offset
      break
    }
  }
  if (end < 0) throw new Error('Invalid Excel file.')
  const entries = view.getUint16(end + 10, true)
  const centralSize = view.getUint32(end + 12, true)
  const centralOffset = view.getUint32(end + 16, true)
  if (!entries || entries > MAX_ENTRIES || centralOffset + centralSize > end || centralOffset === 0xffffffff || centralSize === 0xffffffff) {
    throw new Error('Excel file exceeds safe archive limits.')
  }
  let offset = centralOffset
  let total = 0
  for (let index = 0; index < entries; index += 1) {
    if (offset + 46 > end || view.getUint32(offset, true) !== 0x02014b50) throw new Error('Invalid Excel archive directory.')
    const compressed = view.getUint32(offset + 20, true)
    const uncompressed = view.getUint32(offset + 24, true)
    const filenameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    if (compressed === 0xffffffff || uncompressed === 0xffffffff || (uncompressed > 0 && (!compressed || uncompressed / compressed > MAX_RATIO))) {
      throw new Error('Excel file exceeds safe archive limits.')
    }
    total += uncompressed
    if (total > MAX_UNCOMPRESSED_BYTES) throw new Error('Excel file exceeds safe archive limits.')
    offset += 46 + filenameLength + extraLength + commentLength
  }
  if (offset !== centralOffset + centralSize) throw new Error('Invalid Excel archive directory.')
}

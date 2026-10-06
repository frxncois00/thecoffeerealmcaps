import { validateImageFile } from '../utils/imageUpload'
import { validateWorkbookZip } from '../utils/validateWorkbookZip'

const MAX_BYTES = 5 * 1024 * 1024
const MAX_TEXT = 12000

export async function readRaimuFile(file) {
  if (!file || !file.size || file.size > MAX_BYTES) throw new Error('Choose a file smaller than 5 MB.')
  const name = String(file.name || '').slice(0, 120)
  const extension = name.split('.').pop()?.toLowerCase()
  let text = ''
  if (['txt', 'md', 'csv'].includes(extension)) text = await file.text()
  else if (extension === 'xlsx') {
    const buffer = await file.arrayBuffer()
    validateWorkbookZip(buffer)
    const { default: ExcelJS } = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    text = workbook.worksheets.map((sheet) => {
      const rows = []
      sheet.eachRow((row) => rows.push(row.values.slice(1).map((cell) => typeof cell === 'object' ? JSON.stringify(cell) : String(cell ?? '')).join(' | ')))
      return `${sheet.name}\n${rows.join('\n')}`
    }).join('\n\n')
  } else if (extension === 'pdf') {
    const pdfjs = await import('pdfjs-dist')
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
    const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
    try {
      const pages = []
      for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 20); pageNumber += 1) {
        const page = await document.getPage(pageNumber)
        const content = await page.getTextContent()
        pages.push(`Page ${pageNumber}\n${content.items.map((item) => item.str || '').join(' ')}`)
        if (pages.join('\n').length >= MAX_TEXT) break
      }
      text = pages.join('\n\n')
    } finally { await document.destroy() }
  } else if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
    await validateImageFile(file, { label: 'Raimu image' })
    const { createWorker } = await import('tesseract.js')
    const worker = await createWorker('eng')
    try { text = (await worker.recognize(file)).data.text } finally { await worker.terminate() }
  } else throw new Error('Raimu supports TXT, Markdown, CSV, Excel, PDF, JPG, PNG, and WEBP files.')
  text = String(text).trim().slice(0, MAX_TEXT)
  if (!text) throw new Error(extension === 'pdf' ? 'No selectable text was found. For a scanned PDF, upload its pages as images.' : 'No readable text was found in this file.')
  return { name, text }
}

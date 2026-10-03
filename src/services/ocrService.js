/**
 * Payment OCR Service (In-Browser Client-Side Engine)
 * Runs Tesseract.js directly inside the client browser.
 * Works seamlessly on any deployed site without needing a local backend server!
 */

import { createWorker } from 'tesseract.js'

let persistentBrowserWorker = null
let workerInitPromise = null

/**
 * Lazily initializes and caches a single persistent Tesseract worker in the browser.
 */
async function getBrowserOcrWorker() {
  if (persistentBrowserWorker) return persistentBrowserWorker

  if (!workerInitPromise) {
    workerInitPromise = (async () => {
      console.info('[Payment OCR] Initializing in-browser Tesseract worker...')
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (import.meta.env.DEV) {
            console.debug(`[OCR Worker] ${m.status}: ${Math.round((m.progress || 0) * 100)}%`)
          }
        },
      })

      // Configure OCR parameters for maximum speed and alphanumeric accuracy on receipts
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.:-#/ ',
        tessedit_pageseg_mode: '6', // Assume a single uniform block of text
      })

      persistentBrowserWorker = worker
      console.info('[Payment OCR] In-browser worker ready.')
      return persistentBrowserWorker
    })()
  }

  return await workerInitPromise
}

/**
 * Preprocesses an image in the browser using HTML5 Canvas for higher OCR contrast.
 * @param {File|Blob} imageFile 
 * @returns {Promise<HTMLCanvasElement|File|Blob>}
 */
async function preprocessImageInBrowser(imageFile) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return imageFile
  }

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(imageFile)

    img.onload = () => {
      URL.revokeObjectURL(url)
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(imageFile)
          return
        }

        // Scale to optimal receipt scanning width (800px to 1000px)
        const targetWidth = Math.min(Math.max(img.width, 600), 1000)
        const scale = targetWidth / img.width
        canvas.width = targetWidth
        canvas.height = img.height * scale

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Convert to high-contrast grayscale
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imgData.data
        for (let i = 0; i < d.length; i += 4) {
          // Luminance formula
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
          // Boost contrast
          const contrast = gray > 140 ? Math.min(255, gray * 1.15) : Math.max(0, gray * 0.85)
          d[i] = contrast
          d[i + 1] = contrast
          d[i + 2] = contrast
        }
        ctx.putImageData(imgData, 0, 0)
        resolve(canvas)
      } catch (err) {
        console.warn('[Payment OCR] Canvas preprocessing fallback:', err)
        resolve(imageFile)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(imageFile)
    }

    img.src = url
  })
}

/**
 * Extracts reference number from OCR raw text using regex patterns for 
 * GCash, Maya, GoTyme, SeaBank, BPI, BDO, UnionBank, InstaPay, and standard receipts.
 * @param {string} text 
 * @returns {{ referenceNumber: string|null, confidenceNote: string, rawMatches: string[] }}
 */
export function extractReferenceNumberFromText(text) {
  if (!text || typeof text !== 'string') {
    return { referenceNumber: null, confidenceNote: 'No text detected', rawMatches: [] }
  }

  // Normalize text lines and replace common OCR glitches
  const cleanText = text
    .replace(/\r\n/g, '\n')
    .replace(/[—–]/g, '-')

  const lines = cleanText.split('\n').map((l) => l.trim()).filter(Boolean)

  const patterns = [
    // 1. Explicit GCash "Ref. No. XXXX XXX XXXXXX" or "Ref No. XXXXXXXXXXXXX"
    {
      name: 'GCash / Standard Ref No',
      regex: /(?:Ref(?:\.|erence)?\s*(?:No|ID|Number|#)?[:.\s-]*)([0-9A-Z\s]{6,24})/i,
    },
    // 2. Maya / Bank "Reference ID", "Ref ID", "Ref Number"
    {
      name: 'Reference ID / Code',
      regex: /(?:Reference\s*(?:ID|Code|No\.?)|Ref\s*ID)[:.\s-]*([0-9A-Z\s-]{6,24})/i,
    },
    // 3. InstaPay / Bank "Trace No.", "Transaction No.", "Txn ID", "Trace Number"
    {
      name: 'Transaction / Trace / Approval',
      regex: /(?:Trace\s*(?:No\.?|Number)|Transaction\s*(?:No\.?|ID|Ref)|Txn\s*ID|Approval\s*(?:Code|No\.?))[:.\s-]*([0-9A-Z\s-]{6,24})/i,
    },
    // 4. "Payment Ref" or "Confirmation No."
    {
      name: 'Payment / Confirmation Ref',
      regex: /(?:Payment\s*Ref(?:\.|erence)?|Confirmation\s*(?:No\.?|Code))[:.\s-]*([0-9A-Z\s-]{6,24})/i,
    },
  ]

  let candidate = null
  let note = ''
  const matches = []

  // Test line-by-line first for higher precision
  for (const line of lines) {
    for (const { name, regex } of patterns) {
      const match = line.match(regex)
      if (match && match[1]) {
        let extracted = match[1].trim()
        
        // Remove trailing non-alphanumeric noise
        extracted = extracted.replace(/[^0-9A-Za-z\s-]/g, '').trim()

        // Filter out accidental date strings like "2026-10-03" if solitary
        if (/^\d{4}-\d{2}-\d{2}$/.test(extracted)) continue

        // Check if length is plausible for a reference number (usually >= 6 chars)
        const pureAlphanumeric = extracted.replace(/[\s-]/g, '')
        if (pureAlphanumeric.length >= 6 && pureAlphanumeric.length <= 25) {
          matches.push(`${name}: ${extracted}`)
          if (!candidate) {
            candidate = extracted
            note = `Matched pattern: ${name}`
          }
        }
      }
    }
  }

  // Fallback 1: search entire raw text block if line-by-line had word wrap
  if (!candidate) {
    for (const { name, regex } of patterns) {
      const match = cleanText.match(regex)
      if (match && match[1]) {
        let extracted = match[1].trim().split('\n')[0].trim()
        extracted = extracted.replace(/[^0-9A-Za-z\s-]/g, '').trim()
        const pureAlphanumeric = extracted.replace(/[\s-]/g, '')
        if (pureAlphanumeric.length >= 6 && pureAlphanumeric.length <= 25) {
          candidate = extracted
          note = `Matched full-text pattern: ${name}`
          matches.push(`${name}: ${extracted}`)
          break
        }
      }
    }
  }

  // Fallback 2: Standalone 10 to 14 digit sequence (characteristic of GCash/Maya receipts)
  if (!candidate) {
    const standaloneDigits = cleanText.match(/\b\d{4}\s\d{3}\s\d{6}\b|\b\d{10,14}\b/g)
    if (standaloneDigits && standaloneDigits.length > 0) {
      candidate = standaloneDigits[0].trim()
      note = 'Matched numeric receipt sequence'
      matches.push(`Standalone Sequence: ${candidate}`)
    }
  }

  return {
    referenceNumber: candidate ? candidate.replace(/\s+/g, ' ').trim() : null,
    confidenceNote: candidate ? note : 'No reference number found matching known patterns',
    rawMatches: matches,
  }
}

/**
 * Extracts reference number from a proof-of-payment image file.
 * Runs 100% in-browser with Tesseract.js.
 * @param {File|Blob} imageFile 
 * @returns {Promise<{ success: boolean, referenceNumber: string|null, confidence?: number, note?: string, error?: string }>}
 */
export async function extractReferenceNumberFromReceipt(imageFile) {
  if (!imageFile) {
    throw new Error('Please provide an image file.')
  }

  try {
    // 1. Preprocess image on HTML5 canvas for contrast enhancement
    const preprocessed = await preprocessImageInBrowser(imageFile)

    // 2. Run OCR in browser worker
    const worker = await getBrowserOcrWorker()
    const { data } = await worker.recognize(preprocessed)

    const rawText = data?.text || ''
    const { referenceNumber, confidenceNote } = extractReferenceNumberFromText(rawText)

    return {
      success: Boolean(referenceNumber),
      referenceNumber: referenceNumber || null,
      confidence: data?.confidence || 0,
      note: confidenceNote,
    }
  } catch (error) {
    console.warn('[Payment OCR Service] In-browser OCR error:', error)
    return {
      success: false,
      referenceNumber: null,
      error: error?.message || 'Could not scan payment receipt.',
    }
  }
}

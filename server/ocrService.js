import sharp from 'sharp'
import { createWorker } from 'tesseract.js'

let persistentWorker = null
let workerInitializing = null

/**
 * Initializes and caches a persistent Tesseract worker.
 * Pre-warms the WASM runtime and language model.
 */
export async function getOcrWorker() {
  if (persistentWorker) return persistentWorker

  if (!workerInitializing) {
    workerInitializing = (async () => {
      console.log('⚡ Initializing high-speed Tesseract OCR worker...')
      const startTime = Date.now()
      
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (process.env.DEBUG_OCR) {
            console.log(`[OCR Worker] ${m.status}: ${Math.round((m.progress || 0) * 100)}%`)
          }
        },
      })

      // Set fast parameters for OCR receipt scanning
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.:-#/ ',
        tessedit_pageseg_mode: '6', // Assume a single uniform block of text for max speed
      })

      console.log(`⚡ OCR Worker ready in ${Date.now() - startTime}ms`)
      persistentWorker = worker
      return persistentWorker
    })()
  }

  return await workerInitializing
}

/**
 * Preprocesses an image buffer with sharp for ultra-fast, high-accuracy OCR.
 * @param {Buffer} inputBuffer 
 * @returns {Promise<Buffer>}
 */
export async function preprocessImageForOcr(inputBuffer) {
  try {
    const metadata = await sharp(inputBuffer).metadata()
    let pipeline = sharp(inputBuffer)

    // Resize to optimal receipt resolution (1000px width is ideal balance of speed and clarity)
    if (metadata.width && metadata.width > 1200) {
      pipeline = pipeline.resize({ width: 1000, withoutEnlargement: true })
    } else if (metadata.width && metadata.width < 500) {
      pipeline = pipeline.resize({ width: 800 })
    }

    // Convert to grayscale, enhance contrast, sharpen edges
    return await pipeline
      .grayscale()
      .normalize()
      .sharpen()
      .png({ compressionLevel: 3 }) // Fast PNG compression
      .toBuffer()
  } catch (err) {
    console.warn('Image preprocessing fallback:', err.message)
    return inputBuffer
  }
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

  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean)

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

  // Fallback: search entire raw text block if line-by-line had word wrap
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
 * Full pipeline: Preprocess image -> Run OCR on persistent worker -> Extract Reference Number
 * @param {Buffer} imageBuffer 
 * @returns {Promise<{ success: boolean, referenceNumber: string|null, rawText: string, note: string, confidence: number }>}
 */
export async function processPaymentReceipt(imageBuffer) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
    throw new Error('Invalid image buffer provided for OCR')
  }

  // Preprocess image
  const processedBuffer = await preprocessImageForOcr(imageBuffer)

  // Get cached persistent worker
  const worker = await getOcrWorker()

  // Run recognition
  const { data } = await worker.recognize(processedBuffer)

  const rawText = data?.text || ''
  const { referenceNumber, confidenceNote } = extractReferenceNumberFromText(rawText)

  return {
    success: Boolean(referenceNumber),
    referenceNumber,
    rawText,
    note: confidenceNote,
    confidence: data?.confidence || 0,
  }
}

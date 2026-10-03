import express from 'express'
import cors from 'cors'
import multer from 'multer'
import dotenv from 'dotenv'
import { getOcrWorker, processPaymentReceipt } from './ocrService.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Configure Multer for memory storage (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files (JPG, PNG, WEBP) are allowed for OCR processing.'))
    }
  },
})

// Root status page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>TCR Payment OCR Server</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #f8faf8; color: #1e3a29; display: grid; place-items: center; min-height: 90vh; margin: 0; }
          .card { background: white; padding: 32px 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #dce8df; max-width: 480px; text-align: center; }
          h1 { margin-top: 0; color: #244e33; font-size: 1.5rem; }
          .status { display: inline-block; background: #dcf5e3; color: #1a6833; padding: 6px 14px; border-radius: 999px; font-weight: bold; font-size: 0.85rem; margin-bottom: 16px; }
          p { color: #556b5c; line-height: 1.5; font-size: 0.95rem; }
          code { background: #edf5ef; padding: 3px 8px; border-radius: 6px; font-size: 0.88rem; color: #204b32; }
          .btn { display: inline-block; margin-top: 18px; padding: 10px 20px; background: #244e33; color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 0.9rem; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="status">● OCR Backend Active</span>
          <h1>The Coffee Realm OCR API</h1>
          <p>This server handles receipt image OCR preprocessing and reference number extraction for checkout proof of payment.</p>
          <p>Frontend Web App: <a href="http://localhost:5173" target="_blank">http://localhost:5173</a></p>
          <a class="btn" href="http://localhost:5173/checkout">Go to Checkout App</a>
        </div>
      </body>
    </html>
  `)
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'TCR Payment OCR API', timestamp: new Date().toISOString() })
})

/**
 * OCR Reference Number Extraction Endpoint
 * Accepts: multipart/form-data with field name 'image' or 'paymentProof' or 'file'
 */
const handleExtractReference = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded. Please provide an image file under the "image" field.',
      })
    }

    console.log(`[OCR] Processing receipt: ${req.file.originalname} (${Math.round(req.file.size / 1024)} KB)`)
    
    const startTime = Date.now()
    const result = await processPaymentReceipt(req.file.buffer)
    const durationMs = Date.now() - startTime

    console.log(`[OCR] Completed in ${durationMs}ms - Extracted Ref: "${result.referenceNumber || 'N/A'}"`)

    return res.json({
      success: result.success,
      referenceNumber: result.referenceNumber,
      confidence: result.confidence,
      note: result.note,
      rawText: process.env.NODE_ENV === 'production' ? undefined : result.rawText,
      durationMs,
    })
  } catch (error) {
    console.error('[OCR Error]', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process proof of payment image.',
    })
  }
}

// Upload handlers supporting common field names
app.post('/api/extract-reference-number', upload.single('image'), handleExtractReference)
app.post('/api/ocr/extract-reference', upload.single('image'), handleExtractReference)
app.post('/api/ocr/upload', upload.single('paymentProof'), handleExtractReference)

// Global Error Handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File size exceeds 10MB limit.' })
    }
    return res.status(400).json({ success: false, error: err.message })
  }
  if (err) {
    return res.status(400).json({ success: false, error: err.message })
  }
  next()
})

app.listen(PORT, () => {
  console.log(`🚀 Payment OCR Backend running on http://localhost:${PORT}`)
  console.log(`📡 Endpoint ready: POST http://localhost:${PORT}/api/extract-reference-number`)
  // Pre-warm the Tesseract worker in background
  getOcrWorker().catch(err => console.warn('⚠️ OCR Worker background warm-up warning:', err.message))
})

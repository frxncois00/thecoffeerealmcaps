/**
 * Payment OCR Service (Frontend Client)
 * Communicates with the OCR backend to extract reference numbers from payment receipts.
 */

const OCR_BACKEND_URL = import.meta.env.VITE_OCR_API_URL || 'http://localhost:5000'

/**
 * Sends a proof-of-payment image file to the backend OCR service.
 * @param {File|Blob} imageFile 
 * @returns {Promise<{ success: boolean, referenceNumber: string|null, confidence?: number, note?: string, error?: string }>}
 */
export async function extractReferenceNumberFromReceipt(imageFile) {
  if (!imageFile) {
    throw new Error('Please provide an image file.')
  }

  const formData = new FormData()
  formData.append('image', imageFile)

  try {
    const response = await fetch(`${OCR_BACKEND_URL}/api/extract-reference-number`, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        referenceNumber: null,
        error: data?.error || `Server responded with status ${response.status}`,
      }
    }

    return {
      success: Boolean(data?.success && data?.referenceNumber),
      referenceNumber: data?.referenceNumber || null,
      confidence: data?.confidence || 0,
      note: data?.note || '',
    }
  } catch (error) {
    console.warn('[Payment OCR Service] Could not connect to OCR backend:', error)
    return {
      success: false,
      referenceNumber: null,
      error: error?.message || 'Failed to reach OCR server.',
    }
  }
}

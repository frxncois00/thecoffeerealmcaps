import { useEffect, useRef, useState } from 'react'
import { Check, Clock3, ImagePlus, Loader2, X } from 'lucide-react'
import { IMAGE_UPLOAD_ACCEPT, validateImageFile } from '../../utils/imageUpload'
import { submitDeliveryProof } from '../../services/deliveryChatService'
import { confirmCustomerOrderReceived } from '../../services/customerService'
import { useDeliveryDialog } from './useDeliveryDialog'
import './delivery-chat.css'

export function CustomerReceiptDialog({ order, onClose, onDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const busyRef = useRef(false)
  const dialog = useDeliveryDialog(() => { if (!busyRef.current) onClose() })
  const confirm = async () => {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError('')
    try { const result = await confirmCustomerOrderReceived(order.id); onDone(result) }
    catch (cause) { setError(cause.message || 'Could not confirm receipt. Try again.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  return <div className="dc-dialog-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose()}}>
    <section className="dc-confirm-dialog" ref={dialog} role="alertdialog" aria-modal="true" aria-labelledby="dc-received-title" aria-describedby="dc-received-description" tabIndex={-1}>
      <span className="dc-confirm-icon"><Check size={23}/></span>
      <h2 id="dc-received-title">Complete this order?</h2>
      <p className="dc-order-reference">{order.order_number}</p>
      <p id="dc-received-description">Confirm you received your order without issues. Your order will be completed and live chat will close.</p>
      {error&&<p className="dc-error" role="alert">{error}</p>}
      <footer><button type="button" onClick={onClose} disabled={busy}>Back</button><button type="button" className="dc-primary" onClick={confirm} disabled={busy}>{busy?<Loader2 className="spin" size={16}/>:<Check size={16}/>}Confirm received</button></footer>
    </section>
  </div>
}

export function DeliveryCompletionDialog({ order, onClose, onDone }) {
  const [images, setImages] = useState([])
  const [validating, setValidating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const input = useRef(null)
  const imagesRef = useRef([])
  const busyRef = useRef(false)
  const dialog = useDeliveryDialog(() => { if (!busyRef.current) onClose() })
  useEffect(()=>{imagesRef.current=images},[images])
  useEffect(()=>()=>{imagesRef.current.forEach(image=>URL.revokeObjectURL(image.url))},[])
  const choose = async event => {
    const files = [...(event.currentTarget.files || [])]
    event.currentTarget.value = ''
    if (!files.length) return
    if (images.length + files.length > 3) { setError('Choose up to 3 images.'); return }
    busyRef.current = true; setValidating(true); setError('')
    try {
      for (const file of files) await validateImageFile(file, { label: 'Delivery proof' })
      setImages(current=>[...current,...files.map(file=>({id:crypto.randomUUID(),file,url:URL.createObjectURL(file)}))])
    } catch (cause) { setError(cause.message || 'Choose a valid image.') }
    finally { busyRef.current = false; setValidating(false) }
  }
  const remove = image => { URL.revokeObjectURL(image.url); setImages(current=>current.filter(item=>item.id!==image.id)) }
  const confirm = async () => {
    if (busyRef.current || validating) return
    busyRef.current = true; setBusy(true); setError('')
    try { onDone(await submitDeliveryProof(order.id, images.map(image=>image.file))) }
    catch (cause) { setError(cause.message || 'Could not confirm delivery. Try again.') }
    finally { busyRef.current = false; setBusy(false) }
  }
  return <div className="dc-dialog-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy&&!validating)onClose()}}>
    <section className="dc-confirm-dialog dc-proof-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby="dc-proof-title" tabIndex={-1}>
      <header><h2 id="dc-proof-title">Complete delivery</h2><button type="button" className="dc-icon" onClick={onClose} disabled={busy||validating} aria-label="Close"><X size={19}/></button></header>
      <p className="dc-order-reference">{order.order_number} · {order.customer_name}</p>
      <label className="dc-upload-label" htmlFor="dc-proof-files">Proof of delivery <small>{images.length}/3</small></label>
      <input ref={input} id="dc-proof-files" type="file" accept={IMAGE_UPLOAD_ACCEPT} multiple hidden onChange={choose} disabled={busy||validating}/>
      <div className="dc-proof-previews">
        {images.map(image=><div key={image.id}><img src={image.url} alt="Delivery proof preview"/><button type="button" onClick={()=>remove(image)} disabled={busy||validating} aria-label={`Remove ${image.file.name}`}><X size={14}/></button></div>)}
        {images.length<3&&<button type="button" className="dc-add-image" onClick={()=>input.current?.click()} disabled={busy||validating}>{validating?<Loader2 className="spin" size={22}/>:<ImagePlus size={24}/>}<span>{validating?'Checking…':'Add image'}</span></button>}
      </div>
      <p className="dc-format-hint">JPG, PNG or WEBP · Up to 5 MB each</p>
      <p className="dc-confirm-note"><Clock3 size={16}/>The customer has 1 hour to confirm receipt.</p>
      {error&&<p className="dc-error" role="alert">{error}</p>}
      <footer><button type="button" onClick={onClose} disabled={busy||validating}>Back</button><button type="button" className="dc-primary" onClick={confirm} disabled={busy||validating}>{busy?<Loader2 size={16} className="spin"/>:<Check size={16}/>}Confirm delivery</button></footer>
    </section>
  </div>
}

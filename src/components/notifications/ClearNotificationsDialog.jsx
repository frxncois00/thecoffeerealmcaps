import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function ClearNotificationsDialog({ open, count, onCancel, onConfirm }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !open) return undefined
    dialog.showModal()
    return () => dialog.close()
  }, [open])

  return <dialog ref={dialogRef} className="staff-clear-notifications-dialog" aria-labelledby="staff-clear-title" aria-describedby="staff-clear-description" onCancel={(event) => { event.preventDefault(); onCancel() }} onClick={(event) => { if (event.target === event.currentTarget) onCancel() }}>
    <div className="staff-clear-notifications-card">
      <button type="button" className="staff-clear-notifications-close" onClick={onCancel} aria-label="Close confirmation"><X size={18} /></button>
      <h2 id="staff-clear-title">Clear notification history?</h2>
      <p id="staff-clear-description">This will remove all {count} notification{count === 1 ? '' : 's'} from this browser. You cannot undo this action.</p>
      <div className="staff-clear-notifications-actions">
        <button type="button" autoFocus onClick={onCancel}>Keep notifications</button>
        <button type="button" className="is-destructive" onClick={onConfirm}>Clear all</button>
      </div>
    </div>
  </dialog>
}

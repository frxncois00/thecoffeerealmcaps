import { useState } from 'react'
import AppShell from '../components/AppShell'
import { MenuApprovalsQueue } from './ContentManagementPage'
import { updateMenuApprovalRequest } from '../services/menuApprovalService'
import { describeError } from '../utils/describeError'

export default function MenuApprovalsPage() {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  async function handleAction(request, state) {
    try {
      await updateMenuApprovalRequest(request.id, state)
      setNotice(`${request.itemName} marked ${state}.`)
      setError('')
    } catch (cause) {
      setError(describeError(cause, 'The approval decision could not be saved.'))
    }
  }
  return <AppShell role="admin" title="Menu Approvals" eyebrow="Operations"><div className="menu-approvals-page">{error ? <p className="form-error" role="alert">{error}</p> : null}{notice ? <p className="form-success" role="status">{notice}</p> : null}<MenuApprovalsQueue onAction={handleAction} compact /></div></AppShell>
}

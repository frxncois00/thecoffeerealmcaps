import { useState } from 'react'
import AppShell from '../components/AppShell'
import BenefitsReviewModule from './BenefitsReviewModule'

export default function BenefitsVerificationPage() {
  const [refreshSignal, setRefreshSignal] = useState(0)
  return <AppShell role="admin" title="Benefits Verification" eyebrow="Operations" onRefresh={() => setRefreshSignal(value => value + 1)}><BenefitsReviewModule compact refreshSignal={refreshSignal} /></AppShell>
}

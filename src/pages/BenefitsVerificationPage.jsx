import AppShell from '../components/AppShell'
import BenefitsReviewModule from './BenefitsReviewModule'

export default function BenefitsVerificationPage() {
  return <AppShell role="admin" title="Benefits Verification" eyebrow="Operations"><BenefitsReviewModule compact /></AppShell>
}

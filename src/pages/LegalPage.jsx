import { Facebook, Instagram, MessageCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { CONTENT_DEFAULTS } from '../services/adminPortalConfigurationService'

const sections = {
  privacy: {
    title: 'Privacy Policy',
    intro: 'This Privacy Policy explains how The Coffee Realm handles personal information when you visit our website, create an account, place an order, contact us, or use our related services.',
    updated: 'September 22, 2026',
    items: [
      ['1. Who we are', <>The Coffee Realm is a neighborhood café serving customers in North Fairview, Quezon City. In this Policy, “The Coffee Realm,” “we,” “us,” and “our” refer to the business operating this website and its customer services.</>],
      ['2. Information we may collect', <>Depending on how you interact with us, we may receive information such as your name, contact details, account information, delivery or pickup details, order and transaction information, messages, feedback, and information needed to verify or support a request. We may also receive limited technical information about your browser, device, and use of the website.</>],
      ['3. How information is collected', <>We collect information you provide when you register, sign in, place an order, request delivery or pickup, contact us, submit feedback, or use features of our website. Some information may be collected automatically through essential cookies and similar technologies used to keep the website secure and functional.</>],
      ['4. How we use information', <>We may use information to create and maintain accounts, verify requests, process and fulfill orders, coordinate pickup or delivery, confirm payments, respond to messages, improve our services, prevent fraud or misuse, send service communications, and comply with legal or regulatory obligations. We use information for marketing only where permitted and, when required, with your consent.</>],
      ['5. Legal bases for processing', <>We process personal information on appropriate legal bases under applicable Philippine privacy law, including consent, fulfilling an agreement with you, complying with a legal obligation, and pursuing legitimate business interests while respecting your rights.</>],
      ['6. Sharing information', <>We may share limited information with service providers and partners that help us operate the website, process payments, communicate with customers, fulfill orders, or provide delivery-related services. We may also disclose information when required by law, to protect people or property, or as part of a lawful business transfer. We do not sell personal information.</>],
      ['7. Cookies and third-party services', <>Essential cookies may be needed for account, cart, security, and website functions. Optional tools may help us understand site performance. Links or services operated by third parties, including maps, social networks, payment providers, or delivery partners, are governed by their own policies once you use them.</>],
      ['8. Retention and security', <>We retain information only for as long as reasonably necessary for the purposes described in this Policy, including order records, accounting, legal obligations, dispute resolution, and security. We use reasonable and appropriate safeguards designed to protect information from unauthorized access, loss, misuse, or disclosure.</>],
      ['9. Your rights', <>Subject to applicable law, you may have the right to be informed, access or correct your information, object to certain processing, withdraw consent, request deletion or blocking where applicable, and raise a concern with the National Privacy Commission. Requests may be subject to verification and legal exceptions.</>],
      ['10. Marketing choices', <>You may opt out of promotional messages by using the unsubscribe option provided or by contacting us. You may still receive essential communications about orders, accounts, security, or service requests.</>],
      ['11. Children', <>Our online services are not directed at young children. If a parent or legal guardian believes a child has provided personal information to us, please contact us so we can review the request and take appropriate action.</>],
      ['12. Changes to this Policy', <>We may update this Policy when our services, practices, or legal requirements change. We will post the updated version on this page and identify the date it was last revised. Material changes may be highlighted where appropriate.</>],
      ['13. Contact us', <>For privacy questions or requests, contact The Coffee Realm through the contact details shown on our website: 0966 964 7796 or thecoffeerealmx@gmail.com. We may ask for information needed to verify your identity and properly handle your request.</>],
    ],
  },
  terms: {
    title: 'Terms of Use',
    intro: 'These Terms of Use govern your access to and use of The Coffee Realm website, customer account features, online ordering, and related services.',
    updated: 'September 22, 2026',
    items: [
      ['1. Agreement to these Terms', <>By accessing or using our website or services, you agree to these Terms of Use and our Privacy Policy. If you do not agree, please do not use the service.</>],
      ['2. Eligibility and account information', <>You agree to provide information that is accurate and current, keep your account details updated, and protect your login credentials and verification codes. You are responsible for activity carried out through your account and should notify us promptly of suspected unauthorized access.</>],
      ['3. Acceptable use', <>You may use the service only for lawful, personal purposes. You must not interfere with the website, attempt unauthorized access, submit fraudulent information, misuse promotions, use automated tools to extract content, or upload material that is unlawful, harmful, abusive, deceptive, or infringes another person’s rights.</>],
      ['4. Products, prices, and availability', <>Menu descriptions, images, prices, preparation times, and availability may change. Images are for presentation and may not exactly represent the item served. We may correct obvious errors, limit quantities, or make an item unavailable when necessary.</>],
      ['5. Orders and acceptance', <>Submitting an order is a request to purchase. An order is accepted only when The Coffee Realm confirms it or begins fulfillment. We may decline or cancel an order when an item is unavailable, payment cannot be verified, information is incomplete, or fulfillment is not reasonably possible.</>],
      ['6. Payment', <>You agree to provide complete and accurate payment information and to use an authorized payment method. Payment processing may be handled by a third-party provider. Orders may be delayed, declined, or cancelled where payment is unsuccessful, reversed, suspicious, or cannot be verified.</>],
      ['7. Pickup and delivery', <>You are responsible for providing accurate contact and delivery information and being available to receive an order. Preparation and delivery estimates are not guarantees and may be affected by demand, traffic, weather, store operations, or third-party services. Additional delivery conditions or charges may apply at checkout.</>],
      ['8. Cancellations, refunds, and order concerns', <>Cancellation, refund, missing-item, or incorrect-item requests are handled according to the circumstances of the order and applicable consumer law. Please contact us promptly with the order details so we can review and provide the appropriate remedy.</>],
      ['9. Promotions', <>Promotions, discounts, and offers may have separate eligibility rules, expiry dates, usage limits, and exclusions. Offers may not be combined or transferred unless expressly stated. We may refuse or withdraw an offer where misuse or fraud is suspected.</>],
      ['10. Intellectual property', <>The Coffee Realm name, logos, menu content, photographs, designs, software, and other materials are owned by or licensed to The Coffee Realm. You may view and use them for personal, non-commercial purposes only. Copying, selling, modifying, scraping, or redistributing them requires prior written permission.</>],
      ['11. Third-party services and links', <>The website may link to or rely on third-party services. Those services have their own terms and privacy policies, and The Coffee Realm is not responsible for matters governed by those third-party terms.</>],
      ['12. Availability and disclaimers', <>We work to keep our website and information useful and available, but we do not guarantee uninterrupted access, error-free content, or that every product or feature will always be available. Nothing in these Terms removes rights or remedies that cannot be excluded under Philippine law.</>],
      ['13. Suspension or termination', <>We may suspend access, cancel orders, or close an account when necessary to protect the service, customers, or business, including in cases of fraud, abuse, security risk, non-payment, or breach of these Terms. Any outstanding obligations that should reasonably continue will survive termination.</>],
      ['14. Governing law and concerns', <>These Terms are intended to be interpreted under the laws of the Republic of the Philippines. If you have a concern, please contact us first so we can try to resolve it in good faith before pursuing any available legal remedy.</>],
      ['15. Changes to these Terms', <>We may update these Terms as our services or legal obligations change. The revised version will be posted on this page with a new effective date. Continued use after an update may constitute acceptance to the extent permitted by law.</>],
    ],
  },
}

export default function LegalPage() {
  const location = useLocation()
  const type = location.pathname.includes('terms-of-use') ? 'terms' : 'privacy'
  const page = sections[type]
  const content = CONTENT_DEFAULTS.footer
  return (
    <main className="legal-page">
      <section className="legal-hero">
        <h1>{page.title}</h1>
        <p>{page.intro}</p>
        <small>Last updated: {page.updated}</small>
      </section>
      <article className="legal-content">
        <nav className="legal-jump" aria-label={`${page.title} sections`}>
          {page.items.map(([heading]) => <a key={heading} href={`#${heading.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}>{heading}</a>)}
        </nav>
        <div className="legal-sections">
          {page.items.map(([heading, body]) => {
            const id = heading.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
            return <section key={heading} id={id}><h2>{heading}</h2><p>{body}</p></section>
          })}
        </div>
      </article>
    </main>
  )
}

export function LandingFooter() {
  const content = CONTENT_DEFAULTS.footer
  return <footer className="landing-footer-react">
    <div className="footer-bottom-line">
      <div className="footer-social-links">
        <a href={content.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook" title="Facebook"><Facebook size={18} /></a>
        <a href={content.tiktokUrl} target="_blank" rel="noreferrer" aria-label="TikTok" title="TikTok"><MessageCircle size={18} /></a>
        <a href={content.instagramUrl} target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram"><Instagram size={18} /></a>
      </div>
      <nav className="footer-legal" aria-label="Legal links"><Link to="/privacy-policy">Privacy Policy</Link><Link to="/terms-of-use">Terms of Use</Link></nav>
      <span>© 2026 The Coffee Realm. All rights reserved.</span>
    </div>
  </footer>
}

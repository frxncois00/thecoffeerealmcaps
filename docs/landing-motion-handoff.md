# Landing page motion and Visit Us handoff

Completed October 11, 2026. Existing brand colors, DM Sans / Playfair Display typography, product content and established page copy were retained. The latest refinement replaces the reference-style arrival grid with an original neighborhood-note design and rephrases the added arrival guidance as requested.

## Motion controls

Set `MOTION_ENABLED = false` in `src/motion/config.js` to disable non-essential landing motion. Shared durations, easing and reveal variants live in that file. `src/motion/useRealmMotion.js` combines the flag, OS reduced-motion preference, viewport and pointer capability. The footer **Reduce motion** control and its unused preference store were removed at the user's request. Automatic OS reduced-motion support remains. There are no floating bottom-right controls.

## Result

- Hero word reveals, desktop image parallax and light steam; existing three videos are loaded on demand, and paused offscreen or when the tab is hidden. Reduced motion uses the existing espresso image as its initial poster. Pausing preserves loaded video position.
- Seamless duplicated marquee with duplicate content hidden from assistive technology; pauses offscreen and on hover. Motion-off displays all four messages in a static layout.
- Bestsellers uses manual arrows, drag/swipe and animated dots with 44px targets. Keyboard arrows/Home/End, slide announcements, focus handling and accidental-click suppression are supported. No autoplay or play button, per the follow-up request.
- Ordering plates reveal together and float only on desktop while visible. Story photo parallax, scroll-filled timeline, staggered review cards, nav underlines and footer entrance share the same motion settings.
- Visit Us is a forest-green contact section with a lazy map, regular-hours badge in Asia/Manila, telephone/email links and directions. A cream neighborhood note adds an invitation, a native SVG corner illustration, clean car/tricycle route selector tabs ("Driving over" / "Taking a tricycle"), and streamlined editorial storefront/entrance guidance without icon clutter. The selector supports touch, arrow keys, Home/End and accessible tab/panel relationships, with reserved space to prevent content jumps.
- Published admin reviews replace all placeholder-review fallbacks. Their quote, customer identity, rating and display order are retained.

## Files changed

Motion and landing UI:

- `src/motion/config.js` (new)
- `src/motion/useRealmMotion.js` (new)
- `src/landing-motion.css` (new)
- `src/main.jsx`
- `src/pages/HomePage.jsx`
- `src/pages/LegalPage.jsx`
- `src/components/Reveal.jsx`
- `src/components/BestSellerCarousel.jsx`
- `src/components/CoffeeCard.jsx`
- `src/components/coffee-carousel-motion.css` (new)
- `src/components/HowOrderingWorks.jsx`
- `src/components/landing-chrome-motion.css` (new)
- `src/components/customer/CustomerLayout.jsx`
- `src/components/customer/CustomerPageMotion.jsx`
- `src/components/landing/HeroMedia.jsx` (new)
- `src/components/landing/LandingAccents.jsx` (new)
- `src/components/landing/VisitUs.jsx` (new)
- `src/components/landing/visit-us.css` (new)

Published reviews:

- `src/services/adminPortalConfigurationService.js` (preserved earlier local edits)
- `src/utils/publishedTestimonials.js` (new)
- `tests/publishedTestimonials.test.js` (new)
- `supabase/migrations/20261011110000_public_testimonial_read_policy.sql` (new)

Baseline lint cleanup, without behavior changes:

- `src/components/common/ReceiptDocument.jsx`, `src/components/common/receiptUtils.js` (new): separated receipt helpers from React component exports.
- `src/context/LogoutTransitionContext.jsx`, `src/context/useLogoutTransition.js` (new): separated context/hook from provider.
- Updated helper imports in `src/components/AppShell.jsx`, `src/pages/CashierPage.jsx`, `src/pages/TransactionsPage.jsx`, `src/pages/customer/CustomerPages.jsx`, and CustomerLayout.

Existing unrelated changes to package-lock, menuService and prior SQL files were retained. No dependencies were added; existing Framer Motion and Lucide are reused.

## Database fix

The live public testimonial request initially failed with HTTP 401 / `permission denied for function is_admin_profile`. The new scoped SQL was applied to the verified linked Coffee Realm project via SQL query. Anonymous SELECT now requires `visible = true` without executing the admin helper; authenticated SELECT retains its published-or-admin behavior. Admin write policies and private feedback were not changed. The migration is safe to reapply.

Verification returned HTTP 200 and the three published reviews in admin display order; the same quotes and identities rendered in the browser. No reviews were created, edited or published by this task.

## Validation

- Production build passes for both the main application and café-tour preview.
- Full ESLint: 0 errors, 12 pre-existing hook dependency warnings elsewhere.
- Existing test suite including the new review filters: 84 passed, 0 failed.
- Browser inspected at desktop 1440×1000, phone 390×844, narrow phone 320×740, and landscape 844×390.
- Checked mobile menu Escape/focus restoration, keyboard carousel selection, drag without unintended product activation, absence of removed controls, published reviews, map rendering and offscreen video pause. The former footer motion control was exercised before its removal.
- Latest arrival redesign checked at 1440×1000, 768×1000, 390×844 and 320×740: no horizontal overflow, 44px travel tabs, correct selected/focus states and stable panel height between travel options. The footer control is absent from the rendered page. No browser console errors were reported.
- Corrected inherited mobile overflow and hidden marquee messages. Narrow-phone and landscape document widths match their available client width.
- OS reduced motion is wired through the same motion-off path. The browser tooling did not expose an OS media-emulation control.

## Deliberate omissions and remaining baseline limitations

- No blocking loader or custom cursor: immediate access and familiar touch/pointer behavior suit the café better.
- Floating order/pause controls, the footer motion control and carousel autoplay were removed on request.
- No new image/video asset downloads, no dependency additions, and no website deployment.
- Existing application-wide bundle-size/Tesseract chunk warnings remain; restructuring staff/admin bundles was outside the landing-page scope.
- The hours badge describes regular café hours, not holiday exceptions or the separate online-order cutoff.

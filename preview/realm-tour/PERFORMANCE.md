# Realm Tour performance audit and validation

Scope: `/preview/realm-tour/`. Main-site checkout, account flows, copy, product data and branding were not changed by this performance pass. Changes are marked `PERF` in source.

## Before → after

| Finding | Implementation |
| --- | --- |
| 38 source images totaled 36,856,063 bytes; several tiny flavor buttons loaded multi-megabyte PNGs | Transparent WebP derivatives, responsive `srcset`/`sizes`, tier-specific caps. Largest variants total 5,617,848 bytes (84.8% smaller); actual phone transfer is smaller. Originals retained for other consumers. |
| Off-screen sections kept their scroll drivers and derived motion values subscribed | `useVisibleScroll` disconnects off-screen and in hidden tabs. Original product trajectories, watermark parallax and full-screen background motion remain. |
| Broad permanent layer promotion on images, copy, shadows and typography | Explicit promotion limited to visible scrolling hero/product images; released 600ms after scroll. Wheel rotor promoted only while spinning. |
| Four SVG stroke-length animations repainted the winding ribbon | Original 3.6-second stroke drawing restored at user request; this finite SVG paint animation is an intentional exception to transform/opacity-only motion. Reduced motion shows the final ribbon. |
| Shadow/color/spacing transitions and large live backdrop blur | Only transform/opacity transitions; lower HUD blur on high. Medium/low use static gradients and contact shadows instead of backdrop/image filters. |
| No capability or runtime adaptation | HIGH/MEDIUM/LOW hints, initial 2-second sample, downgrade after two consecutive windows under 45fps, 10-second cooldown. Hidden tabs reset sampling. |
| All chapter code in the entry module | Wheel, pasta and gallery in a separate ~17KB uncompressed chunk behind stable Suspense section anchors. Shared libraries remain because the rest of the application uses them. |
| Resize measurements could repeat during gallery layout changes | Debounced ResizeObserver; existing passive scroll listener and one-rAF batching retained. Hero pointer bounds cached per gesture. |

All tiers retain the Ferris wheel, all nine slices, watermark parallax, dish entrances, winding ribbon, polaroid gallery and closing scene. Medium uses up to 1200px images, fewer save particles, static lighting and simpler shadows. Low caps images at 960px, slightly reduces decorative watermark travel and one steam group. High retains full depth and lighting. Pausing and system reduced motion retain readable final states.

`contain: layout paint style` and viewport-relative section sizing were already present and are preserved. There is no tour video. No new animation library was added. Native touch scrolling is not intercepted.

## Reproduce checks

From the repository root:

```powershell
node preview/realm-tour/optimize-images.mjs
node preview/realm-tour/performance.test.mjs
npx eslint preview/realm-tour/RealmProductTour.jsx preview/realm-tour/TourChapters.jsx preview/realm-tour/TourImage.jsx preview/realm-tour/performance.js preview/realm-tour/frameBudget.js preview/realm-tour/responsiveImage.js preview/realm-tour/main.jsx --no-ignore
npx vite build --config vite.realm-tour.config.js
```

Image generation is only needed after artwork changes. Deploy the generated `public/images/realm-tour/optimized/` assets alongside the main site, as with the existing shared public assets.

## Chrome DevTools checklist (pending manual execution)

- [ ] Test a production build, not Vite HMR. Record a baseline from the previous version on the same machine/device if available.
- [ ] Use mobile emulation at 360×800 and 412×915 with 4× CPU throttling. Test cold cache once, then a warm-cache full tour at least three times.
- [ ] In Network, filter images: hero is the only eager/high-priority preload; tour images use WebP, correctly sized candidates, and no original PNG downloads. Browser lazy loading may fetch near-viewport images early; this is expected.
- [ ] Record 30–60 seconds in Performance: scroll every chapter, dwell on the spinning cake wheel, change all four flavors, open/close each pasta card, swipe/drag the gallery, visit the closing scene and replay.
- [ ] Inspect Frames, Main, Raster and GPU tracks. Aim for ~16.7ms frames at 60Hz, no repeated >50ms tasks, no recurring layout/paint caused by animation properties. Report actual dropped-frame rate rather than assuming CPU throttling represents phone GPU performance.
- [ ] Enable Paint Flashing and Layer Borders. Whole sections should not repaint continuously. Off-screen perpetual animations must be paused; explicit hero/product layer hints should disappear after scrolling settles.
- [ ] Inspect `.realm-product-tour`'s `data-quality`: mobile starts medium unless low capability hints apply. Under sustained load it may move high → medium → low, with no repeated oscillation. It never turns off a primary animation.
- [ ] Compare screenshots at the same scroll positions: same copy, colors, section order, image proportions and layout. Check transparent edges, small cake detail, dish shadows, fixed header, gallery and closing backdrop.
- [ ] Check fast section jumps, keyboard navigation, horizontal gallery arrows, resize/orientation change, save buttons, pause/resume and reduced-motion emulation. No empty/overlapping sections or invisible focused controls.
- [ ] Background the tab for 20 seconds and return: wheel resumes, layout remains intact, hidden time does not cause a quality downgrade.

## Real Android checklist (pending)

- [ ] Use a mid-range 4–6GB Android phone, plus a 2–4GB low-end phone if available. Record model, Android/Chrome version, refresh rate, quality tier and viewport.
- [ ] Remote-debug via USB; repeat the production-build flow above at native 60Hz without desktop CPU throttling. Test Wi-Fi and a throttled mobile connection separately.
- [ ] Run for at least five minutes to include image decodes and thermal throttling. Scroll in both directions, dwell on the wheel, and interact with every section.
- [ ] Confirm no address-bar jumps, accidental touch interception, missing artwork, cropped content or noticeable blur at the intended viewing size.
- [ ] Capture frame-time evidence before claiming stable 60fps. Average rAF sampling is only an adaptation signal; it is not a substitute for real GPU/raster profiling.

Automated source/build and image/quality tests can run locally. Browser UI automation is disabled in this workspace, so this pass does not claim a measured 60fps result or completed device/screenshot QA.

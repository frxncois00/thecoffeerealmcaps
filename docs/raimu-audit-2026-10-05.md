# Raimu tool audit — 2026-10-05

## Verified in this checkout

| Area | Check | Result |
| --- | --- | --- |
| Order status and follow-up memory | Request-level tests with a real-shaped order and recent chat history | Pass |
| Low stock | Ingredient threshold and empty inventory responses | Pass |
| Daily sales | Yesterday in Philippine time; only paid completed/received, nonvoid orders | Pass |
| Shift handover | Active orders, low stock, open purchase orders, new messages | Pass |
| Reports | Transaction report paginates past 1,000 rows; Excel header was fixed in code | Pass for backend paging; frontend build passes; Excel download needs browser check |
| Order action | Proposal does not call RPC; confirmation calls guarded status RPC | Pass |
| Purchase draft | Exact item/supplier proposal; confirmation calls guarded draft RPC | Pass |
| Role access | Cashier cannot run operations action | Pass |
| Menu request | Free-text action disabled because current approval RPC requires structured item data; Manage Menu link returned | Pass |
| UI and companion | Targeted lint and full Vite build; existing Raimu machine tests | Pass |

`npm test` passes 57 tests. Edge Function TypeScript syntax transforms successfully. `git diff --check` passes.

## Requires deployment or browser verification

- Production still serves an older `support-chat` function. The linked database reports multiple local migrations as unapplied, including `20261005090000_raimu_knowledge.sql`. Reconcile schema history before rollout; do not push all outstanding migrations blindly.
- Knowledge search and role-specific RLS need the migration applied and authenticated admin/staff/cashier checks against that database.
- TXT, CSV, Excel, PDF, and image OCR are included in the frontend build but have not been exercised in a deployed browser in this audit. Scanned PDFs need image pages.
- Provider-generated explanations, drafting, tone, and out-of-scope handling need live provider calls. The linked project lists Groq, Cloudflare, and Gemini provider secrets, but secret presence alone does not prove provider responses.
- Alerts depend on existing notification events and need an end-to-end event in the deployed UI.
- No production data was changed during this audit.

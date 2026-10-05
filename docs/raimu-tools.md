# Raimu store tools

Raimu is an internal assistant for admin, staff, and cashier accounts. The backend reads the signed-in user's role from `profiles`; the role sent by the browser is never used for authorization. Removed users are rejected.

## Knowledge

Apply `supabase/migrations/20261005090000_raimu_knowledge.sql` before deploying the updated `support-chat` function and frontend. Admins can then open **Raimu Knowledge** in the administration sidebar. They may write entries or import TXT, Markdown, CSV, Excel, text-based PDF, JPG, PNG, and WEBP content as a draft. An admin reviews the text, sets the reader roles, and publishes it. Retiring an entry removes it from Raimu's search results.

The table enforces role visibility with Row Level Security. Raimu searches it through a security-invoker Postgres function using the signed-in user's client. The chat shows the source title and excerpt. Live orders, inventory, menu, sales, purchase orders, and pending approvals remain in their original tables and are retrieved on demand, rather than copied into knowledge. This keeps current figures current and avoids indexing private records into the document library. Secrets, API keys, payment proof details, and customer identifiers should not be entered as knowledge.

The migration includes nine published starter guides describing verified portal workflows. They are editable by admins. The live menu ingredient links can answer what ingredients are recorded for an item, but they are not full preparation recipes. Actual recipes, opening and closing routines, and local store policies still need an approved source from the store; Raimu must not invent them.

Full-text search is used; it does not require an embedding provider. Add semantic search only if real staff questions demonstrate that keyword search misses important answers.

## Current tools

- Admin and staff can request active orders, low-stock ingredients and finished products, pending purchase orders, customer concerns, today's paid completed sales, and a shift handover. Direct low-stock, active-order, sales-today, and handover summaries work without an AI provider.
- Admin can get pending menu and benefit approval context, pending refund counts, and selected store configuration. Staff cannot receive those admin-only facts.
- Raimu can read supported files as unverified input in a conversation. Files are extracted in the browser; the extracted text is sent with that one request, not stored in the knowledge table. Admin import is a separate review-and-publish workflow.
- An admin or staff user can ask to mark an exact order number ready, out for delivery, or completed. Raimu presents the change and calls the existing role-checked order status RPC only after the user presses **Confirm update**. The RPC validates the transition.
- Menu changes must be prepared in Manage Menu. Raimu links there when asked to change an item; free-text requests cannot safely create an approval because the approval workflow requires a structured item payload.
- Purchase drafts use `Draft purchase order for 10 Exact Item Name from Exact Supplier Name`. Raimu checks active inventory and the existing supplier, then creates a draft through the existing purchase order RPC after confirmation. Staff review costs and submit it for admin approval on the Purchase Orders page.
- Raimu supplies a link to the relevant page for common topics. Existing notification events also show a brief Raimu message.
- Conversation history is limited to eight recent turns. Closing and clearing the chat resets it.

The existing sales, transaction, inventory, receipt, and report tools remain available. Daily sales support today and yesterday in Philippine time. Generated sales reports contain paid completed or received orders; transaction reports contain all order states. Reports page through records and stop with an explicit error above 10,000 rows. Model-generated responses are instructed to stay on store topics. Each user can choose Friendly or Direct replies; Friendly allows light humor for routine questions but no jokes for complaints, payments, refunds, errors, or urgent issues.

## Deployment and verification

1. Reconcile the linked project's migration history, then apply the Raimu knowledge migration. The linked production project currently reports multiple earlier local migrations as unapplied; do not run a blanket migration push without reviewing that drift.
2. Deploy the updated `support-chat` Edge Function.
3. Deploy the frontend.
4. Sign in as admin to publish a test knowledge entry for admin only, then verify staff cannot retrieve it. Repeat with a staff-visible entry.
5. Test low-stock and shift-handover answers against the actual dashboard, and test an allowed order status transition with a nonproduction order.

Scanned PDFs without selectable text must be uploaded as image pages for OCR. Model responses and the current production database have not been exercised in this local checkout.

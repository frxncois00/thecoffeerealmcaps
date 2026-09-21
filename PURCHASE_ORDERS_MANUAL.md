# Purchase Orders Manual

## Who uses Purchase Orders

- **Staff / Operations:** Create purchase orders, manage suppliers, submit drafts, and record deliveries.
- **Admin:** Review, approve, reject, send, receive, and close purchase orders.

## Purchase order statuses

`Draft → Pending Approval → Approved → Sent → Partially Received → Received → Closed`

Other statuses: `Rejected`, `Disputed`, and `Cancelled`.

## 1. Manage suppliers

1. Open **Purchase Orders**.
2. Select **Suppliers**.
3. Select **Add**.
4. Enter the supplier name and contact number or email.
5. Select the ingredients previously supplied by that supplier.
6. Select **Save Supplier**.

To update a supplier, select the supplier, choose **Edit**, change the details, then select **Save Changes**.

## 2. Create a purchase order

1. Select **Create Purchase Order**.
2. Select a saved supplier.
   - Previously supplied items are added automatically when available.
3. Check or edit the supplier contact.
4. Enter the requested delivery date and reason.
5. Add or remove item lines as needed.
6. For each item, select the ingredient, enter the quantity, and enter the estimated cost.
7. Add notes if needed.
8. Choose one:
   - **Save Draft** — keep editing later.
   - **Submit for Approval** — send the PO to the admin approval queue.

## 3. Review and approve

Admins can open a PO from the Purchase Orders table.

- **Approve:** Moves the PO to Approved.
- **Reject:** Rejects the PO. Add a reason when requested.
- **Edit Draft:** Available for editable draft POs.

## 4. Send to the supplier

1. Open an approved PO.
2. Select **Mark Sent**.
3. Enter the supplier reference, if available.
4. Confirm the action.

## 5. Receive a delivery

1. Open the PO when the delivery arrives.
2. Select **Receive**.
3. For each item, record:
   - Received quantity
   - Accepted quantity
   - Damaged quantity
   - Missing quantity
   - Actual unit cost
   - Batch or lot number
   - Expiration date, when applicable
4. Add receiving notes if needed.
5. Select **Save receiving**.

Only the accepted quantity is added to inventory.

## 6. Handle discrepancies

Use **Partially Received** when some items or quantities are still outstanding.

Use **Disputed** when the delivery has incorrect, damaged, or unacceptable items. Record the issue in the receiving notes and coordinate a return, replacement, or supplier adjustment.

## 7. Close a purchase order

1. Confirm that all ordered items are received and accepted.
2. Open the PO.
3. Select **Close PO**.
4. Add notes if needed and confirm.

Closed POs should not be edited directly. Use an adjustment or correction process when available.

## Quantity definitions

- **Ordered:** Quantity requested from the supplier.
- **Received:** Quantity physically delivered.
- **Accepted:** Quantity that passed inspection and entered inventory.
- **On-hand:** Quantity currently available in inventory.


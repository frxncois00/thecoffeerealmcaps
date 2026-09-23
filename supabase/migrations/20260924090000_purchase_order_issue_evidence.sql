alter table public.purchase_order_documents
  drop constraint if exists purchase_order_documents_document_type_check;

alter table public.purchase_order_documents
  add constraint purchase_order_documents_document_type_check
  check (document_type in ('receiving_proof','supplier_invoice','payment_receipt','issue_evidence'));

notify pgrst, 'reload schema';

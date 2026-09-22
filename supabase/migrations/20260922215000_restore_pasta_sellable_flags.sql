-- Final catalog repair: the pasta recipes are intentionally sellable while
-- opening inventory is being configured. Inventory deductions remain enabled.

update public.menu_items
set is_available = true,
    unavailable_reason = null,
    manual_available = true,
    is_archived = false,
    updated_at = now()
where slug in ('alfredo', 'pesto', 'spicy-peanut', 'mac-and-cheese');

notify pgrst, 'reload schema';

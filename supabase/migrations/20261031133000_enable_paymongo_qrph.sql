insert into public.portal_configuration (scope, key, value, is_public)
values (
  'system',
  'payments',
  jsonb_build_object('enabledMethods', jsonb_build_array('cod', 'gcash', 'bank_transfer', 'qrph')),
  true
)
on conflict (scope, key) do update
set value = jsonb_set(
      coalesce(public.portal_configuration.value, '{}'::jsonb),
      '{enabledMethods}',
      case
        when coalesce(public.portal_configuration.value->'enabledMethods', '[]'::jsonb) ? 'qrph'
          then coalesce(public.portal_configuration.value->'enabledMethods', '[]'::jsonb)
        else coalesce(public.portal_configuration.value->'enabledMethods', '[]'::jsonb) || '"qrph"'::jsonb
      end
    ),
    is_public = true,
    updated_at = now();

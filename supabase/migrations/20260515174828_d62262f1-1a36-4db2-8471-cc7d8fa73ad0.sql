
-- Fix function search_path
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Tighten product-images storage policy: drop the broad SELECT and rely on
-- bucket public flag for direct URL access only (no bucket listing).
drop policy if exists "Public can read product images" on storage.objects;

alter table public.supplement_protocols
  add column barcode text,
  add column product_source text,
  add column product_source_url text,
  add column product_serving text,
  add column product_ingredients text;

alter table public.supplement_protocols
  add constraint supplement_protocols_barcode_check
    check (barcode is null or barcode ~ '^[0-9]{8,14}$'),
  add constraint supplement_protocols_product_source_check
    check (
      (barcode is null and product_source is null)
      or (barcode is not null and char_length(trim(product_source)) > 0)
    ),
  add constraint supplement_protocols_product_metadata_length_check
    check (
      char_length(coalesce(product_source, '')) <= 100
      and char_length(coalesce(product_source_url, '')) <= 1000
      and char_length(coalesce(product_serving, '')) <= 200
      and char_length(coalesce(product_ingredients, '')) <= 4000
    );

create unique index supplement_protocols_user_barcode_idx
  on public.supplement_protocols (user_id, barcode)
  where barcode is not null;

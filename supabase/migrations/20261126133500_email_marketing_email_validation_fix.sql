alter table public.email_marketing_consents
  drop constraint if exists email_marketing_consents_email_normalizado;
alter table public.email_marketing_consents
  add constraint email_marketing_consents_email_normalizado
  check (
    email = lower(btrim(email))
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
  );
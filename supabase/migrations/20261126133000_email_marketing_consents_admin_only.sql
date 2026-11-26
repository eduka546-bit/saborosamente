-- Consentimento explícito dos destinatários de campanhas por e-mail.
-- Sem políticas para anon/authenticated: acesso apenas por operações do servidor.
create table if not exists public.email_marketing_consents (
  email text primary key,
  nome text not null,
  origem text not null,
  consentido_em timestamptz not null default now(),
  registrado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  constraint email_marketing_consents_email_normalizado
    check (email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);
alter table public.email_marketing_consents enable row level security;
revoke all on public.email_marketing_consents from anon, authenticated;
comment on table public.email_marketing_consents is
  'Comprovação de opt-in de e-mail marketing, independente do consentimento de WhatsApp.';

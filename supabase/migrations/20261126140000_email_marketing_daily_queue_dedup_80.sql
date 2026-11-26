alter table public.email_marketing_consents
  add column if not exists revogado_em timestamptz,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();
create unique index if not exists email_marketing_consent_token_idx
  on public.email_marketing_consents (unsubscribe_token);

create table if not exists public.email_marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  assunto text not null,
  previa text not null default '',
  mensagem text not null,
  botao_texto text not null default '',
  botao_url text not null default '',
  imagem_url text not null default '',
  html text not null,
  status text not null default 'draft'
    check (status in ('draft','running','paused','completed')),
  inicia_em timestamptz,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_marketing_dispatches (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.email_marketing_campaigns(id) on delete cascade,
  email text not null,
  nome text not null default '',
  status text not null default 'pending'
    check (status in ('pending','processing','sent','failed','uncertain','cancelled')),
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  claimed_day_utc date,
  sent_at timestamptz,
  resend_message_id text,
  error_message text,
  unique (campaign_id,email),
  constraint email_marketing_dispatches_lowercase check (email=lower(btrim(email)))
);
create index if not exists email_marketing_dispatch_queue_idx
  on public.email_marketing_dispatches (status, campaign_id, id);
create index if not exists email_marketing_dispatch_claimed_idx
  on public.email_marketing_dispatches (claimed_day_utc, status);
create index if not exists email_marketing_dispatch_email_idx
  on public.email_marketing_dispatches (email);

create table if not exists public.email_marketing_daily_usage (
  day_utc date primary key,
  claimed integer not null default 0 check (claimed between 0 and 80),
  updated_at timestamptz not null default now()
);

alter table public.email_marketing_campaigns enable row level security;
alter table public.email_marketing_dispatches enable row level security;
alter table public.email_marketing_daily_usage enable row level security;
revoke all on public.email_marketing_campaigns from anon,authenticated;
revoke all on public.email_marketing_dispatches from anon,authenticated;
revoke all on public.email_marketing_daily_usage from anon,authenticated;

create or replace function public.email_marketing_activate_campaign(p_id uuid, p_start_at timestamptz)
returns integer language plpgsql security definer set search_path=public as $$
declare v_added integer;
begin
  if auth.role() <> 'service_role' then raise exception 'not_authorized'; end if;
  perform pg_advisory_xact_lock(73256102);
  if not exists (select 1 from public.email_marketing_campaigns where id=p_id and status='draft') then
    raise exception 'campaign_must_be_draft';
  end if;

  insert into public.email_marketing_dispatches(campaign_id,email,nome)
  select p_id, c.email, c.nome
    from public.email_marketing_consents c
   where c.revogado_em is null
  on conflict (campaign_id,email) do nothing;
  get diagnostics v_added = row_count;
  if v_added=0 then raise exception 'campaign_has_no_consented_contacts'; end if;

  update public.email_marketing_campaigns
     set status='running', inicia_em=coalesce(p_start_at,now()),updated_at=now()
   where id=p_id;
  return v_added;
end $$;

-- Slot diário é reservado antes de chamar a API externa, em uma transação.
-- Se o provedor não confirmar um envio, não há reenvio automático:
-- o status fica 'uncertain', para impedir duplicidade após timeout.
create or replace function public.email_marketing_claim_batch(p_limit integer)
returns table (
  dispatch_id bigint, campaign_id uuid, email text, nome text,
  assunto text, previa text, mensagem text, html text, unsub_token uuid
) language plpgsql security definer set search_path=public as $$
declare
  v_date date := (now() at time zone 'UTC')::date;
  v_taken integer;
  v_count integer;
begin
  if auth.role() <> 'service_role' then raise exception 'not_authorized'; end if;
  perform pg_advisory_xact_lock(73256103);

  update public.email_marketing_dispatches
     set status='uncertain', error_message='Envio sem confirmação após interrupção. Revisar manualmente.'
   where status='processing' and claimed_at < now()-interval '20 minutes';

  insert into public.email_marketing_daily_usage(day_utc,claimed)
    values(v_date,0) on conflict (day_utc) do nothing;
  select claimed into v_taken from public.email_marketing_daily_usage where day_utc=v_date for update;
  v_count := least(greatest(0,coalesce(p_limit,0)),80-v_taken,10);
  if v_count<=0 then return; end if;

  return query
  with ranked as (
    select d.id, row_number() over(partition by d.campaign_id order by d.id) as row_pos,
           c.created_at as campaign_created
      from public.email_marketing_dispatches d
      join public.email_marketing_campaigns c on c.id=d.campaign_id
      join public.email_marketing_consents k on k.email=d.email
     where d.status='pending' and c.status='running' and c.inicia_em<=now()
       and k.revogado_em is null
  ), picked as (
    select ranked.id from ranked order by row_pos,campaign_created,id limit v_count
  ), claimed as (
    update public.email_marketing_dispatches d
       set status='processing',claimed_at=now(),claimed_day_utc=v_date
      from picked where d.id=picked.id and d.status='pending'
    returning d.*
  )
  select d.id,d.campaign_id,d.email,d.nome,c.assunto,c.previa,c.mensagem,c.html,k.unsubscribe_token
    from claimed d
    join public.email_marketing_campaigns c on c.id=d.campaign_id
    join public.email_marketing_consents k on k.email=d.email;

  get diagnostics v_count = row_count;
  update public.email_marketing_daily_usage
     set claimed=claimed+v_count,updated_at=now() where day_utc=v_date;
end $$;

create or replace function public.email_marketing_finish_complete()
returns integer language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
 if auth.role()<>'service_role' then raise exception 'not_authorized'; end if;
 update public.email_marketing_campaigns c
    set status='completed',updated_at=now()
  where c.status='running'
    and not exists (select 1 from public.email_marketing_dispatches d
                     where d.campaign_id=c.id and d.status in ('pending','processing'));
 get diagnostics v_count=row_count;
 return v_count;
end $$;

revoke all on function public.email_marketing_activate_campaign(uuid,timestamptz) from public,anon,authenticated;
revoke all on function public.email_marketing_claim_batch(integer) from public,anon,authenticated;
revoke all on function public.email_marketing_finish_complete() from public,anon,authenticated;
grant execute on function public.email_marketing_activate_campaign(uuid,timestamptz) to service_role;
grant execute on function public.email_marketing_claim_batch(integer) to service_role;
grant execute on function public.email_marketing_finish_complete() to service_role;

create or replace view public.email_marketing_campaign_stats
with (security_invoker=true) as
select d.campaign_id,
       count(*)::integer as total,
       count(*) filter(where status='pending')::integer as pendentes,
       count(*) filter(where status='processing')::integer as processando,
       count(*) filter(where status='sent')::integer as enviados,
       count(*) filter(where status='failed')::integer as falhas,
       count(*) filter(where status='uncertain')::integer as incertos,
       count(*) filter(where status='cancelled')::integer as cancelados
  from public.email_marketing_dispatches d group by d.campaign_id;
revoke all on public.email_marketing_campaign_stats from anon,authenticated;

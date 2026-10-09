
-- Infraestrutura de leads e interesse na promoção, DESLIGADA por padrão.
-- A ativação depende de regulamento e certificado de autorização SPA/MF.
alter table public.site_settings
  add column if not exists sorteio_ativo boolean not null default false,
  add column if not exists sorteio_regulamento_url text,
  add column if not exists sorteio_certificado text;

alter table public.site_settings
  drop constraint if exists site_settings_sorteio_aprovado_check;
alter table public.site_settings
  add constraint site_settings_sorteio_aprovado_check
  check (
    not sorteio_ativo OR
    (nullif(btrim(sorteio_regulamento_url),'') is not null
      and sorteio_regulamento_url ~* '^https://'
      and nullif(btrim(sorteio_certificado),'') is not null)
  );

create table if not exists public.sorteio_leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 3 and 80),
  telefone text not null unique check (telefone ~ '^[0-9]{10,11}$'),
  session_id text not null,
  status text not null default 'participando'
    check (status in ('participando','contemplado','inativo')),
  optin_marketing boolean not null default false,
  optin_carrinho boolean not null default false,
  aceite_regulamento_em timestamptz not null default now(),
  consentimento_marketing_em timestamptz,
  consentimento_carrinho_em timestamptz,
  contemplado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sorteio_leads_session_idx
  on public.sorteio_leads(session_id,created_at desc);
create index if not exists sorteio_leads_status_idx
  on public.sorteio_leads(status,created_at desc);
alter table public.sorteio_leads enable row level security;
revoke all on public.sorteio_leads from anon, authenticated;
grant select,update,delete on public.sorteio_leads to authenticated;
drop policy if exists sorteio_leads_admin on public.sorteio_leads;
create policy sorteio_leads_admin on public.sorteio_leads
  for all to authenticated
  using (public.has_role((select auth.uid()),'admin'::public.app_role))
  with check (public.has_role((select auth.uid()),'admin'::public.app_role));

create or replace function public.registrar_lead_sorteio(
  p_nome text, p_telefone text, p_session_id text,
  p_aceite_regulamento boolean,
  p_optin_marketing boolean default false,
  p_optin_carrinho boolean default false
)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_nome text := nullif(btrim(coalesce(p_nome,'')),'');
  v_tel text := regexp_replace(coalesce(p_telefone,''), '\D', '', 'g');
  v_id uuid;
begin
  if not exists (
    select 1 from public.site_settings
     where sorteio_ativo=true
       and nullif(btrim(sorteio_certificado),'') is not null
       and sorteio_regulamento_url ~* '^https://'
  ) then
    raise exception 'A inscrição na promoção ainda não está disponível.';
  end if;
  if (select auth.uid()) is not null then
    raise exception 'A promoção é destinada a novos visitantes não cadastrados.';
  end if;
  if p_aceite_regulamento is distinct from true then
    raise exception 'Leia e aceite o regulamento para participar.';
  end if;
  if v_nome is null or char_length(v_nome) not between 3 and 80 or
     v_nome !~ '[[:alpha:]]' then
    raise exception 'Informe seu nome completo.';
  end if;
  if left(v_tel,2)='55' and length(v_tel) in (12,13) then
    v_tel := substring(v_tel from 3);
  end if;
  if length(v_tel) not in (10,11) or v_tel !~ '^[1-9][0-9]{9,10}$' then
    raise exception 'Informe um telefone com DDD válido.';
  end if;
  if p_session_id is null or length(p_session_id) not between 20 and 128
     or p_session_id !~ '^sess_[A-Za-z0-9_-]+$' then
    raise exception 'Sessão inválida. Atualize a página.';
  end if;

  -- Impede novos clientes que já têm compras ou conta (independentemente de DDI).
  -- Resposta indistinguível evita consulta pública ao cadastro de consumidores.
  if exists (
    select 1 from public.profiles p
    where right(regexp_replace(coalesce(p.telefone,''),'\D','','g'),length(v_tel))=v_tel
  ) or exists (
    select 1 from public.pedidos p
    where right(regexp_replace(coalesce(p.telefone_cliente,''),'\D','','g'),length(v_tel))=v_tel
       or right(regexp_replace(coalesce(p.cliente_telefone,''),'\D','','g'),length(v_tel))=v_tel
  ) then
    return 'recebido';
  end if;

  -- Uma inscrição por telefone, sem renovações mensais; contemplados jamais são reativados.
  insert into public.sorteio_leads (
    nome,telefone,session_id,optin_marketing,optin_carrinho,
    consentimento_marketing_em,consentimento_carrinho_em
  ) values (
    v_nome,v_tel,p_session_id,coalesce(p_optin_marketing,false),coalesce(p_optin_carrinho,false),
    case when p_optin_marketing then now() else null end,
    case when p_optin_carrinho then now() else null end
  )
  on conflict (telefone) do nothing
  returning id into v_id;

  if v_id is not null then
    -- Carrinho aberto antes do cadastro: associa somente visitante anônimo.
    update public.carrinhos_abandonados c
    set nome=coalesce(nullif(c.nome,''),v_nome),
        telefone=coalesce(nullif(c.telefone,''),v_tel),
        recuperacao_whatsapp_consentimento=coalesce(c.recuperacao_whatsapp_consentimento,false)
          or coalesce(p_optin_carrinho,false),
        recuperacao_whatsapp_consentido_em=
          case when p_optin_carrinho
            then coalesce(c.recuperacao_whatsapp_consentido_em,now())
            else c.recuperacao_whatsapp_consentido_em end,
        lead_capturado_em=coalesce(c.lead_capturado_em,now()),
        updated_at=now()
    where c.session_id=p_session_id and c.user_id is null and c.status='abandonado';
  end if;

  return 'recebido';
end;
$function$;
revoke all on function public.registrar_lead_sorteio(text,text,text,boolean,boolean,boolean)
  from public,anon,authenticated;
grant execute on function public.registrar_lead_sorteio(text,text,text,boolean,boolean,boolean)
  to anon, authenticated;

-- Associação automática dos futuros snapshots anônimos com lead do sorteio.
-- Consentimento promocional NÃO equivale a consentimento de recuperação.
create or replace function public.enriquecer_carrinho_com_lead_sorteio()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare v_lead record;
begin
  if new.user_id is not null or new.status <> 'abandonado' then return new; end if;
  select nome,telefone,optin_carrinho
    into v_lead
    from public.sorteio_leads
   where session_id=new.session_id and status='participando'
   order by created_at desc
   limit 1;
  if not found then return new; end if;
  new.nome := coalesce(nullif(btrim(new.nome),''),v_lead.nome);
  new.telefone := coalesce(nullif(btrim(new.telefone),''),v_lead.telefone);
  new.lead_capturado_em := coalesce(new.lead_capturado_em,now());
  if v_lead.optin_carrinho then
    new.recuperacao_whatsapp_consentimento := true;
    new.recuperacao_whatsapp_consentido_em :=
      coalesce(new.recuperacao_whatsapp_consentido_em,now());
  end if;
  return new;
end;
$function$;
drop trigger if exists trg_enriquecer_carrinho_com_lead_sorteio on public.carrinhos_abandonados;
create trigger trg_enriquecer_carrinho_com_lead_sorteio
  before insert or update on public.carrinhos_abandonados
  for each row execute function public.enriquecer_carrinho_com_lead_sorteio();

-- Página pública só conhece a configuração da promoção, nunca os cadastros.
CREATE OR REPLACE FUNCTION public.site_settings_publicos()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select jsonb_build_object(
    'announcement_text', s.announcement_text,
    'announcement_bg_color', s.announcement_bg_color,
    'announcement_text_color', s.announcement_text_color,
    'nav_bg_color', s.nav_bg_color,
    'nav_text_color', s.nav_text_color,
    'hero_image_url', s.hero_image_url,
    'profile_image_url', s.profile_image_url,
    'hero_features', s.hero_features,
    'promo_banners', s.promo_banners,
    'payment_methods', s.payment_methods,
    'card_flags', s.card_flags,
    'meal_flags', s.meal_flags,
    'logo_url', s.logo_url,
    'banner_url', s.banner_url,
    'banner_link', s.banner_link,
    'whatsapp', s.whatsapp,
    'instagram', s.instagram,
    'endereco', s.endereco,
    'maps_url', s.maps_url,
    'footer_logo_url', s.footer_logo_url,
    'footer_whatsapp', s.footer_whatsapp,
    'footer_instagram', s.footer_instagram,
    'footer_address_line1', s.footer_address_line1,
    'footer_address_line2', s.footer_address_line2,
    'footer_address_cep', s.footer_address_cep,
    'footer_maps_url', s.footer_maps_url,
    'footer_description', s.footer_description,
    'footer_credit', s.footer_credit,
    'exit_intent_discount', s.exit_intent_discount,
    'cashback_percentual', s.cashback_percentual,
    'cashback_validade_dias', s.cashback_validade_dias,
    'cashback_minimo_uso', s.cashback_minimo_uso,
    'cashback_limite_desconto_pct', s.cashback_limite_desconto_pct,
    'cashback_ativo', s.cashback_ativo,
    'contato_whatsapp', s.contato_whatsapp,
    'contato_instagram', s.contato_instagram,
    'contato_email', s.contato_email,
    'contato_whatsapp_humano', s.contato_whatsapp_humano,
    'popup_boas_vindas', s.popup_boas_vindas,
    'sorteio_ativo', (coalesce(s.sorteio_ativo,false) AND nullif(s.sorteio_regulamento_url,'') is not null AND nullif(s.sorteio_certificado,'') is not null),
    'sorteio_regulamento_url', s.sorteio_regulamento_url,
    'horarios_funcionamento', s.horarios_funcionamento,
    'avisos_informativos', s.avisos_informativos,
    'parametros_loja', jsonb_build_object(
      'precos_marmita', s.parametros_loja->'precos_marmita',
      'acrescimos', s.parametros_loja->'acrescimos',
      'entrega', s.parametros_loja->'entrega',
      'marmita_personalizada', s.parametros_loja->'marmita_personalizada',
      'google_analytics_ativo', coalesce(s.parametros_loja->'google_analytics_ativo', 'false'::jsonb),
      'google_analytics_id', coalesce(s.parametros_loja->'google_analytics_id', '""'::jsonb)
    )
  )
  from public.site_settings s
  limit 1;
$function$


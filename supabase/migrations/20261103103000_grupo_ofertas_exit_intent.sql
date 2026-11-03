-- Novo convite de saída: WhatsApp para Grupo de Ofertas, sem cupons.
-- Reutiliza cadastro e consentimento existentes; telefone é chave única, sem duplicatas.
alter table public.whatsapp_ofertas_optins
  drop constraint if exists whatsapp_ofertas_optins_origem_check;
alter table public.whatsapp_ofertas_optins
  add constraint whatsapp_ofertas_optins_origem_check
  check (origem in ('carrinho','grupo_ofertas'));

create or replace function public.registrar_whatsapp_grupo_ofertas(
  p_telefone text, p_session_id text, p_nome text default null, p_aceite boolean default false
)
returns text
language plpgsql security definer set search_path = ''
as $func$
declare
  v_telefone text := regexp_replace(coalesce(p_telefone,''),'[^0-9]','','g');
  v_session text := btrim(coalesce(p_session_id,''));
  v_nome text := nullif(left(btrim(coalesce(p_nome,'')),80),'');
begin
  if p_aceite is distinct from true then
    raise exception 'É necessário aceitar o recebimento de informações pelo WhatsApp' using errcode='22023';
  end if;
  if left(v_telefone,2)='55' and length(v_telefone) in (12,13) then
    v_telefone := substr(v_telefone,3);
  end if;
  if v_telefone !~ '^[0-9]{10,11}$' then
    raise exception 'Informe WhatsApp válido com DDD' using errcode='22023';
  end if;
  if length(v_session) not between 16 and 100 or v_session !~ '^sess_[A-Za-z0-9_-]+$' then
    raise exception 'Sessão inválida' using errcode='22023';
  end if;

  insert into public.whatsapp_ofertas_optins
    (telefone,nome,session_id,consentimento,consentido_em,revogado_em,origem)
  values (v_telefone,v_nome,v_session,true,now(),null,'grupo_ofertas')
  on conflict (telefone) do update set
    nome=coalesce(excluded.nome,public.whatsapp_ofertas_optins.nome),
    session_id=excluded.session_id,
    consentimento=true,
    consentido_em=now(),
    revogado_em=null,
    origem='grupo_ofertas',
    atualizado_em=now();
  return 'registrado';
end
$func$;
revoke all on function public.registrar_whatsapp_grupo_ofertas(text,text,text,boolean) from public,anon,authenticated;
grant execute on function public.registrar_whatsapp_grupo_ofertas(text,text,text,boolean) to anon,authenticated;

create or replace function public.listar_whatsapp_cadastros_com_origem_admin()
returns table(telefone text,nome text,consentimento boolean,cadastrado_em timestamptz,origem text)
language plpgsql security definer set search_path = ''
as $func$
begin
  if not public.has_role((select auth.uid()), 'admin'::public.app_role) then
    raise exception 'Acesso administrativo obrigatório' using errcode='42501';
  end if;
  return query
  select o.telefone, nullif(btrim(o.nome),'')::text, o.consentimento,
         o.criado_em, o.origem
  from public.whatsapp_ofertas_optins o
  order by o.criado_em desc limit 10000;
end
$func$;
revoke all on function public.listar_whatsapp_cadastros_com_origem_admin() from public,anon,authenticated;
grant execute on function public.listar_whatsapp_cadastros_com_origem_admin() to authenticated;

-- A promoção de saída deixou de existir: desativa SOMENTE cupons gerados automaticamente.
-- Preserva VOLTAPRAMIM, outros cupons de campanha e o histórico dos carrinhos.
update public.cupons
set ativo=false
where ativo=true
  and codigo ~ '^VOLTA[0-9A-F]{6}$'
  and regra ilike '%carrinho abandonado%';

-- Impede novos cupons de saída até mesmo por chamadas RPC antigas.
revoke execute on function public.issue_abandoned_cart_coupon(text) from public,anon,authenticated;

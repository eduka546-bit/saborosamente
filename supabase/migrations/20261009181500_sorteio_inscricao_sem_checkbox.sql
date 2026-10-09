CREATE OR REPLACE FUNCTION public.registrar_lead_sorteio(p_nome text, p_telefone text, p_session_id text, p_aceite_regulamento boolean, p_optin_marketing boolean DEFAULT false, p_optin_carrinho boolean DEFAULT false)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_nome text := nullif(btrim(coalesce(p_nome,'')),'');
  v_tel text := regexp_replace(coalesce(p_telefone,''), '\D', '', 'g');
  v_id uuid;
begin
  if not exists (
    select 1 from public.site_settings
     where sorteio_ativo=true
  ) then
    raise exception 'A inscrição na promoção ainda não está disponível.';
  end if;
  if (select auth.uid()) is not null then
    raise exception 'A promoção é destinada a novos visitantes não cadastrados.';
  end if;
  -- A inscrição explícita pelo botão substitui o checkbox de ciência.
  -- Nunca pressupõe autorização para campanhas ou recuperação de carrinho.
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
$function$
;

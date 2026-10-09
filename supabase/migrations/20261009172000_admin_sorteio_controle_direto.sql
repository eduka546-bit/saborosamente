-- Permite ao administrador habilitar a campanha; a empresa é responsável por suas obrigações.
alter table public.site_settings drop constraint if exists site_settings_sorteio_aprovado_check;

CREATE OR REPLACE FUNCTION public.atualizar_sorteio_config_admin(p_ativo boolean, p_regulamento_url text, p_certificado text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if not public.has_role((select auth.uid()),'admin'::public.app_role) then
    raise exception 'Acesso administrativo obrigatório' using errcode='42501';
  end if;
  update public.site_settings set
    sorteio_ativo=coalesce(p_ativo,false),
    sorteio_regulamento_url=nullif(btrim(left(coalesce(p_regulamento_url,''),1024)),''),
    sorteio_certificado=nullif(btrim(left(coalesce(p_certificado,''),200)),''),
    updated_at=now();
  return public.sorteio_config_admin();
end;
$function$
;

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
$function$
;

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
    'sorteio_ativo', coalesce(s.sorteio_ativo,false),
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
;

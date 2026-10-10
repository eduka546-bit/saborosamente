-- A autorização mais recente do participante deve chegar ao carrinho ativo.
-- Um aceite no sorteio pode substituir uma recusa anterior, e uma revogação no checkout
-- deve continuar prevalecendo após novas atualizações/visitas do carrinho.
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
  -- Confirmação obrigatória do regulamento, verificada no banco.
  if p_aceite_regulamento is distinct from true then
    raise exception 'Aceite o regulamento do sorteio para participar.' using errcode='22023';
  end if;
  -- Os indicadores p_optin_* preservam expressamente o aceite informado no formulário.
  -- Apenas novas inscrições registram novos consentimentos, não retroagindo a cadastros antigos.
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

  -- Uma inscrição por telefone, sem renovações mensais; contemplados jamais são reativados.
  insert into public.sorteio_leads (
    nome,telefone,session_id,user_id,optin_marketing,optin_carrinho,
    consentimento_marketing_em,consentimento_carrinho_em
  ) values (
    v_nome,v_tel,p_session_id,(select auth.uid()),coalesce(p_optin_marketing,false),coalesce(p_optin_carrinho,false),
    case when p_optin_marketing then now() else null end,
    case when p_optin_carrinho then now() else null end
  )
  on conflict (telefone) do nothing
  returning id into v_id;

  if v_id is null then
    return 'ja_participando';
  end if;

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
    where c.session_id=p_session_id and (c.user_id is null or c.user_id=(select auth.uid())) and c.status in ('em_andamento','abandonado');
  end if;

  return 'recebido';
end;
$function$;

CREATE OR REPLACE FUNCTION public.enriquecer_carrinho_com_lead_sorteio()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_lead record;
begin
 if new.status not in ('abandonado','em_andamento') or new.lead_capturado_em is not null then return new; end if;
 select l.nome,l.telefone,l.optin_carrinho into v_lead
 from public.sorteio_leads l
 where (l.session_id=new.session_id or (new.user_id is not null and l.user_id=new.user_id))
 order by case when l.session_id=new.session_id then 0 else 1 end, l.created_at desc limit 1;
 if not found then return new; end if;
 new.nome:=coalesce(nullif(btrim(new.nome),''),v_lead.nome);
 new.telefone:=coalesce(nullif(btrim(new.telefone),''),v_lead.telefone);
 new.lead_capturado_em:=now();
 -- Nao sobrepoe uma revogacao explicita registrada previamente.
 if v_lead.optin_carrinho and new.recuperacao_whatsapp_consentido_em is null then
   new.recuperacao_whatsapp_consentimento:=true;
   new.recuperacao_whatsapp_consentido_em:=now();
 end if;
 return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.capture_checkout_recovery_lead(p_session_id text, p_nome text, p_telefone text, p_email text, p_itens jsonb, p_valor_total numeric, p_consent boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_id uuid;
  v_user_id uuid := (select auth.uid());
  v_nome text := nullif(btrim(p_nome), '');
  v_telefone text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_email text := lower(nullif(btrim(p_email), ''));
begin
  if p_session_id is null
     or length(p_session_id) not between 20 and 128
     or p_session_id !~ '^sess_[A-Za-z0-9_-]+$' then
    raise exception 'Sessão inválida' using errcode='22023';
  end if;

  if p_consent is not true then
    update public.carrinhos_abandonados
       set recuperacao_whatsapp_consentimento=false,
           recuperacao_whatsapp_consentido_em=null,
           updated_at=now()
     where id=(
       select c.id
       from public.carrinhos_abandonados c
       where c.session_id=p_session_id
         and (c.user_id is null or c.user_id=v_user_id)
       order by c.updated_at desc nulls last,c.created_at desc
       limit 1
     )
    returning id into v_id;
    -- A recusa mais recente do titular substitui qualquer aceite do sorteio.
    update public.sorteio_leads
       set optin_carrinho=false, consentimento_carrinho_em=null
     where session_id=p_session_id and optin_carrinho=true;
    return v_id;
  end if;

  if v_nome is null or length(v_nome) not between 3 and 80 then
    raise exception 'Nome inválido' using errcode='22023';
  end if;

  if length(v_telefone) not between 10 and 13 then
    raise exception 'Telefone inválido' using errcode='22023';
  end if;

  if v_email is null
     or length(v_email) > 120
     or v_email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'E-mail inválido' using errcode='22023';
  end if;

  if p_itens is null
     or jsonb_typeof(p_itens) <> 'array'
     or jsonb_array_length(p_itens)=0
     or jsonb_array_length(p_itens) > 100
     or octet_length(p_itens::text) > 65536 then
    raise exception 'Itens inválidos' using errcode='22023';
  end if;

  if p_valor_total is null or p_valor_total < 0 or p_valor_total > 100000 then
    raise exception 'Valor inválido' using errcode='22023';
  end if;

  select c.id into v_id
  from public.carrinhos_abandonados c
  where c.session_id=p_session_id
    and (c.user_id is null or c.user_id=v_user_id)
  order by c.updated_at desc nulls last,c.created_at desc
  limit 1;

  if v_id is null then
    insert into public.carrinhos_abandonados(
      session_id,user_id,nome,telefone,email,itens,valor_total,status,origem,
      recuperacao_whatsapp_consentimento,recuperacao_whatsapp_consentido_em,
      lead_capturado_em,updated_at
    )
    values(
      p_session_id,v_user_id,v_nome,v_telefone,v_email,p_itens,p_valor_total,
      'abandonado','checkout',true,now(),now(),now()
    )
    returning id into v_id;
  else
    update public.carrinhos_abandonados
       set user_id=coalesce(v_user_id,user_id),
           nome=v_nome,
           telefone=v_telefone,
           email=v_email,
           itens=p_itens,
           valor_total=p_valor_total,
           status='abandonado',
           origem='checkout',
           recuperacao_whatsapp_consentimento=true,
           recuperacao_whatsapp_consentido_em=coalesce(recuperacao_whatsapp_consentido_em,now()),
           lead_capturado_em=coalesce(lead_capturado_em,now()),
           updated_at=now()
     where id=v_id;
  end if;

  -- Se marcou novamente o checkbox no checkout, registra a nova autorização.
  update public.sorteio_leads
     set optin_carrinho=true,
         consentimento_carrinho_em=coalesce(consentimento_carrinho_em,now())
   where session_id=p_session_id;

  return v_id;
end;
$function$;

alter table public.carrinhos_abandonados
  add column if not exists recuperacao_whatsapp_consentimento boolean not null default false,
  add column if not exists recuperacao_whatsapp_consentido_em timestamptz,
  add column if not exists lead_capturado_em timestamptz;

create or replace function public.capture_checkout_recovery_lead(
  p_session_id text,
  p_nome text,
  p_telefone text,
  p_email text,
  p_itens jsonb,
  p_valor_total numeric,
  p_consent boolean
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
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

  return v_id;
end;
$function$;

revoke all on function public.capture_checkout_recovery_lead(text,text,text,text,jsonb,numeric,boolean)
  from public, anon, authenticated, service_role;
grant execute on function public.capture_checkout_recovery_lead(text,text,text,text,jsonb,numeric,boolean)
  to anon, authenticated, service_role;

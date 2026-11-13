-- A mesma sessão deve atualizar um único rascunho ativo, inclusive quando
-- dois eventos do navegador chegam ao banco ao mesmo tempo.
create or replace function public.save_abandoned_cart(
  p_session_id text,
  p_itens jsonb,
  p_valor_total numeric,
  p_origem text default 'timeout'
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_id uuid;
  v_user_id uuid := (select auth.uid());
  v_email text := nullif((select auth.jwt() ->> 'email'), '');
  v_nome text;
  v_telefone text;
  v_status text := case when p_origem = 'exit_intent' then 'abandonado' else 'em_andamento' end;
begin
  if p_session_id is null or length(p_session_id) not between 20 and 128 or p_session_id !~ '^sess_[A-Za-z0-9_-]+$' then
    raise exception 'Sessão inválida' using errcode = '22023';
  end if;
  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) not between 1 and 100 or octet_length(p_itens::text) > 65536 then
    raise exception 'Itens inválidos' using errcode = '22023';
  end if;
  if p_valor_total is null or p_valor_total < 0 or p_valor_total > 100000 then
    raise exception 'Valor inválido' using errcode = '22023';
  end if;
  if p_origem not in ('timeout','exit_intent','manual') then
    raise exception 'Origem inválida' using errcode = '22023';
  end if;

  -- Serializa os saves de uma mesma sessão e elimina a janela de corrida entre
  -- o autosave, a saída de página e as interações rápidas do cliente.
  perform pg_advisory_xact_lock(hashtext(p_session_id));

  if v_user_id is not null then
    select nullif(btrim(p.nome),''), nullif(btrim(p.telefone),'')
      into v_nome,v_telefone
      from public.profiles p where p.id=v_user_id limit 1;
  end if;

  select c.id into v_id
    from public.carrinhos_abandonados c
   where c.session_id=p_session_id
     and (c.user_id is null or c.user_id=v_user_id)
     and c.status in ('em_andamento','abandonado','recuperado')
   order by c.updated_at desc nulls last, c.created_at desc
   limit 1;

  if v_id is null then
    insert into public.carrinhos_abandonados
      (session_id,user_id,nome,telefone,email,itens,valor_total,status,origem,updated_at)
    values
      (p_session_id,v_user_id,v_nome,v_telefone,v_email,p_itens,p_valor_total,v_status,p_origem,now())
    returning id into v_id;
  else
    update public.carrinhos_abandonados
       set user_id=coalesce(v_user_id,user_id),
           nome=coalesce(v_nome,nome),
           telefone=coalesce(v_telefone,telefone),
           email=coalesce(v_email,email),
           itens=p_itens,valor_total=p_valor_total,status=v_status,origem=p_origem,updated_at=now()
     where id=v_id;
  end if;
  return v_id;
end;
$$;

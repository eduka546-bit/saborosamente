-- Registro antecipado do carrinho e abandono automático por 10 min sem atividade.
-- Estados novos: em_andamento, esvaziado. Históricos anteriores não são reclassificados.
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
  if p_session_id is null
     or length(p_session_id) not between 20 and 128
     or p_session_id !~ '^sess_[A-Za-z0-9_-]+$' then
    raise exception 'Sessão inválida' using errcode = '22023';
  end if;
  if p_itens is null
     or jsonb_typeof(p_itens) <> 'array'
     or jsonb_array_length(p_itens) not between 1 and 100
     or octet_length(p_itens::text) > 65536 then
    raise exception 'Itens inválidos' using errcode = '22023';
  end if;
  if p_valor_total is null or p_valor_total < 0 or p_valor_total > 100000 then
    raise exception 'Valor inválido' using errcode = '22023';
  end if;
  if p_origem not in ('timeout','exit_intent','manual') then
    raise exception 'Origem inválida' using errcode = '22023';
  end if;

  if v_user_id is not null then
    select nullif(btrim(p.nome),''), nullif(btrim(p.telefone),'')
      into v_nome,v_telefone
    from public.profiles p where p.id=v_user_id limit 1;
  end if;

  -- Nunca sobrescrever uma conversão já concluída, nem reabrir carrinhos
  -- antigos com o mesmo ID persistido no navegador.
  select c.id into v_id
    from public.carrinhos_abandonados c
   where c.session_id=p_session_id
     and (c.user_id is null or c.user_id=v_user_id)
     and c.status in ('em_andamento','abandonado','recuperado')
     and c.updated_at >= now() - interval '24 hours'
   order by c.updated_at desc nulls last, c.created_at desc
   limit 1;

  if v_id is null then
    insert into public.carrinhos_abandonados
      (session_id,user_id,nome,telefone,email,itens,valor_total,status,origem,updated_at)
    values
      (p_session_id,v_user_id,v_nome,v_telefone,v_email,p_itens,p_valor_total,
       v_status,p_origem,now())
    returning id into v_id;
  else
    update public.carrinhos_abandonados
       set user_id=coalesce(v_user_id,user_id),
           nome=coalesce(v_nome,nome),
           telefone=coalesce(v_telefone,telefone),
           email=coalesce(v_email,email),
           itens=p_itens,valor_total=p_valor_total,
           status=v_status,origem=p_origem,updated_at=now()
     where id=v_id;
  end if;
  return v_id;
end;
$$;

create or replace function public.update_abandoned_cart_state(
  p_session_id text,
  p_status text default null,
  p_cupom_oferta text default null,
  p_origem text default null
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_updated integer;
begin
  if p_session_id is null
     or length(p_session_id) not between 20 and 128
     or p_session_id !~ '^sess_[A-Za-z0-9_-]+$' then
    raise exception 'Sessão inválida' using errcode='22023';
  end if;
  if p_status is not null and p_status not in ('abandonado','convertido','esvaziado') then
    raise exception 'Status inválido' using errcode='22023';
  end if;
  if p_cupom_oferta is not null and p_cupom_oferta !~ '^VOLTA[A-Z0-9]{4,6}$' then
    raise exception 'Cupom inválido' using errcode='22023';
  end if;
  if p_origem is not null and p_origem not in ('timeout','exit_intent','manual') then
    raise exception 'Origem inválida' using errcode='22023';
  end if;

  update public.carrinhos_abandonados
     set status = coalesce(p_status,status),
         convertido_em = case when p_status='convertido' then now() else convertido_em end,
         cupom_oferta=coalesce(p_cupom_oferta,cupom_oferta),
         origem=coalesce(p_origem,origem),
         updated_at=now()
   where id = (
     select c.id
       from public.carrinhos_abandonados c
      where c.session_id=p_session_id
        and (c.user_id is null or c.user_id=v_user_id)
        and (p_status <> 'esvaziado' or c.status in ('em_andamento','abandonado'))
      order by c.updated_at desc nulls last,c.created_at desc
      limit 1
   );
  get diagnostics v_updated=row_count;
  return v_updated=1;
end;
$$;

-- PG Cron roda no servidor mesmo quando ninguém está no painel administrativo.
-- Atualiza somente os rascunhos criados com o novo processo.
select cron.schedule(
  'saborosamente_abandono_carrinho_10min',
  '* * * * *',
  $job$
    update public.carrinhos_abandonados
       set status='abandonado'
     where status='em_andamento'
       and updated_at <= now()-interval '10 minutes'
       and valor_total>0
       and jsonb_array_length(itens)>0;
  $job$
);

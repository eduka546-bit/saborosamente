-- Revisao pre-lancamento: WhatsApp, seguranca e crons.
-- Aplicada primeiro em producao e versionada aqui para manter o repositorio alinhado.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'pedidos10-polling') then
    perform cron.unschedule('pedidos10-polling');
  end if;

  if exists (select 1 from cron.job where jobname = 'cleanup-orphaned-data-daily')
     and to_regprocedure('public.cleanup_all_orphaned_data()') is null then
    perform cron.unschedule('cleanup-orphaned-data-daily');
  end if;
end $$;

alter table public.campanhas_whatsapp_envios
  drop constraint if exists campanhas_whatsapp_envios_status_check;

alter table public.campanhas_whatsapp_envios
  add constraint campanhas_whatsapp_envios_status_check
  check (
    status = any (
      array[
        'pendente'::text,
        'enviado'::text,
        'entregue'::text,
        'lido'::text,
        'falhou'::text,
        'bloqueado'::text
      ]
    )
  );

alter view public.vw_vendas_produto_30d set (security_invoker = true);
revoke all on public.vw_vendas_produto_30d from anon, authenticated;

create or replace function public.funil_analytics(p_dias integer default 30)
returns table(evento text, eventos bigint, sessoes bigint)
language sql
stable
security definer
set search_path to 'public','pg_temp'
as $function$
  select a.evento, count(*)::bigint, count(distinct a.session_id)::bigint
  from public.analytics_eventos a
  where public.usuario_tem_role(array['admin'])
    and a.created_at >= now() - make_interval(days => greatest(1,least(coalesce(p_dias,30),365)))
    and a.evento in ('product_view','size_select','add_to_cart','cart_view','checkout_start','purchase','restock_request','product_share')
  group by a.evento
  order by case a.evento
    when 'product_view' then 1
    when 'size_select' then 2
    when 'add_to_cart' then 3
    when 'cart_view' then 4
    when 'checkout_start' then 5
    when 'purchase' then 6
    when 'restock_request' then 7
    when 'product_share' then 8
    else 99 end;
$function$;

create or replace function public.ab_test_resultados(p_experimento text, p_dias integer default 30)
returns table(variante text, exposicoes bigint, adicoes bigint, compras bigint)
language sql
stable
security definer
set search_path to 'public','pg_temp'
as $function$
  with exposicoes as (
    select session_id, metadata->>'variante' variante
    from public.analytics_eventos
    where public.usuario_tem_role(array['admin'])
      and evento='experiment_exposure'
      and metadata->>'experimento'=p_experimento
      and created_at >= now()-make_interval(days=>greatest(1,least(coalesce(p_dias,30),365)))
  ),
  sess as (
    select e.variante,e.session_id,
      exists(select 1 from public.analytics_eventos a where a.session_id=e.session_id and a.evento='add_to_cart') adicionou,
      exists(select 1 from public.analytics_eventos a where a.session_id=e.session_id and a.evento='purchase') comprou
    from exposicoes e
  )
  select variante,count(distinct session_id)::bigint,
         count(distinct session_id) filter(where adicionou)::bigint,
         count(distinct session_id) filter(where comprou)::bigint
  from sess
  where variante is not null
  group by variante
  order by variante;
$function$;

create or replace function public.demanda_reposicao()
returns table(produto_id uuid, nome text, gramatura text, interessados bigint, mais_antigo timestamp with time zone)
language sql
stable
security definer
set search_path to 'public','pg_temp'
as $function$
  select a.produto_id,p.nome,coalesce(a.gramatura,'')::text,count(*)::bigint,min(a.created_at)
  from public.alertas_reposicao a
  join public.produtos p on p.id=a.produto_id
  where public.usuario_tem_role(array['admin','cozinha'])
    and a.status='aguardando'
  group by a.produto_id,p.nome,coalesce(a.gramatura,'')
  order by count(*) desc,min(a.created_at);
$function$;

revoke execute on function public.ab_test_resultados(text, integer) from anon;
revoke execute on function public.alertas_reposicao_prontos() from anon;
revoke execute on function public.cozinha_atualizar_cardapio_produto(uuid, text, text, text) from anon;
revoke execute on function public.cozinha_atualizar_nutricao_cardapio(uuid, integer, jsonb, jsonb) from anon;
revoke execute on function public.demanda_reposicao() from anon;
revoke execute on function public.funil_analytics(integer) from anon;
revoke execute on function public.inteligencia_estoque() from anon;
revoke execute on function public.regerar_fila_recompra() from anon;
revoke execute on function public.segmentos_clientes() from anon;
revoke execute on function public.usuario_tem_role(text[]) from anon;

revoke execute on function public.sync_etiqueta_nutricao_para_produto() from anon, authenticated;
revoke execute on function public.sync_produto_nutricao_para_etiquetas() from anon, authenticated;

-- Refinamento de métricas: um identificador pode visitar muitas vezes.
-- "Visita estimada" inicia após 30 minutos sem visualizar páginas.
-- "Clientes autenticados" conta IDs de usuários, sem expor dados pessoais.
create or replace function public.relatorio_comportamento_site(p_dias integer default 30)
returns jsonb
language plpgsql stable security definer
set search_path to ''
as $$
declare
  v_dias integer := greatest(1,least(coalesce(p_dias,30),90));
  resultado jsonb;
begin
  if not public.usuario_tem_role(array['admin']) then
    raise exception 'Acesso restrito a administradores' using errcode='42501';
  end if;

  with base as materialized (
    select session_id, user_id, evento, created_at, produto_id,
           coalesce(nullif(left(metadata->>'pathname',120),''),
                    nullif(left(metadata->>'path',120),''),
                    '/') as caminho,
           lower(coalesce(left(metadata->>'label',90),'')) as rotulo,
           coalesce(nullif(left(metadata->>'origem',60),''),'') as origem
    from public.analytics_eventos
    where created_at >= now() - make_interval(days => v_dias)
  ), classificacao as (
    select *,
      case
        when evento <> 'ui_click' then null
        when rotulo like '%abrir carrinho%' then 'Abrir carrinho'
        when rotulo like '%adicionar ao carrinho%' or rotulo like '%adicionar ao pedido%' then 'Adicionar ao carrinho'
        when rotulo like '%finalizar compra%' or rotulo like '%ir para o checkout%' then 'Finalizar compra'
        when rotulo like '%montar combo%' then 'Montar combo'
        when rotulo like '%ver combos%' then 'Ver combos'
        when rotulo like '%próximo banner%' or rotulo like '%proximo banner%' then 'Próximo banner'
        when rotulo like '%banner anterior%' then 'Banner anterior'
        when rotulo like '%áreas de entrega%' or rotulo like '%areas de entrega%' then 'Áreas de entrega'
        when rotulo like '%participar do sorteio%' or rotulo like '%quero participar%' then 'Participar do sorteio'
        when rotulo like '%entrar ou criar conta%' then 'Entrar ou criar conta'
        when rotulo like '%aumentar quantidade%' then 'Aumentar quantidade'
        when rotulo like '%diminuir quantidade%' then 'Diminuir quantidade'
        when rotulo like '%abrir minha conta%' then 'Abrir minha conta'
        when rotulo like '%fale conosco%' then 'Fale conosco'
        when rotulo like '%aplicar%' then 'Aplicar cupom'
        else null
      end as acao
    from base
  )
  select jsonb_build_object(
    'periodo_dias', v_dias,
    'primeiro_registro', (select min(created_at) from base),
    'visualizacoes_pagina', (select count(*) from base where evento='page_view'),
    'navegadores_identificados', (select count(distinct session_id) from base where evento='page_view'),
    'clientes_autenticados', (select count(distinct user_id) from base where evento='page_view' and user_id is not null),
    'visitas_estimadas', (
      select count(*) from (
        select created_at,
               lag(created_at) over(partition by session_id order by created_at) as anterior
        from base where evento='page_view'
      ) navegações
      where anterior is null or created_at - anterior > interval '30 minutes'
    ),
    'ativos_5min', (select count(distinct session_id) from base where created_at>=now()-interval '5 minutes'),
    'eventos_total', (select count(*) from base),
    'funil', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.ordem),'[]'::jsonb)
      from (
        select posicao.ordem, posicao.evento, coalesce(est.eventos,0)::bigint as eventos,
               coalesce(est.navegadores,0)::bigint as navegadores
        from (values (1,'page_view'),(2,'product_view'),(3,'add_to_cart'),(4,'cart_view'),
                     (5,'checkout_start'),(6,'purchase')) as posicao(ordem,evento)
        left join (
          select evento, count(*) eventos,count(distinct session_id) navegadores
          from base group by evento
        ) est on est.evento=posicao.evento
      ) t
    ),
    'paginas', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.acessos desc),'[]'::jsonb)
      from (
        select regexp_replace(caminho,'/[0-9a-f]{8}-[0-9a-f-]{27,}', '/:id','gi') as pagina,
               count(*)::bigint acessos,count(distinct session_id)::bigint navegadores
        from base where evento='page_view'
          and caminho not like '/admin%' and caminho not like '/cozinha%'
        group by 1 order by acessos desc limit 12
      ) t
    ),
    'cliques', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.cliques desc),'[]'::jsonb)
      from (
        select acao, count(*)::bigint cliques,count(distinct session_id)::bigint navegadores
        from classificacao where acao is not null
        group by acao order by cliques desc limit 12
      ) t
    ),
    'diario', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.dia),'[]'::jsonb)
      from (
        select to_char(created_at at time zone 'America/Sao_Paulo','YYYY-MM-DD') dia,
               count(*) filter (where evento='page_view')::bigint acessos,
               count(distinct session_id) filter (where evento='page_view')::bigint navegadores,
               count(*) filter (where evento='checkout_start')::bigint checkouts,
               count(*) filter (where evento='purchase')::bigint compras
        from base
        group by 1 order by 1
      ) t
    ),
    'atividade_recente', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.ultimo_evento desc),'[]'::jsonb)
      from (
        select right(session_id,6) as referencia,
          max(created_at) ultimo_evento,
          count(*)::bigint interacoes,
          bool_or(evento='product_view') viu_produto,
          bool_or(evento='add_to_cart') adicionou_carrinho,
          bool_or(evento='cart_view') abriu_carrinho,
          bool_or(evento='checkout_start') iniciou_checkout,
          bool_or(evento='purchase') comprou
        from base where created_at >= now() - interval '30 minutes'
        group by session_id order by max(created_at) desc limit 12
      ) t
    )
  ) into resultado
  from classificacao
  limit 1;

  return coalesce(resultado, '{}'::jsonb);
end;
$$;


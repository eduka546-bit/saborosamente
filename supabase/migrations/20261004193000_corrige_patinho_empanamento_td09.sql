-- Corrige classificação e quantidades de patinho, estrutura o empanamento do TD09
-- A migração roda fora de uma sessão autenticada; os gatilhos de sincronização
-- reconhecem service_role via auth.jwt().
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

-- e elimina duplicidade acidental da produção de 05/10/2026.

do $$
declare
  v_patinho uuid;
  v_patinho_tiras uuid;
  v_patinho_bife uuid;
  v_prep_madeira uuid;
  v_prep_td09 uuid;
begin
  select id into v_patinho
  from public.cozinha_ingredientes
  where lower(nome) = lower('Patinho')
  limit 1;

  select id into v_patinho_tiras
  from public.cozinha_ingredientes
  where lower(nome) = lower('Patinho em tiras')
  limit 1;

  if v_patinho is null or v_patinho_tiras is null then
    raise exception 'Ingredientes base de Patinho não encontrados.';
  end if;

  select id into v_patinho_bife
  from public.cozinha_ingredientes
  where lower(nome) = lower('Patinho em bife')
  limit 1;

  if v_patinho_bife is null then
    insert into public.cozinha_ingredientes (
      nome,
      unidade_medida,
      rendimento_padrao,
      custo_por_kg,
      custo_por_unidade,
      ultimo_valor_pago,
      observacao,
      ativo,
      quebra_percentual,
      tipo_rendimento,
      fator_rendimento,
      calorias_100g,
      carboidratos_100g,
      proteinas_100g,
      gorduras_totais_100g,
      gorduras_saturadas_100g,
      gorduras_trans_100g,
      fibra_100g,
      sodio_mg_100g,
      contem_gluten,
      contem_lactose,
      alergenos_confirmados
    )
    select
      'Patinho em bife',
      unidade_medida,
      rendimento_padrao,
      custo_por_kg,
      custo_por_unidade,
      ultimo_valor_pago,
      'Mesmo insumo do Patinho, separado operacionalmente em bifes para a Parmegiana de Carne.',
      ativo,
      quebra_percentual,
      tipo_rendimento,
      fator_rendimento,
      calorias_100g,
      carboidratos_100g,
      proteinas_100g,
      gorduras_totais_100g,
      gorduras_saturadas_100g,
      gorduras_trans_100g,
      fibra_100g,
      sodio_mg_100g,
      contem_gluten,
      contem_lactose,
      alergenos_confirmados
    from public.cozinha_ingredientes
    where id = v_patinho
    returning id into v_patinho_bife;
  end if;

  -- Tiras: TD01, TD11 e TD28 usam Patinho em tiras.
  update public.cozinha_receita_itens cri
  set ingrediente_id = v_patinho_tiras
  where cri.ingrediente_id = v_patinho
    and cri.receita_id in (
      select r.id
      from public.cozinha_receitas r
      join public.produtos p on p.id = r.produto_id
      where p.nome ilike 'TD01 %'
         or p.nome ilike 'TD11 %'
         or p.nome ilike 'TD28 %'
    );

  -- Bife: TD09 usa Patinho em bife.
  update public.cozinha_receita_itens cri
  set ingrediente_id = v_patinho_bife
  where cri.ingrediente_id = v_patinho
    and cri.receita_id in (
      select r.id
      from public.cozinha_receitas r
      join public.produtos p on p.id = r.produto_id
      where p.nome ilike 'TD09 %'
    );

  -- O preparo do TD01 também deve apontar para Patinho em tiras.
  select id into v_prep_madeira
  from public.cozinha_preparacoes
  where lower(nome) = lower('Molho madeira')
  limit 1;

  if v_prep_madeira is not null then
    update public.cozinha_preparacao_itens
    set ingrediente_id = v_patinho_tiras,
        quantidade_texto = case
          when ingrediente_id = v_patinho then '3,5 kg de patinho em tiras aproximadamente'
          else quantidade_texto
        end
    where preparacao_id = v_prep_madeira
      and ingrediente_id = v_patinho;

    update public.cozinha_preparacoes
    set nome = 'Alcatra molho madeira',
        observacao = 'Preparo do TD01. As quantidades do lote são calculadas pela ficha técnica de cada tamanho.',
        updated_at = now()
    where id = v_prep_madeira;

    update public.cozinha_receitas r
    set preparacoes = (
      select coalesce(
        jsonb_agg(
          case
            when elem->>'id' = v_prep_madeira::text
              then jsonb_set(elem, '{nome}', to_jsonb('Alcatra molho madeira'::text))
            else elem
          end
          order by ord
        ),
        '[]'::jsonb
      )
      from jsonb_array_elements(coalesce(r.preparacoes, '[]'::jsonb)) with ordinality as j(elem, ord)
    )
    where exists (
      select 1
      from jsonb_array_elements(coalesce(r.preparacoes, '[]'::jsonb)) elem
      where elem->>'id' = v_prep_madeira::text
    );
  end if;

  -- Estrutura o empanamento do TD09 como preparo normal, sem bloco especial.
  select id into v_prep_td09
  from public.cozinha_preparacoes
  where lower(nome) = lower('Empanamento • TD09')
     or lower(nome) = lower('Bife de patinho')
  order by case when lower(nome) = lower('Empanamento • TD09') then 0 else 1 end
  limit 1;

  if v_prep_td09 is not null then
    update public.cozinha_preparacoes
    set nome = 'Bife de patinho',
        rendimento_final_g = 70,
        observacao = 'Base de referência do empanamento do TD09. O lote do dia usa as quantidades exatas da ficha por tamanho.',
        updated_at = now()
    where id = v_prep_td09;

    -- Base de referência equivalente à marmita de 200 g.
    update public.cozinha_preparacao_itens
    set quantidade = 4,
        quantidade_texto = '4 g de farinha de trigo',
        ordem = 1
    where preparacao_id = v_prep_td09
      and ingrediente_id = (
        select id from public.cozinha_ingredientes where lower(nome)=lower('Farinha de trigo') limit 1
      );

    update public.cozinha_preparacao_itens
    set quantidade = 0.06666,
        quantidade_texto = '0,067 ovo (referência: 1 ovo ≈ 50 g)',
        ordem = 2
    where preparacao_id = v_prep_td09
      and ingrediente_id = (
        select id from public.cozinha_ingredientes where lower(nome)=lower('Ovo') limit 1
      );

    update public.cozinha_preparacao_itens
    set quantidade = 4,
        quantidade_texto = '4 g de farinha de rosca',
        ordem = 3
    where preparacao_id = v_prep_td09
      and ingrediente_id = (
        select id from public.cozinha_ingredientes where lower(nome)=lower('Farinha de rosca') limit 1
      );

    insert into public.cozinha_preparacao_itens (
      preparacao_id,
      ingrediente_id,
      quantidade,
      rendimento_quebra,
      ordem,
      quantidade_texto
    )
    select
      v_prep_td09,
      v_patinho_bife,
      60,
      1,
      0,
      '60 g de patinho em bife'
    where not exists (
      select 1
      from public.cozinha_preparacao_itens
      where preparacao_id = v_prep_td09
        and ingrediente_id = v_patinho_bife
    );

    update public.cozinha_receitas r
    set preparacoes = (
      select coalesce(
        jsonb_agg(
          case
            when elem->>'id' = v_prep_td09::text
              then jsonb_set(elem, '{nome}', to_jsonb('Bife de patinho'::text))
            else elem
          end
          order by ord
        ),
        '[]'::jsonb
      )
      from jsonb_array_elements(coalesce(r.preparacoes, '[]'::jsonb)) with ordinality as j(elem, ord)
    )
    where exists (
      select 1
      from jsonb_array_elements(coalesce(r.preparacoes, '[]'::jsonb)) elem
      where elem->>'id' = v_prep_td09::text
    );
  end if;

  -- Ovo é cadastrado em unidades. As fichas antigas guardavam equivalentes em gramas.
  -- Converte usando a referência operacional cadastrada: 1 ovo grande ≈ 50 g.
  update public.cozinha_receita_itens cri
  set gramas_200 = cri.gramas_200 / 50,
      gramas_300 = cri.gramas_300 / 50,
      gramas_400 = cri.gramas_400 / 50,
      gramas_personalizada = cri.gramas_personalizada / 50,
      observacao = concat_ws(
        ' · ',
        nullif(cri.observacao, ''),
        'Ovo em unidades (1 un ≈ 50 g)'
      )
  where cri.ingrediente_id = (
    select id from public.cozinha_ingredientes where lower(nome)=lower('Ovo') limit 1
  )
    and greatest(
      coalesce(cri.gramas_200,0),
      coalesce(cri.gramas_300,0),
      coalesce(cri.gramas_400,0),
      coalesce(cri.gramas_personalizada,0)
    ) > 1.5;

end $$;

-- Remove somente as três duplicidades exatas do TD01 lançadas no mesmo instante
-- para a produção de 05/10/2026, mantendo a primeira linha de cada gramatura.
with duplicadas as (
  select
    cp.id,
    row_number() over (
      partition by cp.data_producao, cp.produto_id, cp.gramatura, cp.quantidade_planejada, cp.status
      order by cp.created_at, cp.id
    ) as rn
  from public.cozinha_producoes cp
  join public.produtos p on p.id = cp.produto_id
  where cp.data_producao = date '2026-10-05'
    and p.nome ilike 'TD01 %'
)
delete from public.cozinha_producoes cp
using duplicadas d
where cp.id = d.id
  and d.rn > 1;

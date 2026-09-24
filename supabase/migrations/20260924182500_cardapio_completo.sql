-- Cardápio Completo: fonte única de subgrupo/proteína/observação e edição segura pela cozinha.

alter table public.produtos add column if not exists subgrupo text;
alter table public.produtos add column if not exists proteina text;
alter table public.produtos add column if not exists observacao_cardapio text;

create index if not exists idx_produtos_subgrupo on public.produtos(subgrupo);
create index if not exists idx_produtos_proteina on public.produtos(proteina);

-- Subgrupos trazidos da planilha "Listagem Maio 2026".
update public.produtos
set subgrupo = case
  when nome ~ '^TD0[1-5]' then 'CARNE'
  when nome ~ '^TD0[6-7]' then 'FRANGO'
  when nome ~ '^TD0[8-9]' then 'PARMEGIANA'
  when nome ~ '^TD1[0-1]' then 'ESTROGONOFE'
  when nome ~ '^TD1[2-3]' then 'ESCONDIDINHO'
  when nome ~ '^TD14' then 'PEIXE'
  when nome ~ '^TD1[5-8]' then 'ARROZ & FEIJÃO'
  when nome ~ '^TD1[9]|^TD20' then 'LASANHA'
  when nome ~ '^TD2[1-2]' then 'PANQUECA'
  when nome ~ '^TD2[3-8]' then 'MASSAS'
  when nome ~ '^SO' then 'SOPAS 400G'
  when nome ~ '^CO' then 'COMPLEMENTOS'
  else subgrupo
end
where nome ~ '^(TD|SO|CO)[0-9]+';

-- Proteína principal. Casos mistos ficam explicitamente marcados como "Misto".
update public.produtos
set proteina = case
  when nome ~ '^TD0[1-4]' then 'Carne bovina'
  when nome ~ '^TD05' then 'Misto'
  when nome ~ '^TD0[6-8]' then 'Frango'
  when nome ~ '^TD09' then 'Carne bovina'
  when nome ~ '^TD10' then 'Frango'
  when nome ~ '^TD11' then 'Carne bovina'
  when nome ~ '^TD12' then 'Frango'
  when nome ~ '^TD13' then 'Carne bovina'
  when nome ~ '^TD14' then 'Peixe'
  when nome ~ '^TD15' then 'Suína'
  when nome ~ '^TD16' then 'Carne bovina'
  when nome ~ '^TD17' then 'Frango'
  when nome ~ '^TD18' then 'Carne bovina'
  when nome ~ '^TD19' then 'Frango'
  when nome ~ '^TD20' then 'Carne bovina'
  when nome ~ '^TD21' then 'Frango'
  when nome ~ '^TD22' then 'Carne bovina'
  when nome ~ '^TD23' then 'Frango'
  when nome ~ '^TD24' then 'Suína'
  when nome ~ '^TD2[5-6]' then 'Carne bovina'
  when nome ~ '^TD27' then 'Suína'
  when nome ~ '^TD28' then 'Carne bovina'
  when nome ~ '^SO01' then 'Frango'
  when nome ~ '^SO02' then 'Carne bovina'
  when nome ~ '^SO0[3-4]' then 'Vegetariano'
  when nome ~ '^SO05' then 'Carne bovina'
  when nome ~ '^SO06' then 'Frango'
  when nome ~ '^SO07' then 'Carne bovina'
  when nome ~ '^SO08' then 'Misto'
  when nome ~ '^SO09' then 'Carne bovina'
  when nome ~ '^SO10' then 'Carne bovina'
  when nome ~ '^SO11' then 'Suína'
  when nome ~ '^SO12' then 'Peixe'
  when nome ~ '^CO0[1-3]' then 'Frango'
  when nome ~ '^CO0[4-6]' then 'Carne bovina'
  else proteina
end
where nome ~ '^(TD|SO|CO)[0-9]+';

-- A cozinha pode editar somente os metadados liberados pelo Cardápio Completo,
-- sem ganhar permissão ampla de UPDATE na tabela produtos.
create or replace function public.cozinha_atualizar_cardapio_produto(
  p_produto_id uuid,
  p_subgrupo text,
  p_proteina text,
  p_observacao text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (
    coalesce((select auth.jwt() ->> 'role') = 'service_role', false)
    or public.has_role((select auth.uid()), 'admin'::public.app_role)
    or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
  ) then
    raise exception 'Acesso não autorizado' using errcode = '42501';
  end if;

  update public.produtos
  set subgrupo = nullif(trim(p_subgrupo), ''),
      proteina = nullif(trim(p_proteina), ''),
      observacao_cardapio = nullif(trim(p_observacao), ''),
      updated_at = now()
  where id = p_produto_id;
end;
$$;

create or replace function public.cozinha_atualizar_nutricao_cardapio(
  p_produto_id uuid,
  p_tamanho integer,
  p_tabela jsonb,
  p_restricoes jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sem_gluten boolean;
  v_sem_lactose boolean;
begin
  if not (
    coalesce((select auth.jwt() ->> 'role') = 'service_role', false)
    or public.has_role((select auth.uid()), 'admin'::public.app_role)
    or public.has_role((select auth.uid()), 'cozinha'::public.app_role)
  ) then
    raise exception 'Acesso não autorizado' using errcode = '42501';
  end if;

  if p_tamanho not in (200, 300, 400) then
    raise exception 'Tamanho inválido';
  end if;

  if p_tamanho = 200 then
    update public.produtos
    set tabela_nutricional_200g = coalesce(p_tabela, '{}'::jsonb),
        tabela_nutricional = coalesce(p_tabela, '{}'::jsonb),
        restricoes_200g = coalesce(p_restricoes, '[]'::jsonb),
        updated_at = now()
    where id = p_produto_id;
  elsif p_tamanho = 300 then
    update public.produtos
    set tabela_nutricional_300g = coalesce(p_tabela, '{}'::jsonb),
        restricoes_300g = coalesce(p_restricoes, '[]'::jsonb),
        updated_at = now()
    where id = p_produto_id;
  else
    update public.produtos
    set tabela_nutricional_400g = coalesce(p_tabela, '{}'::jsonb),
        restricoes_400g = coalesce(p_restricoes, '[]'::jsonb),
        updated_at = now()
    where id = p_produto_id;
  end if;

  select
    (
      exists (
        select 1
        from (
          select jsonb_array_elements_text(coalesce(restricoes_200g, '[]'::jsonb)) as x
          union all select jsonb_array_elements_text(coalesce(restricoes_300g, '[]'::jsonb))
          union all select jsonb_array_elements_text(coalesce(restricoes_400g, '[]'::jsonb))
        ) r
        where upper(r.x) like '%NÃO CONTÉM GLÚTEN%'
      )
      and not exists (
        select 1
        from (
          select jsonb_array_elements_text(coalesce(restricoes_200g, '[]'::jsonb)) as x
          union all select jsonb_array_elements_text(coalesce(restricoes_300g, '[]'::jsonb))
          union all select jsonb_array_elements_text(coalesce(restricoes_400g, '[]'::jsonb))
        ) r
        where upper(r.x) like 'CONTÉM GLÚTEN%'
      )
    ),
    (
      exists (
        select 1
        from (
          select jsonb_array_elements_text(coalesce(restricoes_200g, '[]'::jsonb)) as x
          union all select jsonb_array_elements_text(coalesce(restricoes_300g, '[]'::jsonb))
          union all select jsonb_array_elements_text(coalesce(restricoes_400g, '[]'::jsonb))
        ) r
        where upper(r.x) like '%NÃO CONTÉM LACTOSE%'
      )
      and not exists (
        select 1
        from (
          select jsonb_array_elements_text(coalesce(restricoes_200g, '[]'::jsonb)) as x
          union all select jsonb_array_elements_text(coalesce(restricoes_300g, '[]'::jsonb))
          union all select jsonb_array_elements_text(coalesce(restricoes_400g, '[]'::jsonb))
        ) r
        where upper(r.x) like 'CONTÉM LACTOSE%'
      )
    )
  into v_sem_gluten, v_sem_lactose
  from public.produtos
  where id = p_produto_id;

  update public.produtos
  set sem_gluten = coalesce(v_sem_gluten, false),
      sem_lactose = coalesce(v_sem_lactose, false)
  where id = p_produto_id;

  update public.cozinha_etiquetas
  set informacao_nutricional = coalesce(p_tabela, '{}'::jsonb),
      updated_at = now()
  where produto_id = p_produto_id
    and tamanho_g = p_tamanho;
end;
$$;

grant execute on function public.cozinha_atualizar_cardapio_produto(uuid,text,text,text) to authenticated;
grant execute on function public.cozinha_atualizar_nutricao_cardapio(uuid,integer,jsonb,jsonb) to authenticated;

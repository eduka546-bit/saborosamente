
create or replace function public.ingredientes_publicos_texto(p_ingredientes text)
returns text
language sql
immutable
security invoker
set search_path to ''
as $function$
  select nullif(
    string_agg(trim(item), ', ' order by ord),
    ''
  )
  from unnest(
    regexp_split_to_array(coalesce(p_ingredientes, ''), '\\s*[,;]\\s*')
  ) with ordinality as t(item, ord)
  where trim(item) <> ''
    -- Qualquer ingrediente explicitamente marcado como industrializado/marca
    and lower(item) !~ '(industrializ|industraliad|\\bmarca\\b)'
    -- Nunca expor demi-glace, mesmo se vier sem a anotação "industrializado"
    and lower(item) !~ 'demi[[:space:]-]*glace'
    -- Insumos industrializados que podem aparecer sem anotação completa
    and lower(trim(item)) !~ '^(extrato de tomate|molho de tomate|molho madeira|molho 4 queijos)\\b'
    -- Marcas atualmente encontradas no cadastro; defesa adicional caso venham sem "marca"
    and lower(item) !~ '(\\bquero\\b|\\bqualimax\\b|\\belege\\b|\\belegê\\b)'
$function$;

revoke all on function public.ingredientes_publicos_texto(text)
  from public, anon, authenticated;
grant execute on function public.ingredientes_publicos_texto(text)
  to service_role;

create or replace function public.produtos_publicos()
returns setof jsonb
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select jsonb_build_object(
    'id', p.id,
    'nome', p.nome,
    'descricao', p.descricao,
    'ingredientes', public.ingredientes_publicos_texto(p.ingredientes),
    'preco', p.preco,
    'peso', p.peso,
    'categoria', p.categoria,
    'imagem_url', p.imagem_url,
    'destaque', p.destaque,
    'categoria_id', p.categoria_id,
    'calorias', p.calorias,
    'status', p.status,
    'informacao_nutricional', p.informacao_nutricional,
    'controle_estoque', p.controle_estoque,
    'estoque_atual', p.estoque_atual,
    'preco_promocional', p.preco_promocional,
    'is_destaque', p.is_destaque,
    'is_novidade', p.is_novidade,
    'frete_gratis', p.frete_gratis,
    'bloquear_cupom', p.bloquear_cupom,
    'preco_300g', p.preco_300g,
    'preco_400g', p.preco_400g,
    'tabela_nutricional', p.tabela_nutricional,
    'tabela_nutricional_300g', p.tabela_nutricional_300g,
    'tabela_nutricional_400g', p.tabela_nutricional_400g,
    'imagens', p.imagens,
    'ativo', p.ativo,
    'ordem', p.ordem,
    'estoque', p.estoque,
    'info_nutricional', p.info_nutricional,
    'restricoes', p.restricoes,
    'imagem_200g', p.imagem_200g,
    'imagem_300g', p.imagem_300g,
    'imagem_400g', p.imagem_400g,
    'rating', p.rating,
    'sem_gluten', p.sem_gluten,
    'sem_lactose', p.sem_lactose,
    'estoque_200g', p.estoque_200g,
    'estoque_300g', p.estoque_300g,
    'estoque_400g', p.estoque_400g,
    'visivel_online', p.visivel_online,
    'tipo_produto', p.tipo_produto,
    'tabela_nutricional_200g', p.tabela_nutricional_200g,
    'restricoes_200g', p.restricoes_200g,
    'restricoes_300g', p.restricoes_300g,
    'restricoes_400g', p.restricoes_400g,
    'subgrupo', p.subgrupo,
    'proteina', p.proteina,
    'observacao_cardapio', p.observacao_cardapio,
    'categorias', case when c.id is null then null else jsonb_build_object(
      'nome', c.nome,
      'ordem_filtro', c.ordem_filtro
    ) end
  )
  from public.produtos p
  left join public.categorias c on c.id=p.categoria_id
  where p.ativo=true and p.visivel_online=true
  order by p.categoria_id, p.ordem, p.nome;
$function$;

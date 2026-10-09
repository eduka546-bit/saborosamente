alter table public.produtos add column if not exists composicao_site jsonb not null default '[]'::jsonb;
alter table public.produtos add constraint produtos_composicao_site_array check (jsonb_typeof(composicao_site) = 'array');
comment on column public.produtos.composicao_site is 'Composição editorial pública por tamanho; snapshot da montagem, editável no admin, sem modificar receitas da cozinha.';

update public.produtos p set composicao_site = src.rows
from (
 select r.produto_id, jsonb_agg(jsonb_build_object(
 'nome', initcap(regexp_replace(regexp_replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(lower(trim(m.nome)), 'alcatra','patinho'), 'feijao','feijão'), 'almondegas','almôndegas'), 'rustica','rústica'), 'pure','purê'), 'mussarela','muçarela'), 'uma camada de ',''), 'uma camada ',''), 'massa panqueca','massa de panqueca'), 'alcatra molho madeira','patinho ao molho madeira'), '^patinho molho madeira$', 'patinho ao molho madeira'), '^sopa de carne','sopa de patinho')),
 'gramas_150',coalesce(m.gramas_150,0), 'gramas_200',coalesce(m.gramas_200,0),
 'gramas_300',coalesce(m.gramas_300,0), 'gramas_400',coalesce(m.gramas_400,0)) order by m.ordem,m.id) as rows
 from public.cozinha_receitas r join public.cozinha_receita_montagem_itens m on m.receita_id=r.id
 where greatest(coalesce(m.gramas_150,0),coalesce(m.gramas_200,0),coalesce(m.gramas_300,0),coalesce(m.gramas_400,0))>0
 group by r.produto_id
) src where src.produto_id=p.id and p.composicao_site='[]'::jsonb;

CREATE OR REPLACE FUNCTION public.produtos_publicos()
 RETURNS SETOF jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
  ) || jsonb_build_object('composicao_site', p.composicao_site)
  from public.produtos p
  left join public.categorias c on c.id=p.categoria_id
  where p.ativo=true and p.visivel_online=true
  order by p.categoria_id, p.ordem, p.nome;
$function$

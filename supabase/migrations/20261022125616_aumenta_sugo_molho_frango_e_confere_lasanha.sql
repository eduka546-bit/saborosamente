-- Aumenta em 15% o molho sugo do preparo-base de frango desfiado.
-- Como o sugo é uma preparação pronta, o rendimento final recebe o mesmo acréscimo.
alter table public.cozinha_preparacao_itens disable trigger user;
alter table public.cozinha_preparacoes disable trigger user;

with alvo as (
  select id
  from public.cozinha_preparacoes
  where lower(nome) = 'molho frango desfiado'
)
update public.cozinha_preparacao_itens pi
set quantidade = round(pi.quantidade * 1.15, 2)
from alvo a
where pi.preparacao_id = a.id
  and pi.preparacao_componente_id = (
    select id from public.cozinha_preparacoes where lower(nome) = 'molho sugo'
  );

update public.cozinha_preparacoes
set rendimento_final_g = rendimento_final_g + 78.75,
    updated_at = now()
where lower(nome) = 'molho frango desfiado';

alter table public.cozinha_preparacoes enable trigger user;
alter table public.cozinha_preparacao_itens enable trigger user;

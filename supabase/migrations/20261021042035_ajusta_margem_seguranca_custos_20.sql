-- Atualiza a margem de segurança do custo de todas as fichas técnicas para 20%.
-- Os gatilhos são desativados apenas durante esta alteração de custo, pois os
-- ingredientes e a composição das receitas não são modificados.
alter table public.cozinha_receitas disable trigger user;

update public.cozinha_receitas
set margem_custo_percentual = 20,
    updated_at = now()
where margem_custo_percentual is distinct from 20;

alter table public.cozinha_receitas enable trigger user;

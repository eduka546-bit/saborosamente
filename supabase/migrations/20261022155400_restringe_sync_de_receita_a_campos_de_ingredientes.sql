-- Alterar a margem de custo nao exige a resincronizacao dos ingredientes do produto.
-- Isso permite atualizar o controle operacional sem acionar a permissao da cozinha.
drop trigger if exists trg_sync_produto_ingredientes_from_receita on public.cozinha_receitas;

create trigger trg_sync_produto_ingredientes_from_receita
after insert or delete or update of produto_id, preparacoes on public.cozinha_receitas
for each row
execute function public.trg_sync_produto_ingredientes_from_receita();

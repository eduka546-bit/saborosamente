alter table public.cozinha_receita_montagem_itens
  add column if not exists observacao_200 text,
  add column if not exists observacao_300 text,
  add column if not exists observacao_400 text;

drop policy if exists "categorias_public_read" on public.categorias;

alter policy "acompanhamentos_read"
  on public.acompanhamentos
  using (ativo = true);

alter policy "combo_sabores_read"
  on public.combo_sabores
  using (ativo = true);

alter policy "complemento_itens_read"
  on public.complemento_itens
  using (ativo = true);

alter policy "marmita_grupos_read"
  on public.marmita_grupos
  using (ativo = true);

alter policy "marmita_ingredientes_read"
  on public.marmita_ingredientes
  using (ativo = true);

drop policy if exists "faq_read" on public.faq;
alter policy "public_read_faq"
  on public.faq
  using (ativo = true);

alter policy "rates_public_read"
  on public.delivery_rates
  using (ativo = true);

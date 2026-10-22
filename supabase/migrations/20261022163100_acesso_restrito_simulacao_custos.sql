-- O papel custos pode somente consultar as fontes do calculo. Nenhuma policy
-- de INSERT, UPDATE ou DELETE e concedida abaixo.
drop policy if exists "custos consulta produtos" on public.produtos;
create policy "custos consulta produtos" on public.produtos
for select to authenticated
using (public.has_role((select auth.uid()), 'custos'::public.app_role));

drop policy if exists "custos consulta receitas" on public.cozinha_receitas;
create policy "custos consulta receitas" on public.cozinha_receitas
for select to authenticated
using (public.has_role((select auth.uid()), 'custos'::public.app_role));

drop policy if exists "custos consulta itens de receita" on public.cozinha_receita_itens;
create policy "custos consulta itens de receita" on public.cozinha_receita_itens
for select to authenticated
using (public.has_role((select auth.uid()), 'custos'::public.app_role));

drop policy if exists "custos consulta montagem de receitas" on public.cozinha_receita_montagem_itens;
create policy "custos consulta montagem de receitas" on public.cozinha_receita_montagem_itens
for select to authenticated
using (public.has_role((select auth.uid()), 'custos'::public.app_role));

drop policy if exists "custos consulta ingredientes" on public.cozinha_ingredientes;
create policy "custos consulta ingredientes" on public.cozinha_ingredientes
for select to authenticated
using (public.has_role((select auth.uid()), 'custos'::public.app_role));

drop policy if exists "custos consulta preparacoes" on public.cozinha_preparacoes;
create policy "custos consulta preparacoes" on public.cozinha_preparacoes
for select to authenticated
using (public.has_role((select auth.uid()), 'custos'::public.app_role));

drop policy if exists "custos consulta itens de preparacao" on public.cozinha_preparacao_itens;
create policy "custos consulta itens de preparacao" on public.cozinha_preparacao_itens
for select to authenticated
using (public.has_role((select auth.uid()), 'custos'::public.app_role));

drop policy if exists "custos consulta embalagens" on public.cozinha_embalagens;
create policy "custos consulta embalagens" on public.cozinha_embalagens
for select to authenticated
using (public.has_role((select auth.uid()), 'custos'::public.app_role));

drop policy if exists "custos consulta despesas operacionais" on public.financeiro_despesas_operacionais;
create policy "custos consulta despesas operacionais" on public.financeiro_despesas_operacionais
for select to authenticated
using (public.has_role((select auth.uid()), 'custos'::public.app_role));

drop policy if exists "custos consulta mix operacional" on public.financeiro_mix_operacional;
create policy "custos consulta mix operacional" on public.financeiro_mix_operacional
for select to authenticated
using (public.has_role((select auth.uid()), 'custos'::public.app_role));

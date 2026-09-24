-- Mantém a informação nutricional idêntica entre o produto e as etiquetas.
-- As duas telas podem editar, mas os registros convergem automaticamente.

create or replace function public.sync_produto_nutricao_para_etiquetas()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tabela_nutricional_200g is distinct from old.tabela_nutricional_200g
     or new.tabela_nutricional is distinct from old.tabela_nutricional then
    update public.cozinha_etiquetas
       set informacao_nutricional = coalesce(new.tabela_nutricional_200g, new.tabela_nutricional, '{}'::jsonb),
           updated_at = now()
     where produto_id = new.id
       and tamanho_g = 200
       and informacao_nutricional is distinct from coalesce(new.tabela_nutricional_200g, new.tabela_nutricional, '{}'::jsonb);
  end if;

  if new.tabela_nutricional_300g is distinct from old.tabela_nutricional_300g then
    update public.cozinha_etiquetas
       set informacao_nutricional = coalesce(new.tabela_nutricional_300g, '{}'::jsonb),
           updated_at = now()
     where produto_id = new.id
       and tamanho_g = 300
       and informacao_nutricional is distinct from coalesce(new.tabela_nutricional_300g, '{}'::jsonb);
  end if;

  if new.tabela_nutricional_400g is distinct from old.tabela_nutricional_400g then
    update public.cozinha_etiquetas
       set informacao_nutricional = coalesce(new.tabela_nutricional_400g, '{}'::jsonb),
           updated_at = now()
     where produto_id = new.id
       and tamanho_g = 400
       and informacao_nutricional is distinct from coalesce(new.tabela_nutricional_400g, '{}'::jsonb);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_produto_nutricao_etiquetas on public.produtos;
create trigger trg_sync_produto_nutricao_etiquetas
after update of tabela_nutricional, tabela_nutricional_200g, tabela_nutricional_300g, tabela_nutricional_400g
on public.produtos
for each row execute function public.sync_produto_nutricao_para_etiquetas();

create or replace function public.sync_etiqueta_nutricao_para_produto()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tamanho_g = 200 then
    update public.produtos
       set tabela_nutricional_200g = coalesce(new.informacao_nutricional, '{}'::jsonb),
           tabela_nutricional = coalesce(new.informacao_nutricional, '{}'::jsonb),
           updated_at = now()
     where id = new.produto_id
       and (
         tabela_nutricional_200g is distinct from coalesce(new.informacao_nutricional, '{}'::jsonb)
         or tabela_nutricional is distinct from coalesce(new.informacao_nutricional, '{}'::jsonb)
       );
  elsif new.tamanho_g = 300 then
    update public.produtos
       set tabela_nutricional_300g = coalesce(new.informacao_nutricional, '{}'::jsonb),
           updated_at = now()
     where id = new.produto_id
       and tabela_nutricional_300g is distinct from coalesce(new.informacao_nutricional, '{}'::jsonb);
  elsif new.tamanho_g = 400 then
    update public.produtos
       set tabela_nutricional_400g = coalesce(new.informacao_nutricional, '{}'::jsonb),
           updated_at = now()
     where id = new.produto_id
       and tabela_nutricional_400g is distinct from coalesce(new.informacao_nutricional, '{}'::jsonb);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_etiqueta_nutricao_produto on public.cozinha_etiquetas;
create trigger trg_sync_etiqueta_nutricao_produto
after insert or update of informacao_nutricional, produto_id, tamanho_g
on public.cozinha_etiquetas
for each row execute function public.sync_etiqueta_nutricao_para_produto();

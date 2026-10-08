
create or replace function public.auto_prepare_site_order()
returns trigger
language plpgsql
security invoker
set search_path to ''
as $function$
begin
  if lower(coalesce(new.origem, 'site')) = 'site'
     and lower(coalesce(new.status, 'pendente')) in ('pendente', 'rascunho', 'novo_pedido') then
    new.status := 'preparando';
  end if;
  return new;
end
$function$;

drop trigger if exists pedidos_auto_prepare_site on public.pedidos;
create trigger pedidos_auto_prepare_site
before insert on public.pedidos
for each row execute function public.auto_prepare_site_order();

-- O rastreamento por protocolo é público, mas a função só devolve dados limitados do pedido.
grant execute on function public.rastrear_pedido(text) to anon, authenticated, service_role;

-- Corrige o pedido usado no teste desta conversa.
update public.pedidos
set status='preparando', updated_at=now()
where id='32e41af2-5f86-43d4-8835-fb8d2a82779d'::uuid
  and origem='site'
  and status='pendente';

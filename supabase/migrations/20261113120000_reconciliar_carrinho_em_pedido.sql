-- Um pedido concluído deve encerrar todos os rascunhos equivalentes do cliente,
-- inclusive se ele entrou em outra aba ou recebeu uma nova sessão no navegador.
-- Assim o painel não conta como abandonado algo que já virou pedido.
create or replace function public.reconciliar_carrinhos_apos_pedido()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_telefone text := right(regexp_replace(coalesce(new.telefone_cliente, ''), '\D', '', 'g'), 11);
  v_email text := lower(nullif(btrim(coalesce(new.email_cliente, '')), ''));
begin
  update public.carrinhos_abandonados c
     set status = 'convertido',
         convertido_em = coalesce(c.convertido_em, now()),
         updated_at = now()
   where c.status in ('em_andamento', 'abandonado', 'recuperado')
     and c.created_at <= new.created_at
     and c.created_at >= new.created_at - interval '30 days'
     and (
       (new.user_id is not null and c.user_id = new.user_id)
       or (
         v_telefone <> ''
         and right(regexp_replace(coalesce(c.telefone, ''), '\D', '', 'g'), 11) = v_telefone
       )
       or (v_email is not null and lower(nullif(btrim(coalesce(c.email, '')), '')) = v_email)
     );
  return new;
end;
$$;

drop trigger if exists trg_reconciliar_carrinhos_apos_pedido on public.pedidos;
create trigger trg_reconciliar_carrinhos_apos_pedido
  after insert on public.pedidos
  for each row execute function public.reconciliar_carrinhos_apos_pedido();

-- Corrige os registros históricos que já tinham um pedido posterior da mesma pessoa.
update public.carrinhos_abandonados c
   set status = 'convertido',
       convertido_em = coalesce(c.convertido_em, now()),
       updated_at = now()
 where c.status in ('em_andamento', 'abandonado', 'recuperado')
   and exists (
     select 1
       from public.pedidos p
      where lower(coalesce(p.status, '')) not like 'cancel%'
        and p.created_at >= c.created_at
        and p.created_at <= c.created_at + interval '30 days'
        and (
          (c.user_id is not null and p.user_id = c.user_id)
          or (
            right(regexp_replace(coalesce(c.telefone, ''), '\D', '', 'g'), 11) <> ''
            and right(regexp_replace(coalesce(c.telefone, ''), '\D', '', 'g'), 11) = right(regexp_replace(coalesce(p.telefone_cliente, ''), '\D', '', 'g'), 11)
          )
          or (
            nullif(lower(btrim(coalesce(c.email, ''))), '') is not null
            and lower(btrim(coalesce(c.email, ''))) = lower(btrim(coalesce(p.email_cliente, '')))
          )
        )
   );

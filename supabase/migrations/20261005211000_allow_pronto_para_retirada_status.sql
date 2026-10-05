
alter table public.pedidos
  drop constraint if exists pedidos_status_check;

alter table public.pedidos
  add constraint pedidos_status_check
  check (
    status = any (
      array[
        'rascunho'::text,
        'pendente'::text,
        'preparando'::text,
        'saiu para entrega'::text,
        'pronto para retirada'::text,
        'entregue'::text,
        'cancelado'::text,
        'novo_pedido'::text,
        'pagamento_confirmado'::text,
        'Pendente'::text,
        'Preparando'::text,
        'Em preparo'::text,
        'Saiu para entrega'::text,
        'Entregue'::text,
        'Cancelado'::text,
        'Erro'::text,
        'Não confirmado'::text
      ]
    )
  );

-- ============================================================================
-- Corrige a constraint pedidos_status_check.
-- Sintoma: criar pedido falhava com
--   'new row for relation "pedidos" violates check constraint "pedidos_status_check"'
-- Causa: a constraint não incluía "rascunho" (status inicial de todo pedido novo)
--        nem toda a lista de status que o fluxo usa.
--
-- Redefinimos a constraint com TODOS os status válidos do sistema.
-- Inclui variações capitalizadas legadas para não invalidar pedidos antigos.
-- ============================================================================

ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;

ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_status_check CHECK (
    status IN (
      -- Fluxo atual (minúsculo)
      'rascunho',
      'pendente',
      'preparando',
      'saiu para entrega',
      'entregue',
      'cancelado',
      -- Eventos de pagamento usados em notificações
      'novo_pedido',
      'pagamento_confirmado',
      -- Legado / capitalizado (pedidos antigos e telas que ainda usam)
      'Pendente',
      'Preparando',
      'Em preparo',
      'Saiu para entrega',
      'Entregue',
      'Cancelado',
      'Erro',
      'Não confirmado'
    )
  );

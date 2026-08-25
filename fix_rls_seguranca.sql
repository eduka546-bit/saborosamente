-- ============================================================
-- CORREÇÃO DE SEGURANÇA — RLS
-- Fecha o vazamento de dados: várias tabelas tinham políticas
-- definidas mas com RLS DESLIGADO (as políticas eram ignoradas).
-- ============================================================
-- Contexto validado antes de aplicar:
--  • Criação de pedidos usa service_role (server fn + edge function) → ignora RLS, não quebra.
--  • Leitura do próprio pedido/perfil (logado) e admin → cobertas por políticas existentes.
--  • Rastreamento público por protocolo (página /pedido, sem login) → passa a usar a RPC abaixo.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1) RPC para rastreamento público de pedido por protocolo
--    SECURITY DEFINER: roda com privilégios do dono, então funciona
--    mesmo com RLS ligado, mas expõe SOMENTE campos não sensíveis
--    e exige o protocolo (8 primeiros caracteres do id) — não permite listar.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rastrear_pedido(p_protocolo text)
RETURNS TABLE (
  id uuid,
  status text,
  created_at timestamptz,
  metodo_entrega text,
  metodo_pagamento text,
  endereco_bairro text,
  endereco_cidade text,
  valor_total numeric,
  taxa_entrega numeric,
  desconto_aplicado numeric,
  itens jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.status,
    p.created_at,
    p.metodo_entrega,
    p.metodo_pagamento,
    p.endereco_bairro,
    p.endereco_cidade,
    p.valor_total,
    p.taxa_entrega,
    p.desconto_aplicado,
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'quantidade', pi.quantidade,
          'preco_unitario', pi.preco_unitario,
          'produto_id', pi.produto_id,
          'produtos', jsonb_build_object('nome', pr.nome)
        ))
        FROM public.pedido_itens pi
        LEFT JOIN public.produtos pr ON pr.id = pi.produto_id
        WHERE pi.pedido_id = p.id
      ),
      '[]'::jsonb
    ) AS itens
  FROM public.pedidos p
  -- Casa pelo protocolo (início do UUID), exigindo pelo menos 6 caracteres
  WHERE length(regexp_replace(p_protocolo, '[^0-9a-fA-F]', '', 'g')) >= 6
    AND p.id::text ILIKE regexp_replace(p_protocolo, '[^0-9a-fA-F]', '', 'g') || '%'
  ORDER BY p.created_at DESC
  LIMIT 1;
$$;

-- Permite que visitantes (anon) e logados chamem a função
GRANT EXECUTE ON FUNCTION public.rastrear_pedido(text) TO anon, authenticated;

-- ------------------------------------------------------------
-- 2) LIGAR o RLS nas tabelas expostas (as políticas já existem)
-- ------------------------------------------------------------
ALTER TABLE public.pedidos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos      ENABLE ROW LEVEL SECURITY;

COMMIT;

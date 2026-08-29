-- Menu do chatbot editável pelo admin. A edge (whatsapp-agent) monta o menu
-- interativo a partir desta tabela; se vier vazia, usa o fallback embutido.
CREATE TABLE IF NOT EXISTS public.chatbot_menu (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secao          text NOT NULL,           -- Pedidos | Dúvidas | Mais
  secao_ordem    integer NOT NULL DEFAULT 0,
  ordem          integer NOT NULL DEFAULT 0,
  item_id        text UNIQUE NOT NULL,    -- id usado no roteamento (menu_cardapio, duvida_..., etc.)
  titulo         text NOT NULL,           -- máx 24 chars (limite WhatsApp, emoji conta 2+)
  descricao      text,
  acao           text NOT NULL,           -- resposta_fixa | transfere_humano | envia_cardapio | envia_site
  resposta_chave text,                    -- chave em agente_respostas_fixas (quando acao=resposta_fixa)
  ativo          boolean NOT NULL DEFAULT true,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chatbot_menu ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_chatbot_menu" ON public.chatbot_menu;
CREATE POLICY "service_role_all_chatbot_menu"
  ON public.chatbot_menu FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "admin_manage_chatbot_menu" ON public.chatbot_menu;
CREATE POLICY "admin_manage_chatbot_menu"
  ON public.chatbot_menu FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Semeia os 8 itens atuais (upsert por item_id).
INSERT INTO public.chatbot_menu
  (secao, secao_ordem, ordem, item_id, titulo, descricao, acao, resposta_chave) VALUES
('Pedidos', 1, 1, 'menu_cardapio',        '🍽️ Cardápio',            'Ver pratos e preços',        'envia_cardapio',   'menu_cardapio'),
('Pedidos', 1, 2, 'duvida_descontos',     '🏷️ Descontos',           'Descubra como economizar',   'resposta_fixa',    'duvida_descontos'),
('Pedidos', 1, 3, 'menu_pedido',          '🛒 Fazer um pedido',      'Como fazer seu pedido',      'transfere_humano', 'menu_pedido'),
('Dúvidas', 2, 1, 'duvida_como_funciona', '📋 Como Funciona',        'Marmitas, preparo, validade','resposta_fixa',    'duvida_como_funciona'),
('Dúvidas', 2, 2, 'duvida_entrega',       '🚚 Entrega e mínimo',     'Cidades, taxas e prazos',    'resposta_fixa',    'duvida_entrega'),
('Dúvidas', 2, 3, 'duvida_pagamento',     '💳 Pagamento',            'Pix, cartão, alimentação...','resposta_fixa',    'duvida_pagamento'),
('Mais',    3, 1, 'menu_site',            '🌐 Acessar o site',       'www.saborosamente.com',      'envia_site',       'menu_site'),
('Mais',    3, 2, 'menu_atendente',       '👤 Falar com atendente',  'Fale com nossa equipe',      'transfere_humano', 'menu_atendente')
ON CONFLICT (item_id) DO UPDATE
  SET secao = EXCLUDED.secao,
      secao_ordem = EXCLUDED.secao_ordem,
      ordem = EXCLUDED.ordem,
      titulo = EXCLUDED.titulo,
      descricao = EXCLUDED.descricao,
      acao = EXCLUDED.acao,
      resposta_chave = EXCLUDED.resposta_chave,
      updated_at = now();

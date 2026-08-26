-- Respostas fixas das dúvidas frequentes do chatbot (editáveis pelo admin).
-- A dúvida de ENTREGA NÃO fica aqui: ela é gerada dinamicamente a partir de
-- delivery_rates (cidades + valores), para não desatualizar.
CREATE TABLE IF NOT EXISTS public.agente_respostas_fixas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave      text UNIQUE NOT NULL,
  titulo     text NOT NULL,
  conteudo   text NOT NULL,
  ativo      boolean NOT NULL DEFAULT true,
  ordem      integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agente_respostas_fixas ENABLE ROW LEVEL SECURITY;

-- service_role (edge function) faz tudo
DROP POLICY IF EXISTS "service_role_all_respostas_fixas" ON public.agente_respostas_fixas;
CREATE POLICY "service_role_all_respostas_fixas"
  ON public.agente_respostas_fixas FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- admin autenticado gerencia (padrão do projeto: função public.has_role)
DROP POLICY IF EXISTS "admin_manage_respostas_fixas" ON public.agente_respostas_fixas;
CREATE POLICY "admin_manage_respostas_fixas"
  ON public.agente_respostas_fixas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Semear as 4 dúvidas com resposta fixa (upsert por chave).
INSERT INTO public.agente_respostas_fixas (chave, titulo, conteudo, ordem) VALUES
(
  'duvida_pagamento',
  '💳 Formas de pagamento',
  'A gente aceita várias formas de pagamento 😊

• PIX (na entrega ou antecipado)
• Cartão de crédito e débito (Visa, Mastercard, Elo, Hipercard, Amex e outras)
• Vale-refeição (VR, Ticket, Alelo, Sodexo, Pluxee, Caju, Flash e outros)
• Dinheiro

Se tiver dúvida sobre alguma bandeira específica, é só perguntar! 🫶🏼',
  2
),
(
  'duvida_preparo',
  '🍲 Como preparar',
  'Preparar sua marmita é rapidinho! 😋 Direto do congelador para o micro-ondas:

• 150g → 2 a 3 minutos
• 200g → 4 minutos
• 300g → 6 minutos
• 400g → 7 minutos

Os tempos são no micro-ondas e podem variar um pouco conforme a potência. Aqueça até ficar bem quente por igual e aproveite! 🍱',
  3
),
(
  'duvida_validade',
  '❄️ Validade e armazenamento',
  'Nossas marmitas congeladas têm validade de *6 meses* 😊

• Mantenha sempre no freezer/congelador até a hora de preparar.
• A validade de 6 meses vale com o produto conservado bem congelado.
• Depois de aquecida, consuma na hora — não recongele.',
  4
),
(
  'duvida_minimo',
  '📦 Pedido mínimo',
  'O pedido mínimo depende da sua cidade 😊

• São Bento do Sul: mínimo de *2 unidades*
• Rio Negrinho, Campo Alegre, Piên, Corupá, Rio Negro e Mafra: mínimo de *5 unidades*

As unidades podem ser qualquer combinação de marmitas, sopas e combos. 🍱',
  5
)
ON CONFLICT (chave) DO UPDATE
  SET titulo = EXCLUDED.titulo,
      conteudo = EXCLUDED.conteudo,
      ordem = EXCLUDED.ordem,
      updated_at = now();

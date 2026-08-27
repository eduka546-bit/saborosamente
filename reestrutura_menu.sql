-- Reestrutura as respostas fixas para o novo menu (8 itens).
-- Novas/atualizadas via upsert por chave; antigas soltas desativadas.

INSERT INTO public.agente_respostas_fixas (chave, titulo, conteudo, ordem) VALUES
(
  'duvida_descontos',
  '🏷️ Descontos',
  'Quanto mais marmitas, mais você economiza! 😄 Temos desconto progressivo:

• 5 ou mais marmitas → 3% de desconto
• 10 ou mais marmitas → 5% de desconto
• 20 ou mais marmitas → 7% de desconto

O desconto vale sobre as marmitas e é aplicado automaticamente conforme a quantidade do seu pedido. 🍱',
  2
),
(
  'duvida_como_funciona',
  '📋 Como funciona',
  'Nossas marmitas são congeladas e prontas em minutos! 😋

*Como preparar (no micro-ondas):*
• 150g → 2 a 3 minutos
• 200g → 4 minutos
• 300g → 6 minutos
• 400g → 7 minutos
Os tempos podem variar conforme a potência do aparelho. Aqueça até ficar bem quente por igual.

*Validade e armazenamento:*
• Validade de 6 meses mantendo no freezer/congelador.
• Depois de aquecida, consuma na hora e não recongele. ❄️',
  4
),
(
  'duvida_entrega',
  '🚚 Entrega e pedido mínimo',
  'Entregamos nas cidades da região 😊 Me diga sua cidade e bairro que confirmo a taxa certinha!

*Pedido mínimo por cidade:*
• São Bento do Sul → mínimo de 2 unidades
• Rio Negrinho, Campo Alegre, Piên, Corupá, Rio Negro e Mafra → mínimo de 5 unidades

As unidades podem ser qualquer combinação de marmitas, sopas e combos. 📦',
  5
),
(
  'menu_site',
  '🌐 Acessar o site',
  '🌐 Acesse nosso site para ver o cardápio completo, fazer pedidos e acompanhar entregas:

www.saborosamente.com',
  7
)
ON CONFLICT (chave) DO UPDATE
  SET titulo = EXCLUDED.titulo,
      conteudo = EXCLUDED.conteudo,
      ordem = EXCLUDED.ordem,
      ativo = true,
      updated_at = now();

-- Desativa as dúvidas antigas separadas (agora fundidas em "Como funciona" e
-- "Entrega e pedido mínimo"). Ficam no histórico, mas somem do menu.
UPDATE public.agente_respostas_fixas
  SET ativo = false, updated_at = now()
  WHERE chave IN ('duvida_preparo', 'duvida_validade', 'duvida_minimo');

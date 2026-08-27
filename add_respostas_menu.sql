-- Adiciona as respostas fixas das demais opções do menu (rede de segurança
-- editável no admin). Placeholder {nome} é substituído pelo primeiro nome do
-- cliente na edge (quando houver). Upsert por chave (não duplica).
INSERT INTO public.agente_respostas_fixas (chave, titulo, conteudo, ordem) VALUES
(
  'menu_pedido',
  '🛒 Fazer um pedido',
  'Perfeito, {nome}! 🛒 Vou te conectar com nossa equipe pra fazer seu pedido certinho. Um momento!',
  0
),
(
  'menu_cardapio',
  '🍽️ Cardápio',
  'Aqui está o nosso cardápio 😋 Dá uma olhada e me chama se quiser fazer um pedido!',
  1
),
(
  'menu_site',
  '🌐 Acessar o site',
  '🌐 Acesse nosso site para ver o cardápio completo, fazer pedidos e acompanhar entregas:

https://saborosamente.vercel.app',
  6
),
(
  'menu_atendente',
  '👤 Falar com atendente',
  'Tudo bem, {nome}! 😊 Vou te conectar com nossa equipe agora. Um momento!',
  7
),
(
  'duvida_entrega',
  '🚚 Entrega e frete',
  'Entregamos nas cidades da região 😊 Veja o valor a partir de quanto para cada uma. Me diga sua cidade e bairro que confirmo a taxa certinha!',
  1
)
ON CONFLICT (chave) DO UPDATE
  SET titulo = EXCLUDED.titulo,
      conteudo = EXCLUDED.conteudo,
      ordem = EXCLUDED.ordem,
      updated_at = now();

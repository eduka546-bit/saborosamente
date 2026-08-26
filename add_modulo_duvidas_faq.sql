-- Adiciona 3 módulos de dúvidas frequentes que não tinham conteúdo cadastrado:
-- preparo, validade (6 meses) e pedido mínimo.
-- Informações confirmadas pelo dono do negócio (não inventadas).

INSERT INTO public.agente_modulos (nome, categoria, conteudo, ativo, ordem) VALUES
(
  'Modo de preparo das marmitas',
  'pedidos',
  'COMO PREPARAR AS MARMITAS CONGELADAS (informação oficial cadastrada):

As marmitas SaborosaMente vêm congeladas. Para preparar no micro-ondas, o tempo varia conforme a gramatura da marmita:

- 150g → 2 a 3 minutos
- 200g → 4 minutos
- 300g → 6 minutos
- 400g → 7 minutos

ORIENTAÇÕES:
- Os tempos são no micro-ondas e podem variar um pouco conforme a potência do aparelho.
- Oriente o cliente a aquecer até ficar bem quente por igual.
- Se o cliente perguntar o tempo de uma gramatura que não está na lista acima, NÃO invente: diga que vai confirmar com a equipe.

Responda de forma curta e natural. Se o cliente não disser a gramatura, pergunte qual marmita ele tem para informar o tempo certo.',
  true,
  33
),
(
  'Validade e armazenamento',
  'pedidos',
  'VALIDADE E ARMAZENAMENTO (informação oficial cadastrada):

As marmitas congeladas da SaborosaMente têm validade de 6 meses, desde que mantidas congeladas no freezer.

ORIENTAÇÕES:
- Mantenha sempre no freezer/congelador até o momento de preparar.
- A validade de 6 meses vale para o produto conservado corretamente congelado.
- Depois de aquecida, a marmita deve ser consumida na hora, não recongele.

Responda de forma curta e natural quando o cliente perguntar quanto tempo dura ou como guardar.',
  true,
  34
),
(
  'Pedido mínimo',
  'pedidos',
  'PEDIDO MÍNIMO (informação oficial cadastrada):

O pedido mínimo depende da cidade de entrega:

- São Bento do Sul → mínimo de 2 unidades
- Rio Negrinho, Campo Alegre, Piên, Corupá, Rio Negro e Mafra → mínimo de 5 unidades

ORIENTAÇÕES:
- Antes de informar o mínimo, identifique a cidade do cliente.
- Unidades podem ser qualquer combinação de produtos (marmitas, sopas, combos etc.), a menos que o sistema indique o contrário.
- Se a cidade não estiver na lista de entrega, informe que ainda não entregamos ali e ofereça a retirada na loja física em São Bento do Sul/SC.

Responda de forma curta e natural.',
  true,
  35
);

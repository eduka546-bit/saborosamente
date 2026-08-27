-- ============================================================
-- FAQ: perguntas frequentes iniciais + coluna de WhatsApp de atendente
-- ============================================================

-- ── site_settings: garante colunas de contato (idempotente) ──
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS contato_whatsapp        text,
  ADD COLUMN IF NOT EXISTS contato_whatsapp_humano text,
  ADD COLUMN IF NOT EXISTS contato_instagram       text,
  ADD COLUMN IF NOT EXISTS contato_email           text;

-- ── FAQ: garante a tabela (idempotente) ──
CREATE TABLE IF NOT EXISTS public.faq (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta   text NOT NULL,
  resposta   text NOT NULL,
  ordem      int NOT NULL DEFAULT 0,
  ativo      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed idempotente: só insere se a pergunta ainda não existir.
INSERT INTO public.faq (pergunta, resposta, ordem, ativo)
SELECT v.pergunta, v.resposta, v.ordem, true
FROM (VALUES
  (
    'As marmitas são congeladas? Como devo conservar?',
    'Sim. Nossas marmitas chegam congeladas e devem ser mantidas no freezer. Assim elas conservam o sabor e os nutrientes por bem mais tempo. Antes de comer, é só aquecer conforme as instruções da embalagem.',
    0
  ),
  (
    'Como faço para aquecer a marmita?',
    'No micro-ondas: retire o filme/tampa parcialmente e aqueça por alguns minutos, mexendo na metade do tempo. Também é possível aquecer em banho-maria. O tempo varia conforme a potência do aparelho e o tamanho da marmita (P, M ou G).',
    1
  ),
  (
    'Qual a validade das marmitas congeladas?',
    'Mantidas sempre no freezer, as marmitas duram vários meses. A data de validade recomendada vem indicada na embalagem de cada produto.',
    2
  ),
  (
    'Como funciona o desconto por quantidade?',
    'Quanto mais marmitas você leva, menor fica o preço de cada uma. Os preços caem por faixa de quantidade: a partir de 5, de 10 e de 20 unidades. O valor com desconto aparece automaticamente no card de cada produto e no carrinho, conforme você adiciona itens.',
    3
  ),
  (
    'As sopas e complementos também entram no desconto?',
    'As sopas e complementos contam para atingir a faixa de quantidade, mas o desconto de preço se aplica às marmitas. Ou seja, eles ajudam você a chegar mais rápido na próxima faixa de desconto das marmitas.',
    4
  ),
  (
    'Como funcionam os combos prontos?',
    'Os combos prontos (de 5, 10 ou 20 unidades) já vêm com um preço fechado. Eles contam na quantidade total do pedido: se você pega um combo de 5 e adiciona mais uma marmita avulsa, essa unidade extra já entra com o desconto da faixa correspondente.',
    5
  ),
  (
    'Como funciona o cashback?',
    'A cada pedido você acumula cashback para usar em compras futuras. O crédito é liberado quando o pedido é concluído (entregue). Pedidos não finalizados não geram cashback.',
    6
  ),
  (
    'Quais são as formas de pagamento?',
    'Aceitamos PIX e cartão. No PIX você recebe o QR Code para pagar na hora. As opções disponíveis aparecem no checkout ao finalizar o pedido.',
    7
  ),
  (
    'Como funciona a entrega?',
    'Trabalhamos com entrega programada. Ao finalizar o pedido você escolhe a data/janela disponível de entrega. A taxa é calculada conforme a sua região no momento do checkout.',
    8
  ),
  (
    'Vocês entregam na minha região?',
    'Atendemos São Bento do Sul/SC e regiões próximas. Ao informar seu endereço no checkout, o sistema mostra se a entrega está disponível e qual a taxa. Em caso de dúvida, chame a gente no WhatsApp.',
    9
  ),
  (
    'Qual o pedido mínimo?',
    'O valor ou quantidade mínima, quando houver, é informado no carrinho e no checkout antes de finalizar. Assim você acompanha tudo antes de confirmar o pedido.',
    10
  ),
  (
    'Como acompanho o status do meu pedido?',
    'Você recebe atualizações do pedido pelo WhatsApp e por e-mail. O protocolo do pedido fica no e-mail de confirmação e na mensagem do WhatsApp.',
    11
  ),
  (
    'Posso alterar ou cancelar meu pedido?',
    'Alterações e cancelamentos dependem do estágio de preparo. Quanto antes você avisar, mais fácil de ajustar. Fale com a gente pelo WhatsApp o quanto antes para verificarmos o que é possível.',
    12
  ),
  (
    'Falo com uma pessoa ou com um robô no WhatsApp?',
    'No WhatsApp principal você é atendido pela nossa assistente virtual (Saborosa), que responde na hora, mostra o cardápio e registra pedidos. Se preferir falar com um atendente, é só pedir a transferência ou usar o número de atendimento humano informado na página Fale Conosco.',
    13
  ),
  (
    'As marmitas têm informações nutricionais e restrições?',
    'Sim. Cada produto traz descrição, informações nutricionais (calorias, carboidratos, proteínas) e indicações de restrições como glúten e lactose, disponíveis na página do produto.',
    14
  )
) AS v(pergunta, resposta, ordem)
WHERE NOT EXISTS (
  SELECT 1 FROM public.faq f WHERE f.pergunta = v.pergunta
);

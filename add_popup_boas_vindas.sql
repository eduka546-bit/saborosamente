-- Popup de boas-vindas configurável
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS popup_boas_vindas jsonb DEFAULT '{
    "ativo": false,
    "imagem_url": "",
    "titulo": "Somos um Atacado de Marmitas, Sopas e Refeições Congeladas!",
    "texto": "Porque comprar de uma só marca se você tem as melhores, tudo em um só lugar, a preço de atacado!",
    "itens": [
      "Selecionamos +60 opções de 3 marcas diferentes para você não enjoar nunca!",
      "Embalagens seguras, livres de BPA, esquente no micro sem medo, prontas em até 7min",
      "São entregas congeladas, com 6 meses de validade",
      "Temperos naturais, sem conservantes e sem industrializados",
      "Criadas por Chefs e assinadas por nossa Nutri"
    ],
    "cupom_codigo": "PRIMEIRACOMPRA",
    "cupom_desconto": "5% de desconto",
    "cupom_texto": "Primeira compra? Use o cupom:",
    "whatsapp": "",
    "whatsapp_texto": "Marmitas personalizadas? WhatsApp:",
    "botao_texto": "Ver cardápio",
    "botao_link": "#cardapio",
    "delay_segundos": 1
  }'::jsonb;

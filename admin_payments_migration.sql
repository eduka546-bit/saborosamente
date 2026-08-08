-- Adicionar coluna de métodos de pagamento na tabela site_settings
ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[
  {"id": "pix", "label": "PIX", "hint": "Na entrega", "icon": "https://logospng.org/download/pix/logo-pix-icone-512.png", "enabled": true},
  {"id": "cartao", "label": "Cartão", "hint": "Crédito/Débito", "icon": "https://cdn-icons-png.flaticon.com/512/6963/6963703.png", "enabled": true},
  {"id": "alimentacao", "label": "Alimentação", "hint": "Refeição/VR", "icon": "https://cdn-icons-png.flaticon.com/512/2737/2737034.png", "enabled": true},
  {"id": "mercadopago", "label": "Mercado Pago", "hint": "Link", "icon": "https://logospng.org/download/mercado-pago/logo-mercado-pago-icone-1024.png", "enabled": true},
  {"id": "dinheiro", "label": "Dinheiro", "hint": "Na entrega", "icon": "https://cdn-icons-png.flaticon.com/512/2489/2489756.png", "enabled": true}
]'::jsonb,
ADD COLUMN IF NOT EXISTS card_flags JSONB DEFAULT '[
  {"name": "Visa", "logo": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg", "enabled": true},
  {"name": "Mastercard", "logo": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg", "enabled": true},
  {"name": "Hiper", "logo": "https://logodownload.org/wp-content/uploads/2015/05/hiper-logo.png", "enabled": true},
  {"name": "Elo", "logo": "https://upload.wikimedia.org/wikipedia/commons/0/03/Logo_Elo_cortado.png", "enabled": true},
  {"name": "Hipercard", "logo": "https://upload.wikimedia.org/wikipedia/commons/b/b2/Hipercard_logo.svg", "enabled": true},
  {"name": "Diners Club", "logo": "https://upload.wikimedia.org/wikipedia/commons/a/a6/Diners_Club_Logo3.svg", "enabled": true},
  {"name": "American Express", "logo": "https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg", "enabled": true}
]'::jsonb,
ADD COLUMN IF NOT EXISTS meal_flags JSONB DEFAULT '[
  {"name": "VR", "logo": "https://vrsolucao.com.br/wp-content/uploads/2021/05/logo-vr.png", "enabled": true},
  {"name": "Ticket", "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Ticket_Logotipo.svg/1200px-Ticket_Logotipo.svg.png", "enabled": true},
  {"name": "Alelo", "logo": "https://upload.wikimedia.org/wikipedia/commons/e/e9/Alelo_logo.svg", "enabled": true},
  {"name": "Pluxee", "logo": "https://logodownload.org/wp-content/uploads/2023/11/pluxee-logo.png", "enabled": true},
  {"name": "Sodexo", "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Sodexo_logo.svg/1200px-Sodexo_logo.svg.png", "enabled": true},
  {"name": "Caju", "logo": "https://media.licdn.com/dms/image/C4D0BAQG5k6Uv8xXkWA/company-logo_200_200/0/1630571932371?e=2147483647&v=beta&t=4m1O9nE7qI_pT_k5i_0i_0Y_0o_0o_0o_0", "enabled": true},
  {"name": "Flash", "logo": "https://vagas.com.br/logos-empresas/81254/original.png", "enabled": true}
]'::jsonb;

NOTIFY pgrst, 'reload schema';

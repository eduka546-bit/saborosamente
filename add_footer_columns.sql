-- Adiciona colunas de configuração do footer na tabela site_settings
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS footer_logo_url       text,
  ADD COLUMN IF NOT EXISTS footer_whatsapp       text,
  ADD COLUMN IF NOT EXISTS footer_instagram      text,
  ADD COLUMN IF NOT EXISTS footer_address_line1  text,
  ADD COLUMN IF NOT EXISTS footer_address_line2  text,
  ADD COLUMN IF NOT EXISTS footer_address_cep    text,
  ADD COLUMN IF NOT EXISTS footer_maps_url       text,
  ADD COLUMN IF NOT EXISTS footer_description    text,
  ADD COLUMN IF NOT EXISTS footer_credit         text;

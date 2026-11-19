-- A chave global pausa a automação sem reassumir conversas atribuídas à equipe.
-- Novas conversas respeitam a chave; o modo existente só muda por ação explícita.
CREATE OR REPLACE FUNCTION public.sincronizar_modo_ia_global()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_TABLE_SCHEMA = 'public'
     AND TG_TABLE_NAME = 'whatsapp_conversas'
     AND TG_OP = 'INSERT' THEN
    IF NOT COALESCE((SELECT ativo FROM public.agente_config
                     ORDER BY updated_at DESC NULLS LAST LIMIT 1), false) THEN
      NEW.modo := 'humano';
    ELSE
      NEW.modo := COALESCE(NEW.modo, 'ia');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sincronizar_modo_ia_global() FROM PUBLIC, anon, authenticated;

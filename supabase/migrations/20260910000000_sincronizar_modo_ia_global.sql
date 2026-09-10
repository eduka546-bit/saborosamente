-- ============================================================
-- Modo IA global do atendimento WhatsApp
--
-- IA desligada  -> novas e existentes conversas ficam com humano.
-- IA ligada     -> conversas retornam para a IA.
-- Isso evita que mensagens recebidas enquanto a IA está pausada
-- fiquem esquecidas/sem responsável.
-- ============================================================

CREATE OR REPLACE FUNCTION public.sincronizar_modo_ia_global()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nova conversa: respeita o estado global da IA.
  IF TG_OP = 'INSERT' THEN
    IF COALESCE(
      (SELECT ativo FROM public.agente_config
       ORDER BY updated_at DESC NULLS LAST
       LIMIT 1),
      true
    ) = false THEN
      NEW.modo := 'humano';
    ELSE
      NEW.modo := COALESCE(NEW.modo, 'ia');
    END IF;
    RETURN NEW;
  END IF;

  -- Ao desligar a IA, entrega todas as conversas ao humano.
  -- Ao ligar novamente, devolve todas à IA, conforme solicitado.
  IF TG_OP = 'UPDATE' AND OLD.ativo IS DISTINCT FROM NEW.ativo THEN
    IF NEW.ativo = false THEN
      UPDATE public.whatsapp_conversas SET modo = 'humano';
    ELSE
      UPDATE public.whatsapp_conversas SET modo = 'ia';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sincronizar_modo_ia_global ON public.agente_config;
CREATE TRIGGER trg_sincronizar_modo_ia_global
AFTER INSERT OR UPDATE OF ativo ON public.agente_config
FOR EACH ROW
EXECUTE FUNCTION public.sincronizar_modo_ia_global();

DROP TRIGGER IF EXISTS trg_nova_conversa_respeita_modo_ia ON public.whatsapp_conversas;
CREATE TRIGGER trg_nova_conversa_respeita_modo_ia
BEFORE INSERT ON public.whatsapp_conversas
FOR EACH ROW
EXECUTE FUNCTION public.sincronizar_modo_ia_global();

-- Se a IA estiver atualmente desligada, sincroniza o estado imediatamente.
UPDATE public.whatsapp_conversas
SET modo = 'humano'
WHERE COALESCE(
  (SELECT ativo FROM public.agente_config
   ORDER BY updated_at DESC NULLS LAST
   LIMIT 1),
  true
) = false;

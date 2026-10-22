-- Corrige erro "UPDATE requires a WHERE clause" ao ligar/desligar
-- a IA no painel, causado pelo trigger global desatualizado.
-- Não modifica o estado atual do bot; somente o comportamento futuro do toggle.

CREATE OR REPLACE FUNCTION public.sincronizar_modo_ia_global()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Esta mesma função atende dois triggers diferentes. Não acessar new.modo
  -- quando a tabela disparadora for agente_config (essa coluna não existe).
  IF TG_TABLE_SCHEMA = 'public'
     AND TG_TABLE_NAME = 'whatsapp_conversas'
     AND TG_OP = 'INSERT' THEN
    IF (SELECT COALESCE(ativo, false)
        FROM public.agente_config
        ORDER BY updated_at DESC NULLS LAST
        LIMIT 1) = false THEN
      NEW.modo := 'humano';
    ELSE
      NEW.modo := COALESCE(NEW.modo, 'ia');
    END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_SCHEMA = 'public'
     AND TG_TABLE_NAME = 'agente_config'
     AND TG_OP = 'UPDATE'
     AND OLD.ativo IS DISTINCT FROM NEW.ativo THEN

    IF NEW.ativo THEN
      -- Ao reativar o bot, retomar conversas pausadas globalmente,
      -- preservando possíveis atendimentos humanos recentes.
      UPDATE public.whatsapp_conversas AS c
      SET modo = 'ia'
      WHERE c.modo = 'humano'
        AND (c.pedido_em_andamento IS NULL OR c.pedido_em_andamento = 'null'::jsonb)
        AND NOT EXISTS (
          SELECT 1 FROM public.agente_eventos e
          WHERE e.conversa_id = c.id
            AND e.tipo = 'escalacao_humano'
            AND e.created_at >= now() - interval '6 hours'
        )
        AND NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(
            CASE WHEN jsonb_typeof(c.mensagens) = 'array'
                 THEN c.mensagens ELSE '[]'::jsonb END
          ) AS m(item)
          WHERE m.item->>'manual' = 'true'
            AND m.item->>'timestamp' ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}T'
            AND (m.item->>'timestamp')::timestamptz >= now() - interval '6 hours'
        );
    ELSE
      -- Desligamento global sem atualizar linhas que já estão em modo humano.
      UPDATE public.whatsapp_conversas
      SET modo = 'humano'
      WHERE modo = 'ia';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sincronizar_modo_ia_global() FROM PUBLIC, anon, authenticated;

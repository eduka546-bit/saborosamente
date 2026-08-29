/**
 * Hook compartilhado: tabela de preços das marmitas (editável no admin →
 * Parâmetros → "Preços das Marmitas"). Todos os pontos que exibem/calculam
 * preço de marmita devem usar este hook para que a edição no admin valha em
 * TODO o site (card, modal de detalhe, combo builder) e não só no carrinho.
 *
 * Usa a mesma query key do carrinho ("site-settings-precos"), então o React
 * Query compartilha o cache — uma única requisição para todos os consumidores.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  normalizarPrecosMarmita,
  type TabelaPrecosMarmita,
} from "@/lib/combo-rules";

export function usePrecosMarmita(): TabelaPrecosMarmita {
  const { data } = useQuery({
    queryKey: ["site-settings-precos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("parametros_loja")
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  return normalizarPrecosMarmita((data as any)?.parametros_loja?.precos_marmita);
}

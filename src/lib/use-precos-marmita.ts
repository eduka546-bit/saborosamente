import { useBlackFridayActive, blackFridayPrice } from "@/lib/black-friday";
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
  const bfActive = useBlackFridayActive();
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

  if(bfActive) return {"200g":{unit:14,t5:14,t10:14,t20:14},"300g":{unit:17,t5:17,t10:17,t20:17},"400g":{unit:20,t5:20,t10:20,t20:20}};
  return normalizarPrecosMarmita((data as any)?.parametros_loja?.precos_marmita);
}

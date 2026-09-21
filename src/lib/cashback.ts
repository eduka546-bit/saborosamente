import { supabase } from "@/integrations/supabase/client";

/** Busca configuração pública do programa de cashback. */
export async function getCashbackConfig() {
  const { data } = await supabase
    .from("site_settings")
    .select(
      "cashback_percentual, cashback_validade_dias, cashback_minimo_uso, cashback_limite_desconto_pct, cashback_ativo",
    )
    .maybeSingle();

  return {
    ativo: (data as any)?.cashback_ativo !== false,
    percentual: Number((data as any)?.cashback_percentual ?? 1) / 100,
    validade_dias: Number((data as any)?.cashback_validade_dias ?? 30),
    minimo_uso: Number((data as any)?.cashback_minimo_uso ?? 3),
    limite_desconto_pct: Number((data as any)?.cashback_limite_desconto_pct ?? 15) / 100,
  };
}

/**
 * Busca o saldo válido do usuário.
 * A RPC também expira créditos vencidos antes de devolver o saldo.
 */
export async function getSaldo(userId: string): Promise<number> {
  if (!userId) return 0;
  const { data, error } = await supabase.rpc("cashback_saldo_disponivel", {
    p_user_id: userId,
  });
  if (error) {
    console.warn("[cashback] não foi possível atualizar o saldo:", error.message);
    return 0;
  }
  return Number(data ?? 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Funções puras de cálculo (testáveis, sem dependência de banco)
// ─────────────────────────────────────────────────────────────────────────────

export interface CashbackConfigCalc {
  ativo: boolean;
  /** Fração (ex.: 0.01 para 1%). */
  percentual: number;
  /** Saldo mínimo necessário para poder usar cashback. */
  minimo_uso: number;
  /** Fração máxima do valor dos produtos que pode ser paga com cashback. */
  limite_desconto_pct: number;
}

/** Quanto de cashback é creditado por um pedido entregue. */
export function calcularCashbackCreditado(
  valorPedido: number,
  config: Pick<CashbackConfigCalc, "ativo" | "percentual">,
): number {
  if (!config.ativo) return 0;
  const valor = valorPedido * config.percentual;
  return valor > 0 ? valor : 0;
}

/**
 * Quanto de cashback pode ser usado como desconto.
 * Limitado por saldo, mínimo de uso e teto percentual configurado.
 * @param totalLiquido valor líquido dos produtos, sem frete
 */
export function calcularCashbackUtilizavel(
  saldo: number,
  totalLiquido: number,
  config: Pick<CashbackConfigCalc, "ativo" | "minimo_uso" | "limite_desconto_pct">,
): number {
  if (!config.ativo) return 0;
  if (saldo <= 0 || totalLiquido <= 0) return 0;
  if (saldo < config.minimo_uso) return 0;

  const tetoPorPercentual = totalLiquido * config.limite_desconto_pct;
  const utilizavel = Math.min(saldo, tetoPorPercentual);
  return utilizavel > 0 ? utilizavel : 0;
}

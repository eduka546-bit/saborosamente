import { supabase } from "@/integrations/supabase/client";

/** Busca config de cashback do banco */
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
    minimo_uso: Number((data as any)?.cashback_minimo_uso ?? 5),
    limite_desconto_pct: Number((data as any)?.cashback_limite_desconto_pct ?? 10) / 100,
  };
}

/** Busca saldo de cashback do usuário */
export async function getSaldo(userId: string): Promise<number> {
  const { data } = await supabase
    .from("cashback_saldo")
    .select("saldo")
    .eq("user_id", userId)
    .maybeSingle();
  return Number((data as any)?.saldo ?? 0);
}

/** Credita cashback após pedido */
export async function creditarCashback(userId: string, pedidoId: string, valorPedido: number) {
  const config = await getCashbackConfig();
  if (!config.ativo) return;

  const valor = valorPedido * config.percentual;
  if (valor <= 0) return;

  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + config.validade_dias);

  // Insere transação
  await supabase.from("cashback_transacoes").insert({
    user_id: userId,
    pedido_id: pedidoId,
    tipo: "recebido",
    valor,
    descricao: `Cashback de pedido — ${config.percentual * 100}%`,
    expira_em: expiraEm.toISOString(),
  });

  // Atualiza saldo (upsert)
  const saldoAtual = await getSaldo(userId);
  await supabase.from("cashback_saldo").upsert({
    user_id: userId,
    saldo: saldoAtual + valor,
    updated_at: new Date().toISOString(),
  });
}

/** Usa cashback no pedido */
export async function usarCashback(userId: string, pedidoId: string, valorUsado: number) {
  if (valorUsado <= 0) return;

  await supabase.from("cashback_transacoes").insert({
    user_id: userId,
    pedido_id: pedidoId,
    tipo: "usado",
    valor: valorUsado,
    descricao: "Desconto com cashback",
  });

  const saldoAtual = await getSaldo(userId);
  await supabase.from("cashback_saldo").upsert({
    user_id: userId,
    saldo: Math.max(0, saldoAtual - valorUsado),
    updated_at: new Date().toISOString(),
  });
}

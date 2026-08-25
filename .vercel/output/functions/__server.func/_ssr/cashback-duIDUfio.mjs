import { t as supabase } from "./client-BvgAz7YC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/cashback-duIDUfio.js
/** Busca config de cashback do banco */
async function getCashbackConfig() {
	const { data } = await supabase.from("site_settings").select("cashback_percentual, cashback_validade_dias, cashback_minimo_uso, cashback_limite_desconto_pct, cashback_ativo").maybeSingle();
	return {
		ativo: data?.cashback_ativo !== false,
		percentual: Number(data?.cashback_percentual ?? 1) / 100,
		validade_dias: Number(data?.cashback_validade_dias ?? 30),
		minimo_uso: Number(data?.cashback_minimo_uso ?? 5),
		limite_desconto_pct: Number(data?.cashback_limite_desconto_pct ?? 10) / 100
	};
}
/** Busca saldo de cashback do usuário */
async function getSaldo(userId) {
	const { data } = await supabase.from("cashback_saldo").select("saldo").eq("user_id", userId).maybeSingle();
	return Number(data?.saldo ?? 0);
}
/** Credita cashback após pedido */
async function creditarCashback(userId, pedidoId, valorPedido) {
	const config = await getCashbackConfig();
	if (!config.ativo) return;
	const valor = valorPedido * config.percentual;
	if (valor <= 0) return;
	const expiraEm = /* @__PURE__ */ new Date();
	expiraEm.setDate(expiraEm.getDate() + config.validade_dias);
	await supabase.from("cashback_transacoes").insert({
		user_id: userId,
		pedido_id: pedidoId,
		tipo: "recebido",
		valor,
		descricao: `Cashback de pedido — ${config.percentual * 100}%`,
		expira_em: expiraEm.toISOString()
	});
	const saldoAtual = await getSaldo(userId);
	await supabase.from("cashback_saldo").upsert({
		user_id: userId,
		saldo: saldoAtual + valor,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	});
}
/** Usa cashback no pedido */
async function usarCashback(userId, pedidoId, valorUsado) {
	if (valorUsado <= 0) return;
	await supabase.from("cashback_transacoes").insert({
		user_id: userId,
		pedido_id: pedidoId,
		tipo: "usado",
		valor: valorUsado,
		descricao: "Desconto com cashback"
	});
	const saldoAtual = await getSaldo(userId);
	await supabase.from("cashback_saldo").upsert({
		user_id: userId,
		saldo: Math.max(0, saldoAtual - valorUsado),
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	});
}
//#endregion
export { usarCashback as i, getCashbackConfig as n, getSaldo as r, creditarCashback as t };

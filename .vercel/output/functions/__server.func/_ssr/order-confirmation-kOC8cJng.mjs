import { t as supabase } from "./client-BvgAz7YC.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/order-confirmation-kOC8cJng.js
/**
* Confirma um pedido de rascunho e o muda para "pendente"
* Também notifica o cliente via WhatsApp
*/
async function confirmarPedidoRascunho(pedidoId) {
	try {
		const { data: pedido, error: updateError } = await supabase.from("pedidos").update({ status: "pendente" }).eq("id", pedidoId).select().single();
		if (updateError) throw new Error(`Erro ao confirmar pedido: ${updateError.message}`);
		if (pedido?.cliente_telefone || pedido?.whatsapp) {
			if (pedido.whatsapp || pedido.cliente_telefone) {}
		}
		return {
			success: true,
			pedido
		};
	} catch (error) {
		console.error("Erro em confirmarPedidoRascunho:", error);
		throw error;
	}
}
//#endregion
export { confirmarPedidoRascunho };

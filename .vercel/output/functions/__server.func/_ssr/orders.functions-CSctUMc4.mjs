import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { c as createServerFn } from "./createServerFn-CIHAFgYl.mjs";
import { a as stringType, i as objectType, n as enumType, r as numberType, t as arrayType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-B90ckaqP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orders.functions-CSctUMc4.js
function createServerClient() {
	const url = process.env.SUPABASE_URL ?? "https://lxcgbrovdmpjatywweiv.supabase.co";
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? void 0;
	if (!key) {
		console.warn("[server] SUPABASE_SERVICE_ROLE_KEY not set, falling back to anon key");
		return createClient(url, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Y2dicm92ZG1wamF0eXd3ZWl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MzU2MDksImV4cCI6MjEwMTAxMTYwOX0.IjYsxY8uFKWKiv7sdvejZ5KMqgdlZFV-efLtfbBPsWg", { auth: {
			persistSession: false,
			autoRefreshToken: false
		} });
	}
	return createClient(url, key, { auth: {
		persistSession: false,
		autoRefreshToken: false
	} });
}
var orderItemSchema = objectType({
	productId: stringType(),
	quantity: numberType(),
	weight: stringType().optional(),
	price: numberType()
});
var createOrderSchema = objectType({
	nome: stringType(),
	email: stringType(),
	telefone: stringType(),
	metodoEntrega: enumType(["entrega", "retirada"]),
	horarioEntrega: stringType(),
	cidade: stringType().optional(),
	bairro: stringType().optional(),
	endereco: stringType().optional(),
	complemento: stringType().optional(),
	cep: stringType().optional(),
	pagamento: stringType(),
	observacoes: stringType().optional(),
	valorTotal: numberType(),
	taxaEntrega: numberType(),
	userId: stringType().uuid().optional(),
	desconto: numberType(),
	cupom: stringType().optional(),
	items: arrayType(orderItemSchema),
	troco: stringType().optional(),
	tipoCartao: stringType().optional()
});
var createOrder_createServerFn_handler = createServerRpc({
	id: "7f92d135aa3763ddd5bf6d4d9f84832b6b591cbaa35dcc4048b4b1beed8e7bf3",
	name: "createOrder",
	filename: "src/lib/orders.functions.ts"
}, (opts) => createOrder.__executeServer(opts));
var createOrder = createServerFn({ method: "POST" }).validator((data) => createOrderSchema.parse(data)).handler(createOrder_createServerFn_handler, async ({ data }) => {
	const supabase = createServerClient();
	if (data.cupom) {
		const { data: cupom, error: cupomError } = await supabase.from("cupons").select("codigo, ativo, validade, uso, max_uso, apenas_primeira_compra").eq("codigo", data.cupom).maybeSingle();
		if (cupomError) throw new Error("Erro ao validar o cupom.");
		if (!cupom || cupom.ativo === false) throw new Error("Cupom inválido ou inativo.");
		if (cupom.validade && new Date(cupom.validade) < /* @__PURE__ */ new Date()) throw new Error("Este cupom expirou.");
		if (cupom.max_uso !== null && cupom.max_uso !== void 0 && (cupom.uso ?? 0) >= cupom.max_uso) throw new Error("Este cupom já atingiu o limite de usos.");
		if (cupom.apenas_primeira_compra) {
			const query = supabase.from("pedidos").select("id", {
				count: "exact",
				head: true
			}).neq("status", "Cancelado");
			const ors = [];
			if (data.userId) ors.push(`user_id.eq.${data.userId}`);
			if (data.email) ors.push(`email_cliente.eq.${data.email}`);
			if (data.telefone) ors.push(`telefone_cliente.eq.${data.telefone}`);
			if (ors.length > 0) {
				const { count } = await query.or(ors.join(","));
				if ((count ?? 0) > 0) throw new Error("Este cupom é exclusivo para a primeira compra.");
			}
		}
	}
	const insertData = {
		user_id: data.userId ?? null,
		nome_cliente: data.nome,
		telefone_cliente: data.telefone,
		email_cliente: data.email,
		metodo_entrega: data.metodoEntrega,
		horario_recebimento: data.horarioEntrega,
		metodo_pagamento: data.pagamento,
		observacao: [
			data.observacoes,
			data.troco ? `Troco para: ${data.troco}` : null,
			data.tipoCartao ? `Cartão: ${data.tipoCartao}` : null
		].filter(Boolean).join(" | "),
		valor_total: data.valorTotal,
		taxa_entrega: data.taxaEntrega,
		desconto_aplicado: data.desconto ?? 0,
		cupom_codigo: data.cupom || null,
		troco: data.troco || null,
		tipo_cartao: data.tipoCartao || null,
		status: "rascunho"
	};
	if (data.metodoEntrega === "entrega") {
		if (data.cidade) insertData.endereco_cidade = data.cidade;
		if (data.bairro) insertData.endereco_bairro = data.bairro;
		if (data.endereco) insertData.endereco_rua = data.endereco;
		if (data.complemento) insertData.endereco_complemento = data.complemento;
		if (data.cep) insertData.endereco_cep = data.cep;
	}
	const { data: order, error: orderError } = await supabase.from("pedidos").insert(insertData).select().single();
	if (orderError) throw new Error(orderError.message);
	const itemsToInsert = data.items.map((item) => ({
		pedido_id: order.id,
		produto_id: item.productId,
		quantidade: item.quantity,
		preco_unitario: item.price,
		observacao: item.weight ? `Peso: ${item.weight}` : null
	}));
	const { error: itemsError } = await supabase.from("pedido_itens").insert(itemsToInsert);
	if (itemsError) throw new Error(itemsError.message);
	if (data.cupom) {
		const { error: cupomUsoError } = await supabase.rpc("incrementar_uso_cupom", { p_codigo: data.cupom });
		if (cupomUsoError) console.error("Falha ao incrementar uso do cupom:", cupomUsoError.message);
	}
	return order;
});
//#endregion
export { createOrder_createServerFn_handler };

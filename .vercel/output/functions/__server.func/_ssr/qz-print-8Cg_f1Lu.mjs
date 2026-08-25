//#region node_modules/.nitro/vite/services/ssr/assets/qz-print-8Cg_f1Lu.js
var QZ_CDN = "/qz-tray.js";
var qzLoaded = false;
async function loadQzScript() {
	if (qzLoaded) return;
	return new Promise((resolve, reject) => {
		if (document.getElementById("qz-tray-script")) {
			qzLoaded = true;
			resolve();
			return;
		}
		const script = document.createElement("script");
		script.id = "qz-tray-script";
		script.src = QZ_CDN;
		script.onload = () => {
			qzLoaded = true;
			resolve();
		};
		script.onerror = () => reject(/* @__PURE__ */ new Error("Não foi possível carregar o script QZ Tray do CDN."));
		document.head.appendChild(script);
	});
}
async function conectarQZ() {
	try {
		await loadQzScript();
		if (typeof qz === "undefined") return false;
		qz.security.setCertificatePromise((_resolve, _reject) => {
			_resolve("-----BEGIN CERTIFICATE REQUEST-----\nMIIByjCCATMCAQAwgYkx...\n-----END CERTIFICATE REQUEST-----");
		});
		qz.security.setSignatureAlgorithm("SHA512");
		qz.security.setSignaturePromise((_hash) => {
			return (_resolve, _reject) => _resolve();
		});
		if (qz.websocket.isActive()) return true;
		await qz.websocket.connect({
			host: "localhost",
			port: {
				secure: [8181],
				insecure: [8182]
			}
		});
		return true;
	} catch (e) {
		console.warn("QZ Tray não está rodando:", e?.message ?? e);
		return false;
	}
}
async function qzDisponivel() {
	try {
		await loadQzScript();
		if (typeof qz === "undefined") return false;
		if (qz.websocket.isActive()) return true;
		return await conectarQZ();
	} catch {
		return false;
	}
}
function gerarConteudoComanda(order, colunas = 32) {
	const c = (t) => {
		const len = Math.min(t.length, colunas);
		const pad = Math.floor((colunas - len) / 2);
		return " ".repeat(pad) + t.slice(0, colunas);
	};
	const r = (l, v) => {
		const gap = colunas - l.length - v.length;
		return l + " ".repeat(Math.max(1, gap)) + v;
	};
	const SEP = "─".repeat(colunas);
	const THIN = "·".repeat(colunas);
	const date = new Date(order.created_at);
	const dateStr = date.toLocaleDateString("pt-BR");
	const timeStr = date.toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit"
	});
	const seq = order.id.slice(-6).toUpperCase();
	const isDelivery = order.metodo_entrega === "entrega";
	const itens = order.itens ?? [];
	const subtotal = itens.reduce((s, i) => s + i.preco_unitario * i.quantidade, 0);
	const desconto = order.desconto_aplicado ?? 0;
	const entrega = order.taxa_entrega ?? 0;
	const itensLines = itens.map((item) => {
		const tot = item.preco_unitario * item.quantidade;
		const prod = `${item.quantidade}x ${item.nome}`;
		const val = `R$ ${tot.toFixed(2)}`;
		const gap = colunas - prod.length - val.length;
		const line = prod + " ".repeat(Math.max(1, gap)) + val;
		return item.observacao ? `${line}\n  Obs: ${item.observacao}` : line;
	}).join("\n");
	return [
		c("SABOROSAMENTE"),
		c("Marmitas Congeladas Artesanais"),
		SEP,
		c(`PEDIDO #${seq}`),
		c(`${dateStr}  ${timeStr}`),
		SEP,
		"CLIENTE:",
		order.nome_cliente ?? "—",
		order.telefone_cliente ?? "",
		SEP,
		c(isDelivery ? "** DELIVERY **" : "** RETIRADA **"),
		...isDelivery && order.endereco_rua ? [
			"ENTREGA:",
			`${order.endereco_rua}${order.endereco_numero ? ", " + order.endereco_numero : ""}`,
			`${order.endereco_bairro ?? ""}  ${order.endereco_cidade ?? ""}`
		] : [],
		SEP,
		"ITENS:",
		THIN,
		itensLines,
		THIN,
		r("Subtotal:", `R$ ${subtotal.toFixed(2)}`),
		r("Entrega:", entrega > 0 ? `R$ ${entrega.toFixed(2)}` : "GRATIS"),
		...desconto > 0 ? [r(`Desconto:`, `- R$ ${desconto.toFixed(2)}`)] : [],
		SEP,
		r("TOTAL:", `R$ ${order.valor_total.toFixed(2)}`),
		SEP,
		"PAGAMENTO:",
		order.metodo_pagamento ?? "Nao informado",
		...order.troco ? [`Troco p/ R$ ${order.troco}`] : [],
		...order.observacao ? [`\nOBS: ${order.observacao}`] : [],
		SEP,
		c("Obrigado pela preferencia!"),
		c("@saborosamente.sbs"),
		"\n\n\n"
	].filter((l) => l != null).join("\n");
}
async function imprimirTCP(order, ip, porta = 9100, copias = 1, papel = "80mm") {
	if (!await qzDisponivel()) return false;
	try {
		const conteudo = gerarConteudoComanda(order, papel === "58mm" ? 32 : 42);
		const cfg = qz.configs.create({
			host: ip,
			port: porta,
			type: "raw"
		}, {
			copies: copias,
			raw: true
		});
		await qz.print(cfg, [{
			type: "raw",
			format: "plain",
			data: conteudo
		}]);
		return true;
	} catch (e) {
		console.error("Erro na impressão TCP:", e?.message ?? e);
		return false;
	}
}
//#endregion
export { qzDisponivel as n, imprimirTCP as t };

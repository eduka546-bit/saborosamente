import type { PedidoInterpretado, ItemDetalhado, ItemInterpretado, PesoPedido } from "./whatsapp-order-parser";

/** Leitor específico de recibos do Pedidos10 colados na tela WhatsApp.
 * Não conta a linha do combo como outro produto: só os sabores reais são itens.
 */
const toMoney = (raw: string): number | null => {
  const compact = raw.replace(/[^\d,.-]/g, "");
  if (!compact) return null;
  const value = Number(compact.includes(",") ? compact.replace(/\./g, "").replace(",", ".") : compact);
  return Number.isFinite(value) ? value : null;
};
const round = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
function lineValue(lines: string[], label: RegExp): string {
  const row = lines.find((s) => label.test(s));
  return row?.replace(label, "").trim() ?? "";
}
function amount(lines: string[], label: RegExp): number | null {
  const raw = lineValue(lines, label);
  return toMoney(raw.match(/-?\d[\d.]*,\d{2}|-?\d+(?:\.\d{2})?/)?.[0] ?? "");
}
function normalizeText(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function interpretarComprovanteP10(texto: string): PedidoInterpretado | null {
  const lines = texto.split(/\r?\n/).map((x) => x.trim());
  // Não tratar resumos tradicionais ou recibos de sopa como P10.
  if (!lines.some((s) => /^Cliente\s*:/i.test(s)) ||
      !lines.some((s) => /^TOTAL\s+PEDIDO\s*:/i.test(s)) ||
      !lines.some((s) => /^Qtd\s+Descri(?:c|ç)[aã]o\b/i.test(s) || /^F\.\s*ENTREGA\s*:/i.test(s))) return null;

  const nome = lineValue(lines, /^Cliente\s*:\s*/i) || null;
  const telefone = lineValue(lines, /^(?:Fone|Telefone|Celular)\s*:\s*/i) || null;
  const rua = lineValue(lines, /^Endere[cç]o\s*:\s*/i);
  const numero = lineValue(lines, /^N[uú]mero\s*:\s*/i);
  const complemento = lineValue(lines, /^Complem\.?\s*:\s*/i) || null;
  const bairroCidade = lineValue(lines, /^Bairro\s*:\s*/i);
  const cidadeLinha = lineValue(lines, /^Cidade\s*:\s*/i);
  const [bairroPart, ...cidadeParts] = bairroCidade.split(/\s*\/\s*/);
  const bairro = bairroPart?.trim() ?? "";
  const cidade = cidadeParts.join(" / ").trim() || cidadeLinha;
  const referencia = lineValue(lines, /^Refer[eê]ncia\s*:\s*/i) || null;
  const horario = lineValue(lines, /^AGENDADO\s*:\s*/i) || null;
  const metodoEntrega: PedidoInterpretado["metodoEntrega"] =
    /retirada/i.test(lineValue(lines, /^F\.\s*ENTREGA\s*:\s*/i)) ? "retirada" : "entrega";
  const subtotal = amount(lines, /^Total\s+Itens\s*:\s*/i);
  const taxa = amount(lines, /^Tx\.\s*Entrega\s*:\s*/i)
    ?? amount(lines, /^Taxa\s+de\s+Entrega\s*:\s*/i);
  const totalPedido = amount(lines, /^TOTAL\s+PEDIDO\s*:\s*/i);
  const totalPago = amount(lines, /^TOTAL\s+PAGO\s*:\s*/i) ?? 0;
  const totalAPagar = amount(lines, /^TOTAL\s+A\s+PAGAR\s*:\s*/i);

  const pagamentoLinha = lines.findIndex((l) => /^F\.\s*PAGAMENTO\.?\s*:/i.test(l));
  const pagamentoRaw = pagamentoLinha < 0 ? "" : [
    lines[pagamentoLinha].replace(/^F\.\s*PAGAMENTO\.?\s*:\s*/i, ""),
    ...(lines.slice(pagamentoLinha + 1, pagamentoLinha + 3).filter((l) => /^\s*\(/.test(l))),
  ].join(" ");
  const pagamentoNormalizado = normalizeText(pagamentoRaw);
  const pagamento: PedidoInterpretado["pagamento"] = pagamentoNormalizado.includes("pix") ? "pix"
    : pagamentoNormalizado.includes("alimentacao") || pagamentoNormalizado.includes("refeicao") ? "alimentacao"
    : pagamentoNormalizado.includes("dinheiro") ? "dinheiro"
    : pagamentoNormalizado.includes("mercado pago") ? "mercadopago"
    : pagamentoNormalizado.includes("cartao") || pagamentoNormalizado.includes("credito") || pagamentoNormalizado.includes("debito")
      ? "cartao" : null;
  const tipoCartao = pagamento === "cartao"
    ? [
        pagamentoNormalizado.includes("debito") ? "Débito" : pagamentoNormalizado.includes("credito") ? "Crédito" : "Cartão",
        ["elo", "visa", "mastercard", "maestro", "hipercard", "amex"].find((b) => pagamentoNormalizado.includes(b))?.toUpperCase(),
        pagamentoNormalizado.includes("maquininha") ? "Maquininha" : null,
      ].filter(Boolean).join(" • ")
    : null;

  // Cada linha "* TD02 - ... 200g" é UM sabor, inclusive SO (400g).
  // Descrições quebradas em várias linhas pertencem ao sabor anterior.
  const entries: Array<ItemInterpretado & { peso: PesoPedido }> = [];
  const itemRx = /^\*\s*(?:(\d+)\s*[x×]\s*)?([A-Z]{2})\s*0*(\d{1,2})\s*[-–.]?\s*(.*)$/i;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(itemRx);
    if (!match) continue;
    const quantidade = match[1] ? Number(match[1]) : 1;
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 200) continue;
    const code = match[2].toUpperCase() + String(Number(match[3])).padStart(2, "0");
    let text = match[4];
    // Sai ao encontrar outra escolha, instrução ou fim da lista.
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\*|^SERVIR\b|^\+{1,2}\s|^-{5,}$|^Total\s+Itens:/i.test(lines[j])) break;
      text += " " + lines[j];
    }
    const weightMatch = text.match(/\b(200|300|400)\s*g\b/i);
    const peso = (weightMatch ? weightMatch[1] + "g" : code.startsWith("SO") ? "400g" : "300g") as PesoPedido;
    entries.push({ codigo: code, quantidade, peso });
  }
  const avisos: string[] = [];
  const quantidadeTotal = entries.reduce((sum, e) => sum + e.quantidade, 0);
  const precoReferencia = subtotal ??
    (totalPedido !== null && taxa !== null ? round(totalPedido - taxa) : null);
  const itensDetalhados: ItemDetalhado[] = [];
  if (quantidadeTotal && precoReferencia !== null && precoReferencia >= 0) {
    // Distribuição EXATA em centavos. Não cria uma linha de combo adicional.
    const cents = Math.round(precoReferencia * 100);
    const base = Math.floor(cents / quantidadeTotal);
    let extra = cents - base * quantidadeTotal;
    for (const entry of entries) {
      for (let n = 0; n < entry.quantidade; n++) {
        const centsUnit = base + (extra > 0 ? 1 : 0);
        if (extra > 0) extra--;
        const last = itensDetalhados.at(-1);
        if (last && last.codigo === entry.codigo && last.peso === entry.peso &&
            last.precoUnitario === centsUnit / 100) last.quantidade++;
        else itensDetalhados.push({ ...entry, quantidade: 1, precoUnitario: centsUnit / 100, pesoExibicao: entry.peso });
      }
    }
    avisos.push("Pedidos10: o combo informa somente o valor total. Valores por sabor distribuídos para conferir o pedido; não representam preços individuais originais.");
  } else {
    for (const entry of entries)
      itensDetalhados.push({ ...entry, pesoExibicao: entry.peso, precoUnitario: null });
  }
  if (quantidadeTotal === 0) avisos.push("Pedidos10: não foi possível encontrar os códigos dos sabores.");
  if (totalPedido !== null && precoReferencia !== null && taxa !== null &&
      Math.abs(round(precoReferencia + taxa - totalPedido)) >= 0.01)
    avisos.push("Pedidos10: subtotal, taxa e TOTAL PEDIDO estão divergentes. Confira antes de salvar.");
  if (totalPedido !== null && totalAPagar !== null &&
      Math.abs(round(totalPedido - totalPago - totalAPagar)) >= 0.01)
    avisos.push("Pedidos10: TOTAL PAGO e TOTAL A PAGAR não correspondem ao total informado.");
  if (totalPago > 0)
    avisos.push("Pedidos10: há pagamento antecipado. Confira o valor recebido; o total do pedido permanece bruto.");
  if (!cidade && metodoEntrega === "entrega")
    avisos.push("Pedidos10: cidade não identificada; confira o endereço antes de salvar.");
  if (entrieCountInvalid(lines, quantidadeTotal))
    avisos.push("Pedidos10: verifique a quantidade informada no combo e os sabores identificados.");

  const congelado = lines.find(l => /^\+{2}\s*Consumir\s+depois/i.test(l));
  return {
    nome,
    telefone,
    cidadeSigla: null,
    peso: itensDetalhados[0]?.peso ?? "300g",
    precoUnitario: null,
    itens: itensDetalhados.map(({codigo, quantidade}) => ({codigo, quantidade})),
    itensDetalhados,
    blocos: [],
    avisos,
    quantidadeDeclarada: quantidadeTotal,
    subtotalDeclarado: precoReferencia,
    taxaEntrega: taxa ?? 0,
    metodoEntrega,
    endereco: (rua || bairro || cidade) ? { rua, numero, bairro, cidade } : null,
    complemento,
    referencia,
    horario,
    pagamento,
    tipoCartao,
    descontoPercentual: null,
    descontoValor: 0,
    cashbackUsado: 0,
    totalPedido,
    saldoAnterior: null,
    totalAcumulado: null,
    observacoesAdicionais: congelado ? congelado.replace(/^\+{2}\s*/, "") : null,
  };
}

function entrieCountInvalid(lines: string[], quantity: number): boolean {
  // "COMBO 5 A 9 UNIDADES" = faixa comercial, NÃO exatamente 5 unidades.
  const combo = lines.find(l => /^\d+\s+COMBO\b/i.test(l));
  if (!combo) return false;
  const range = combo.match(/\b(\d+)\s+A\s+(\d+)\s+UNIDADES\b/i);
  return !!range && (quantity < Number(range[1]) || quantity > Number(range[2]));
}

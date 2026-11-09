import type { PedidoInterpretado, ItemDetalhado, ItemInterpretado, PesoPedido } from "./whatsapp-order-parser";
import { encontrarProdutoP10, normalizarAgendamentoP10, parseP10Receipt, type P10Produto } from "./p10-receipt";

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
  const horarioRaw = lineValue(lines, /^AGENDADO\s*:\s*/i) || null;
  const horario = horarioRaw ? normalizarAgendamentoP10(horarioRaw) : null;
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
  const integralmentePago = totalPedido !== null && totalPago > 0 &&
    totalAPagar !== null && totalAPagar <= 0 && Math.abs(totalPago - totalPedido) < 0.01;
  const parcialmentePago = totalPago > 0 && !integralmentePago;
  const pagamento: PedidoInterpretado["pagamento"] = integralmentePago ? "online_pago"
    : parcialmentePago ? "pagamento_parcial"
    : pagamentoNormalizado.includes("pix") ? "pix"
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
    let code = match[2].toUpperCase() + String(Number(match[3])).padStart(2, "0");
    let text = match[4];
    // Sai ao encontrar outra escolha, instrução ou fim da lista.
    for (let j = i + 1; j < lines.length; j++) {
      if (/^\*|^SERVIR\b|^\+{1,2}\s|^-{5,}$|^Total\s+Itens:/i.test(lines[j])) break;
      text += " " + lines[j];
    }
    // Erro recorrente do P10: CO07 Carne de Panela 150g corresponde a CO06.
    if (code === "CO07" && /carne de panela/i.test(normalizeText(text)) && /\b150\s*g\b/i.test(text)) code = "CO06";
    const weightMatch = text.match(/\b(200|300|400)\s*g\b/i);
    // Complementos de 150g usam o estoque_200g, sem mudar o tamanho exibido.
    const peso = (code.startsWith("CO") ? "200g" : weightMatch ? weightMatch[1] + "g" : code.startsWith("SO") ? "400g" : "300g") as PesoPedido;
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
        else itensDetalhados.push({ ...entry, quantidade: 1, precoUnitario: centsUnit / 100, pesoExibicao: entry.codigo.startsWith("CO") ? "150g" : entry.peso });
      }
    }
    avisos.push("Pedidos10: o combo informa somente o valor total. Valores por sabor distribuídos para conferir o pedido; não representam preços individuais originais.");
  } else {
    for (const entry of entries)
      itensDetalhados.push({ ...entry, pesoExibicao: entry.codigo.startsWith("CO") ? "150g" : entry.peso, precoUnitario: null });
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
    valorPago: totalPago,
    valorAPagar: totalAPagar,
    pagamentoOriginal: pagamentoRaw || null,
    descontoPercentual: null,
    descontoValor: 0,
    cashbackUsado: 0,
    totalPedido,
    saldoAnterior: null,
    totalAcumulado: null,
    observacoesAdicionais: congelado ? congelado.replace(/^\+{2}\s*/, "") : null,
  };
}


/**
 * Alguns cupons P10 antigos informam sabores via "++ nome" sem código TD.
 * Reaproveita a identificação por nome do leitor histórico, sem perder
 * pagamento, endereço, data nem subtotal do leitor unificado.
 */
export function completarSaboresSemCodigoP10(
  texto: string,
  pedido: PedidoInterpretado,
  produtos: P10Produto[],
): PedidoInterpretado {
  const recibo = parseP10Receipt(texto);
  const qtdAtual = pedido.itens.reduce((n, i) => n + i.quantidade, 0);
  const qtdRecibo = recibo.itens.reduce((n, i) => n + i.quantidade, 0);
  if (qtdRecibo <= qtdAtual) return pedido;
  if (qtdRecibo > 200 || recibo.itens.length > 100) throw new Error("Comprovante P10 com quantidade excessiva; confira os itens.");

  const resolvidos = recibo.itens.map(item => {
    const produto = encontrarProdutoP10(item, produtos);
    if (!produto) throw new Error("P10: não consegui identificar o sabor " + item.nome + ". Confira o código ou cadastre o produto.");
    const encontrado = produto.nome.match(/\b(TD|SO|CO)\s*0*(\d+)\b/i);
    const codigo = encontrado ? encontrado[1].toUpperCase() + encontrado[2].padStart(2, "0") : item.codigo;
    if (!codigo) throw new Error("P10: produto sem código no catálogo: " + produto.nome);
    const tamanho = (codigo.startsWith("CO") ? "200g"
      : codigo.startsWith("SO") ? "400g" : /^(200|300|400)g$/.test(item.tamanho) ? item.tamanho : "300g") as PesoPedido;
    return { codigo, quantidade: item.quantidade, peso: tamanho };
  });

  const totalRef = pedido.subtotalDeclarado ??
    (pedido.totalPedido !== null ? pedido.totalPedido - (pedido.taxaEntrega ?? 0) : null);
  const totalCentavos = totalRef === null ? null : Math.max(0, Math.round(totalRef * 100));
  const base = totalCentavos === null ? 0 : Math.floor(totalCentavos / qtdRecibo);
  let extra = totalCentavos === null ? 0 : totalCentavos - base * qtdRecibo;
  const detalhados: ItemDetalhado[] = [];
  const quantidades = new Map<string, number>();
  for (const item of resolvidos) {
    quantidades.set(item.codigo, (quantidades.get(item.codigo) ?? 0) + item.quantidade);
    for (let i = 0; i < item.quantidade; i++) {
      const precoUnitario = totalCentavos === null ? null : (base + (extra-- > 0 ? 1 : 0)) / 100;
      detalhados.push({
        codigo: item.codigo, quantidade: 1, peso: item.peso, precoUnitario,
        pesoExibicao: item.codigo.startsWith("CO") ? "150g" : item.peso,
      });
    }
  }

  return {
    ...pedido,
    itens: [...quantidades].map(([codigo, quantidade]) => ({ codigo, quantidade })),
    itensDetalhados: detalhados,
    quantidadeDeclarada: qtdRecibo,
    avisos: [...pedido.avisos, "Pedidos10: sabores sem código reconhecidos por nome; confira os vínculos antes de salvar."],
  };
}

function entrieCountInvalid(lines: string[], quantity: number): boolean {
  // "COMBO 5 A 9 UNIDADES" = faixa comercial, NÃO exatamente 5 unidades.
  const combo = lines.find(l => /^\d+\s+COMBO\b/i.test(l));
  if (!combo) return false;
  const range = combo.match(/\b(\d+)\s+A\s+(\d+)\s+UNIDADES\b/i);
  return !!range && (quantity < Number(range[1]) || quantity > Number(range[2]));
}

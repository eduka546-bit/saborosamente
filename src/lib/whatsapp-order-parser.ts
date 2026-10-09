/**
 * Interpreta resumos recebidos pelo WhatsApp, sem registrar nem modificar pedidos.
 * Cada seção pode ter tamanhos, produtos e preços próprios.
 */
export type PesoPedido = "200g" | "300g" | "400g";
export type ItemInterpretado = { codigo: string; quantidade: number };
export type ItemDetalhado = ItemInterpretado & {
  peso: PesoPedido;
  precoUnitario: number | null;
  pesoExibicao: string;
};
export type BlocoPedido = {
  descricao: string;
  tipo: "refeicoes" | "combo" | "complemento";
  quantidadeDeclarada: number;
  unidadesEsperadas: number;
  peso: PesoPedido;
  subtotalDeclarado: number | null;
  itens: ItemDetalhado[];
  avisos: string[];
};
export type PedidoInterpretado = {
  nome: string | null;
  cidadeSigla: string | null;
  peso: PesoPedido;
  precoUnitario: number | null;
  itens: ItemInterpretado[];
  itensDetalhados: ItemDetalhado[];
  blocos: BlocoPedido[];
  avisos: string[];
  quantidadeDeclarada: number | null;
  subtotalDeclarado: number | null;
  taxaEntrega: number | null;
  metodoEntrega: "entrega" | "retirada" | null;
  endereco: { rua: string; numero: string; bairro: string; cidade: string } | null;
  referencia: string | null;
  horario: string | null;
  pagamento: "pix" | "alimentacao" | "mercadopago" | "dinheiro" | "cartao" | null;
  descontoPercentual: number | null;
  descontoValor: number;
  cashbackUsado: number;
  totalPedido: number | null;
  saldoAnterior: number | null;
  totalAcumulado: number | null;
};

const valor = (texto?: string | null): number | null => {
  const limpo = String(texto ?? "").replace(/\s/g, "").replace(/[^\d,.-]/g, "");
  if (!limpo) return null;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
};
const centavos = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const codigo = (prefixo: string, numero: string) =>
  prefixo.toUpperCase() + String(Number(numero)).padStart(2, "0");

/** Aceita listas compactas (1xTD(1-9-11)) ou uma linha por código. */
export function lerCodigos(texto: string): ItemInterpretado[] {
  const itens: ItemInterpretado[] = [];
  const agrupados = /(\d+)\s*x\s*([A-Z]{2})\s*\(\s*(\d{1,2}(?:\s*[-,;\/]\s*\d{1,2})+)\s*\)/gi;
  const resto = texto.replace(agrupados, (_match, qt: string, prefixo: string, lista: string) => {
    for (const num of lista.split(/\s*[-,;\/]\s*/)) {
      if (Number(qt) > 0 && Number(num) > 0)
        itens.push({ codigo: codigo(prefixo, num), quantidade: Number(qt) });
    }
    return " ";
  });
  const individuais = /(\d+)\s*x\s*([A-Z]{2})\s*\(?\s*(\d{1,2})\s*\)?(?!\d)/gi;
  let encontrado: RegExpExecArray | null;
  while ((encontrado = individuais.exec(resto)) !== null) {
    if (Number(encontrado[1]) > 0 && Number(encontrado[3]) > 0)
      itens.push({ codigo: codigo(encontrado[2], encontrado[3]), quantidade: Number(encontrado[1]) });
  }
  return itens;
}

const cabecalhoBloco = /^(\d+)\s*[-–]\s*((?:Refei(?:ç|c)[õo]es?|Combo|Complementos?)\b.*?)\s+[-–]\s*(?:R\$\s*)?([\d.,]+)\s*$/i;
const precoLinha = /(?:^|\s)(\d+)\s*x\s*(?:R\$\s*)?([\d.,]+)\s*(?:\/\s*)?un(?:idades?)?\b/i;

export function interpretarResumoWhatsapp(texto: string): PedidoInterpretado {
  const linhas = texto.split(/\r?\n/).map((l) => l.replace(/[*_]/g, "").trim());
  const linha = (regex: RegExp) => linhas.find((l) => regex.test(l)) ?? "";
  const cabecalho = linha(/^Pedido\s+/i);
  const nome = cabecalho
    ? cabecalho.replace(/^Pedido\s+/i, "").replace(/:\s*$/, "")
        .replace(/\s+-\s+[A-Z]{2,5}$/i, "").trim() || null
    : null;
  const cidadeSigla = cabecalho.match(/\s+-\s+([A-Z]{2,5})\s*:?\s*$/i)?.[1]?.toUpperCase() ?? null;

  // Comprovante/recibo de pedidos: lista livre com código, produto em
  // múltiplas linhas e valores no rodapé (sem blocos com tamanhos).
  const subtotalRecibo = valor(linha(/^SUBTOTAL\s*:/i).match(/:\s*(?:R\$\s*)?([\d.,]+)/i)?.[1]);
  const taxaRecibo = valor(linha(/^TAXA\s+DE\s+ENTREGA\s*:/i).match(/:\s*(?:R\$\s*)?([\d.,]+)/i)?.[1]);
  const totalRecibo = valor(linha(/^TOTAL\s*:/i).match(/:\s*(?:R\$\s*)?([\d.,]+)/i)?.[1]);
  const totalAPagar = valor(linha(/^TOTAL\s+A\s+SER\s+PAGO\s*:/i).match(/:\s*(?:R\$\s*)?([\d.,]+)/i)?.[1]);
  const cashbackRecibo = valor(linha(/^PAGO\s+COM\s+CASHBACK\s*:/i).match(/:\s*(?:R\$\s*)?([\d.,]+)/i)?.[1]) ?? 0;
  const temRecibo = subtotalRecibo !== null && totalRecibo !== null;

  const blocos: BlocoPedido[] = [];
  let blocoAtual: { titulo: string; quantidade: number; subtotal: number | null; linhas: string[] } | null = null;
  for (const l of linhas) {
    const m = l.match(cabecalhoBloco);
    if (m) {
      if (blocoAtual) blocos.push(interpretarBloco(blocoAtual));
      blocoAtual = { titulo: m[2], quantidade: Number(m[1]), subtotal: valor(m[3]), linhas: [] };
    } else if (blocoAtual) {
      if (/^(?:Entrega|Local de Entrega|Horário de|Forma de Pagamento|Total)\s*[:\/]/i.test(l)) {
        blocos.push(interpretarBloco(blocoAtual));
        blocoAtual = null;
      } else {
        blocoAtual.linhas.push(l);
      }
    }
  }
  if (blocoAtual) blocos.push(interpretarBloco(blocoAtual));

  const blocoPrincipal = blocos.find((b) => b.tipo !== "complemento") ?? blocos[0];
  const peso = blocoPrincipal?.peso ?? "300g";
  const precoUnitario = blocoPrincipal?.itens[0]?.precoUnitario ??
    valor(texto.replace(/[_*]/g, "").match(/\b\d+\s*x\s*(?:R\$\s*)?([\d.,]+)\s*(?:\/\s*)?un(?:idades?)?\b/i)?.[1]);
  const itensDetalhados: ItemDetalhado[] = blocos.length
    ? blocos.flatMap((b) => b.itens)
    : temRecibo
      ? ratearItensRecibo(lerCodigos(texto), subtotalRecibo)
      : lerCodigos(texto).map((item) => ({
          ...item, peso, pesoExibicao: peso, precoUnitario,
        }));

  const itens = itensDetalhados.map(({ codigo, quantidade }) => ({ codigo, quantidade }));
  const refeicoes = blocos.find((b) => b.tipo === "refeicoes");
  const quantidadeDeclarada = refeicoes?.quantidadeDeclarada ?? null;
  const subtotalDeclarado = refeicoes?.subtotalDeclarado ?? null;

  const entrega = linha(/^Entrega(?:\s*\/\s*Retirada)?\s*:/i);
  const taxaEntrega = temRecibo ? taxaRecibo :
    /^Entrega(?:\s*\/\s*Retirada)?\s*:\s*Retirada\b/i.test(entrega)
      ? 0 : valor(entrega.match(/:\s*(?:R\$\s*)?([\d.,]+)/i)?.[1]);
  const local = linha(/^Local\s+de\s+Entrega(?:\s*\/\s*Retirada)?\s*:/i);
  const localTexto = local.replace(/^Local\s+de\s+Entrega(?:\s*\/\s*Retirada)?\s*:\s*/i, "").trim();
  const metodoEntrega = /:\s*retirada\b/i.test(entrega) || /^retirada\b/i.test(localTexto)
    ? "retirada"
    : localTexto || /:\s*(?:R\$\s*)?[\d.,]+/i.test(entrega) || (temRecibo && taxaRecibo !== null) ? "entrega" : null;
  let endereco: PedidoInterpretado["endereco"] = null;
  let referencia: string | null = null;
  if (metodoEntrega === "entrega" && localTexto) {
    const partes = localTexto.split(/\s+-\s+/).map((p) => p.trim());
    const ruaNumero = partes[0].match(/^(.*?),\s*([^,]+)$/);
    endereco = {
      rua: ruaNumero ? ruaNumero[1].trim() : partes[0],
      numero: ruaNumero ? ruaNumero[2].trim() : "",
      bairro: partes[1] ?? "",
      cidade: partes[2] ?? "",
    };
    referencia = partes.slice(3).join(" - ") || null;
  }
  const horarioTexto = linha(/^Hor[aá]rio\s+de\s+(?:Entrega|Retirada)\s*:/i)
    .replace(/^Hor[aá]rio\s+de\s+(?:Entrega|Retirada)\s*:\s*/i, "").trim();
  const horario = horarioTexto && horarioTexto !== "?" ? horarioTexto : null;
  const pagamentoTexto = linha(/^Forma\s+de\s+Pagamento\s*:/i)
    .replace(/^Forma\s+de\s+Pagamento\s*:\s*/i, "").trim().toLowerCase();
  const pagamento = !pagamentoTexto || pagamentoTexto === "?" ? null :
    pagamentoTexto.includes("pix") || pagamentoTexto.includes("transferência") ? "pix" :
    pagamentoTexto.includes("alimenta") || pagamentoTexto.includes("refei") ? "alimentacao" :
    pagamentoTexto.includes("mercado") ? "mercadopago" :
    pagamentoTexto.includes("dinheiro") ? "dinheiro" : "cartao";

  const totalLinha = linha(/^Total\s*:/i);
  const igualdades = [...totalLinha.matchAll(/=\s*(?:R\$\s*)?([\d.,]+)/gi)]
    .map((m) => valor(m[1])).filter((v): v is number => v !== null);
  const saldoAnterior = valor(totalLinha.match(/\+\s*(?:R\$\s*)?([\d.,]+)\s*(?:anterior|saldo\s+anterior)/i)?.[1]);
  const totalAcumulado = saldoAnterior !== null && igualdades.length > 1
    ? igualdades[igualdades.length - 1] : null;
  const descontoPercentual = valor(totalLinha.match(/-\s*([\d.,]+)\s*%/i)?.[1]);
  const totalPedido = temRecibo
    ? (totalAPagar ?? centavos(totalRecibo! - cashbackRecibo))
    : saldoAnterior !== null
      ? (igualdades[0] ?? null)
      : (igualdades.at(-1) ?? valor(totalLinha.match(/^Total\s*:\s*(?:R\$\s*)?([\d.,]+)/i)?.[1]));
  const bruto = centavos(itensDetalhados.reduce(
    (s, item) => s + item.quantidade * (item.precoUnitario ?? 0), 0,
  ) + (metodoEntrega === "retirada" ? 0 : taxaEntrega ?? 0));
  const descontoValor = descontoPercentual !== null
    ? centavos(bruto * descontoPercentual / 100) : 0;
  const avisos = blocos.flatMap((b) => b.avisos);
  if (temRecibo && itens.length) {
    avisos.push("Comprovante sem preços individuais: o subtotal foi dividido entre as unidades. Confira os valores antes de salvar.");
    const subtotalCalculado = centavos(itensDetalhados.reduce((sum, item) => sum + item.quantidade * (item.precoUnitario ?? 0), 0));
    if (Math.abs(subtotalCalculado - subtotalRecibo!) > 0.009) avisos.push("Subtotal calculado não corresponde ao comprovante.");
    if (taxaRecibo !== null && Math.abs((subtotalRecibo! + taxaRecibo) - totalRecibo!) > 0.009)
      avisos.push("Subtotal e taxa não correspondem ao total do comprovante.");
    if (totalAPagar !== null && Math.abs(centavos(totalRecibo! - cashbackRecibo) - totalAPagar) > 0.009)
      avisos.push("Total a pagar não corresponde ao desconto do cashback informado.");
  }
  if (descontoPercentual !== null && (descontoPercentual < 0 || descontoPercentual > 100)) {
    avisos.push("Desconto percentual inválido.");
  }
  return {
    nome, cidadeSigla, peso, precoUnitario, itens, itensDetalhados, blocos, avisos,
    quantidadeDeclarada, subtotalDeclarado, taxaEntrega, metodoEntrega,
    endereco, referencia, horario, pagamento, descontoPercentual, descontoValor,
    cashbackUsado: cashbackRecibo, totalPedido, saldoAnterior, totalAcumulado,
  };
}

function interpretarBloco(raw: {
  titulo: string;
  quantidade: number;
  subtotal: number | null;
  linhas: string[];
}): BlocoPedido {
  const tipo: BlocoPedido["tipo"] = /^Combo\b/i.test(raw.titulo) ? "combo"
    : /^Complementos?\b/i.test(raw.titulo) ? "complemento" : "refeicoes";
  const pesoExibicao = tipo === "complemento"
    ? "150g" : (raw.titulo.match(/(200|300|400)\s*g/i)?.[1] ?? "300") + "g";
  // Complementos 150g usam o estoque_200g no banco de dados.
  const peso = (tipo === "complemento" ? "200g" : pesoExibicao) as PesoPedido;
  const codigoLinhas = raw.linhas.filter((l) => /^\d+\s*x\s*[A-Z]{2}\s*\(?\s*\d/i.test(l));
  const codigos = codigoLinhas.flatMap(lerCodigos);
  const avisos: string[] = [];
  const unidadeCombo = tipo === "combo"
    ? Number(raw.linhas.join(" ").match(/Combo\s*(\d+)\s*un/i)?.[1] ?? 0)
    : 0;
  const esperado = tipo === "combo" && unidadeCombo > 0
    ? raw.quantidade * unidadeCombo : raw.quantidade;
  const quantidadeReal = codigos.reduce((sum, item) => sum + item.quantidade, 0);
  if (codigos.length && quantidadeReal !== esperado) {
    avisos.push(raw.titulo + ": declara " + esperado + " unidades, mas os códigos representam " + quantidadeReal + ".");
  }
  if (!codigos.length) avisos.push(raw.titulo + ": não foram encontrados sabores válidos.");

  const faixasPrecos = raw.linhas
    .map((l) => l.match(precoLinha)).filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ quantidade: Number(m[1]), preco: valor(m[2]) ?? 0 }));

  const itens: ItemDetalhado[] = [];
  if (faixasPrecos.length) {
    const filas = faixasPrecos.flatMap((faixa) =>
      Array.from({ length: Math.min(200, faixa.quantidade) }, () => faixa.preco));
    let posicao = 0;
    for (const item of codigos) {
      let segmento = 0;
      let ultimoPreco: number | null = null;
      for (let i = 0; i < item.quantidade; i++) {
        const preco = filas[posicao++];
        if (preco === undefined) {
          avisos.push(raw.titulo + ": faltam preços unitários para alguns itens.");
          break;
        }
        if (ultimoPreco !== null && ultimoPreco !== preco) {
          itens.push({ codigo: item.codigo, quantidade: segmento, precoUnitario: ultimoPreco, peso, pesoExibicao });
          segmento = 0;
        }
        ultimoPreco = preco;
        segmento++;
      }
      if (segmento && ultimoPreco !== null)
        itens.push({ codigo: item.codigo, quantidade: segmento, precoUnitario: ultimoPreco, peso, pesoExibicao });
    }
    if (filas.length !== quantidadeReal)
      avisos.push(raw.titulo + ": as quantidades nas faixas de preço não coincidem com os sabores.");
  } else {
    const preco = raw.subtotal !== null && quantidadeReal > 0
      ? centavos(raw.subtotal / quantidadeReal) : null;
    for (const item of codigos)
      itens.push({ ...item, precoUnitario: preco, peso, pesoExibicao });
  }
  if (raw.subtotal !== null) {
    const calculado = centavos(itens.reduce((sum, item) =>
      sum + item.quantidade * (item.precoUnitario ?? 0), 0));
    if (Math.abs(calculado - raw.subtotal) >= 0.009)
      avisos.push(raw.titulo + ": itens somam R$ " + calculado.toFixed(2).replace(".", ",") +
        ", mas o bloco informa R$ " + raw.subtotal.toFixed(2).replace(".", ",") + ".");
  }
  return {
    descricao: raw.titulo, tipo, quantidadeDeclarada: raw.quantidade, unidadesEsperadas: esperado,
    peso, subtotalDeclarado: raw.subtotal, itens, avisos,
  };
}

/** Quando o comprovante não traz preços por sopa, preserva cada centavo do
 * subtotal ao distribuir unidades: nenhuma diferença artificial de arredondamento.
 * O valor será editável e explicitamente marcado como estimativa no admin. */
function ratearItensRecibo(itens: ItemInterpretado[], subtotal: number): ItemDetalhado[] {
  const quantidade = itens.reduce((sum, item) => sum + item.quantidade, 0);
  if (quantidade <= 0 || subtotal < 0) return [];
  const centavosSubtotal = Math.round(subtotal * 100);
  const base = Math.floor(centavosSubtotal / quantidade);
  let extra = centavosSubtotal - base * quantidade;
  const detalhados: ItemDetalhado[] = [];
  for (const item of itens) {
    for (let i = 0; i < item.quantidade; i++) {
      const precoCentavos = base + (extra > 0 ? 1 : 0);
      if (extra > 0) extra--;
      const unitPrice = precoCentavos / 100;
      const peso: PesoPedido = item.codigo.startsWith("SO") ? "400g" : "300g";
      const ultimo = detalhados[detalhados.length - 1];
      if (ultimo && ultimo.codigo === item.codigo && ultimo.peso === peso && ultimo.precoUnitario === unitPrice) {
        ultimo.quantidade += 1;
      } else {
        detalhados.push({ codigo: item.codigo, quantidade: 1, peso, pesoExibicao: peso, precoUnitario: unitPrice });
      }
    }
  }
  return detalhados;
}

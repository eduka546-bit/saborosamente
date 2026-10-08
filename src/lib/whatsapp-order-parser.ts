/**
 * Leitor de resumos de pedidos recebidos pelo WhatsApp.
 * Apenas interpreta textos: não cria pedidos e não mexe em estoque.
 */
export type PesoPedido = "200g" | "300g" | "400g";
export type ItemInterpretado = { codigo: string; quantidade: number };
export type PedidoInterpretado = {
  nome: string | null;
  cidadeSigla: string | null;
  peso: PesoPedido;
  precoUnitario: number | null;
  itens: ItemInterpretado[];
  quantidadeDeclarada: number | null;
  subtotalDeclarado: number | null;
  taxaEntrega: number | null;
  metodoEntrega: "entrega" | "retirada" | null;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
  } | null;
  horario: string | null;
  pagamento: "pix" | "alimentacao" | "mercadopago" | "dinheiro" | "cartao" | null;
  totalPedido: number | null;
  saldoAnterior: number | null;
  totalAcumulado: number | null;
};

const valor = (texto?: string | null) => {
  const limpo = String(texto ?? "").replace(/\s/g, "").replace(/[^\d,.-]/g, "");
  if (!limpo) return null;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
};

export function interpretarResumoWhatsapp(texto: string): PedidoInterpretado {
  const linhas = texto.split(/\r?\n/).map((linha) => linha.replace(/\*/g, "").trim());
  const linha = (regex: RegExp) => linhas.find((l) => regex.test(l)) ?? "";

  const cabecalho = linha(/^Pedido\s+/i);
  const nome = cabecalho
    ? cabecalho.replace(/^Pedido\s+/i, "").replace(/:\s*$/, "")
      .replace(/\s+-\s+[A-Z]{2,5}$/i, "").trim() || null
    : null;
  const cidadeSigla = cabecalho.match(/\s+-\s+([A-Z]{2,5})\s*:??\s*$/i)?.[1]?.toUpperCase() ?? null;

  const refeicoes = linha(/Refei(?:ç|c)[õo]es?\s+(200|300|400)\s*g/i);
  const pesoCodigo = refeicoes.match(/(200|300|400)\s*g/i)?.[1] ?? "300";
  const peso = `${pesoCodigo}g` as PesoPedido;
  const quantidadeDeclarada = refeicoes.match(/^(\d+)\s*[-–]\s*Refei/i)?.[1];
  const subtotalDeclarado = valor(refeicoes.match(/\s[-–]\s*(?:R\$\s*)?([\d.,]+)\s*$/i)?.[1]);

  // Aceita: "Combo 5un - 5 x 23,50un" e "5 x R$ 23,50 /un".
  const precoUnitario = valor(texto.match(/\b\d+\s*x\s*(?:R\$\s*)?([\d.,]+)\s*(?:\/\s*)?un(?:idades?)?\b/i)?.[1]);

  const itens: ItemInterpretado[] = [];
  let resto = texto;
  // "1xTD(1-9-11-16-28)" = uma unidade de cada código listado.
  // Substitui o trecho expandido antes de procurar itens individuais,
  // evitando contar novamente o primeiro código do grupo.
  const grupos = /(\d+)\s*x\s*([A-Z]{2})\s*\(\s*(\d{1,2}(?:\s*[-,;\/]\s*\d{1,2})+)\s*\)/gi;
  resto = resto.replace(grupos, (_trecho, qtd: string, prefixo: string, lista: string) => {
    const quantidade = Number(qtd);
    for (const num of lista.split(/\s*[-,;\/]\s*/)) {
      const numero = Number(num);
      if (quantidade > 0 && numero > 0) {
        itens.push({ codigo: `${prefixo.toUpperCase()}${String(numero).padStart(2, "0")}`, quantidade });
      }
    }
    return " ";
  });

  // "1xTD01", "1xTD(01)" e "5xTD(02)".
  const individuais = /(\d+)\s*x\s*([A-Z]{2})\s*\(?\s*(\d{1,2})\s*\)?(?!\d)/gi;
  let individual: RegExpExecArray | null;
  while ((individual = individuais.exec(resto)) !== null) {
    const quantidade = Number(individual[1]);
    const numero = Number(individual[3]);
    if (quantidade > 0 && numero > 0) {
      itens.push({
        codigo: `${individual[2].toUpperCase()}${String(numero).padStart(2, "0")}`,
        quantidade,
      });
    }
  }

  const entrega = linha(/^Entrega(?:\s*\/\s*Retirada)?\s*:/i);
  const taxaEntrega = valor(entrega.match(/:\s*(?:R\$\s*)?([\d.,]+)/i)?.[1]);
  const local = linha(/^Local\s+de\s+Entrega(?:\s*\/\s*Retirada)?\s*:/i);
  const localTexto = local.replace(/^Local\s+de\s+Entrega(?:\s*\/\s*Retirada)?\s*:\s*/i, "").trim();
  const metodoEntrega = localTexto
    ? /^retirada\b/i.test(localTexto) ? "retirada" : "entrega"
    : entrega && /retirada/i.test(entrega) && !/[\d]/.test(entrega) ? "retirada" : null;
  let endereco: PedidoInterpretado["endereco"] = null;
  if (metodoEntrega === "entrega" && localTexto) {
    const partes = localTexto.split(/\s+-\s+/).map((p) => p.trim());
    const ruaNumero = partes[0].match(/^(.*?),\s*([^,]+)$/);
    endereco = {
      rua: ruaNumero ? ruaNumero[1].trim() : partes[0],
      numero: ruaNumero ? ruaNumero[2].trim() : "",
      bairro: partes[1] ?? "",
      cidade: partes[2] ?? "",
    };
  }

  const horario = linha(/^Hor[aá]rio\s+de\s+(?:Entrega|Retirada)\s*:/i)
    .replace(/^Hor[aá]rio\s+de\s+(?:Entrega|Retirada)\s*:\s*/i, "").trim() || null;
  const pagamentoTexto = linha(/^Forma\s+de\s+Pagamento\s*:/i).toLowerCase();
  const pagamento = !pagamentoTexto ? null :
    pagamentoTexto.includes("pix") ? "pix" :
    pagamentoTexto.includes("alimenta") || pagamentoTexto.includes("refei") ? "alimentacao" :
    pagamentoTexto.includes("mercado") ? "mercadopago" :
    pagamentoTexto.includes("dinheiro") ? "dinheiro" : "cartao";

  const totalLinha = linha(/^Total\s*:/i);
  const igualdades = [...totalLinha.matchAll(/=\s*(?:R\$\s*)?([\d.,]+)/gi)].map((m) => valor(m[1]));
  const totalDireto = valor(totalLinha.match(/^Total\s*:\s*(?:R\$\s*)?([\d.,]+)/i)?.[1]);
  // Primeiro valor após "=" é o pedido NOVO. O último, se houver saldo
  // anterior, é somente o montante acumulado para cobrança.
  const totalPedido = igualdades[0] ?? totalDireto;
  const saldoAnterior = valor(totalLinha.match(/\+\s*(?:R\$\s*)?([\d.,]+)\s*(?:anterior|saldo\s+anterior)/i)?.[1]);
  const totalAcumulado = saldoAnterior !== null && igualdades.length > 1
    ? igualdades[igualdades.length - 1]
    : null;

  return {
    nome, cidadeSigla, peso, precoUnitario, itens,
    quantidadeDeclarada: quantidadeDeclarada ? Number(quantidadeDeclarada) : null,
    subtotalDeclarado, taxaEntrega, metodoEntrega, endereco,
    horario, pagamento, totalPedido, saldoAnterior, totalAcumulado,
  };
}

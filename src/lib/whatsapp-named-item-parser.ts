import type { PesoPedido } from "./whatsapp-order-parser";

export type ProdutoPorNome = {
  id: string;
  nome: string;
  tipo_produto?: string | null;
  preco?: number | string | null;
  preco_300g?: number | string | null;
  preco_400g?: number | string | null;
};
export type ItemPorNome = {
  productId: string;
  nome: string;
  quantidade: number;
  peso: PesoPedido;
  precoUnitario: number;
};
export type ResultadoListaPorNome = {
  itens: ItemPorNome[];
  naoIdentificados: string[];
  avisos: string[];
};

/**
 * Aliases aprovados contra o catálogo real; nunca escolhe por substring
 * genérica como "frango" ou "carne". Todo código deve existir e estar ativo.
 */
const apelidos: Record<string, string> = {
  "sopa de canja": "SO06",
  "canja": "SO06",
  "canja de galinha": "SO06",
  "sopa de tilapia": "SO12",
  "caldo de tilapia": "SO12",
  "sopa de peixe tilapia": "SO12",
  "sopa de peixe": "SO12",
  "creme de batata inglesa com carne desfiada": "SO09",
  "creme de batata com carne desfiada": "SO09",
  "macarrao penne com tiras de alcatra": "TD28",
  "penne com tiras de alcatra": "TD28",
  "macarrao penne alla creme com tiras de alcatra": "TD28",
  "bife ao molho com arroz e feijao": "TD16",
  "bife ao molho com arroz e feijao preto": "TD16",
  "tiras de bife ao molho com arroz e feijao": "TD16",
  "estrognofe de carne": "TD11",
  "estrogonofe de carne": "TD11",
  "strogonoff de carne": "TD11",
  "estrognofe de frango": "TD10",
  "estrogonofe de frango": "TD10",
  "strogonoff de frango": "TD10",
  "tiras de alcatra ao molho madeira com arroz e brocolis": "TD01",
  "tiras de alcatra ao molho madeira e arroz com brocolis": "TD01",
  "tiras de alcatra ao molho madeira com arroz com brocolis": "TD01",
  "parmegiana de carne": "TD09",
  "parmegiana de frango": "TD08",
};

const normalizar = (texto: string) => texto.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
const codigoProduto = (produto: ProdutoPorNome) =>
  produto.nome.match(/^\s*(TD|SO|CO)\s*0*(\d{1,2})\b/i)
    ?.slice(1).join("") // substituído abaixo pela forma canônica
    ?? "";

const pesoDaLinha = (texto: string): PesoPedido | null => {
  const n = normalizar(texto);
  const m = n.match(/\b(200|300|400)\s*g\b/);
  if (m) return (m[1] + "g") as PesoPedido;
  const letra = n.match(/\b([pmg])\b/);
  return letra ? ({p:"200g",m:"300g",g:"400g"} as const)[letra[1] as "p" | "m" | "g"] : null;
};

const valorProduto = (produto: ProdutoPorNome, peso: PesoPedido) =>
  Number((peso === "400g" ? produto.preco_400g
    : peso === "300g" ? produto.preco_300g : produto.preco) ?? produto.preco ?? 0);

/**
 * Interpreta listas de sabores sem códigos TD/SO, como mensagens informais
 * de clientes no WhatsApp. Não altera preços, estoque nem pedidos reais.
 * Se qualquer linha de sabor não for identificada, a tela aborta a importação
 * inteira: nunca perde silenciosamente itens não reconhecidos.
 */
export function interpretarListaSaboresPorNome(
  texto: string,
  produtos: ProdutoPorNome[],
  opcoes: { blackFridayAtiva?: boolean } = {},
): ResultadoListaPorNome {
  const porCodigo = new Map<string, ProdutoPorNome>();
  const porNome = new Map<string, ProdutoPorNome[]>();
  for (const produto of produtos) {
    const codigo = produto.nome.match(/^\s*(TD|SO|CO)\s*0*(\d{1,2})\b/i);
    if (codigo) porCodigo.set(codigo[1].toUpperCase() + codigo[2].padStart(2,"0"), produto);
    const nome = normalizar(produto.nome.replace(/^\s*(?:TD|SO|CO)\s*\d{1,2}\s*[-–]\s*/i, ""));
    porNome.set(nome, [...(porNome.get(nome) || []), produto]);
  }

  const encontrados: Array<{produto:ProdutoPorNome;quantidade:number;peso:PesoPedido}> = [];
  const naoIdentificados: string[] = [];
  const avisos: string[] = [];
  let tamanho: PesoPedido | null = null;
  let modo: "sopa" | "marmita" | null = null;

  for (const original of texto.split(/\r?\n/)) {
    const linha = original.replace(/[*_]/g, "").trim().replace(/^[•\-]+\s*/, "");
    if (!linha) continue;
    // Cabeçalho comum, sem supor que a quantidade é um pedido de sabor.
    if (/^(?:pedido\b|cliente\s*:|telefone\s*:|fone\s*:|whatsapp\s*:|endere[cç]o\s*:|entrega\s*:|taxa\s*:|forma\s+de\s+pagamento\s*:|pagamento\s*:|total\s*:|hor[aá]rio\s*:|retirada\b|valor\s+black\s*[-:]|refer[eê]ncia\s*:)/i.test(linha)) continue;
    if (/^\d+\s*x\s*(?:R\$\s*)?\d+[.,]\d{1,2}\s*$/i.test(linha)) continue;

    if (/^(?:todas?\s+de|tamanho|gramatura|peso)\s*[:\-]/i.test(linha)) {
      tamanho = pesoDaLinha(linha);
      if (!tamanho) avisos.push("Não foi possível identificar o tamanho: " + linha);
      modo = "marmita";
      continue;
    }
    if (/^(?:sopas?|caldos?)\s*:\s*$/i.test(linha)) {
      modo = "sopa"; continue;
    }
    if (/^(?:marmitas?|refei[cç][oõ]es)\s*(?:de\s*)?(?:200|300|400)?\s*g?\s*:\s*$/i.test(linha)) {
      tamanho = pesoDaLinha(linha) ?? tamanho;
      modo = "marmita"; continue;
    }

    const prefixo = linha.match(/^(\d{1,3})\s*[x×]\s+(.+)$/i);
    const quantidade = prefixo ? Number(prefixo[1]) : 1;
    const descricao = (prefixo ? prefixo[2] : linha).trim();
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 200) {
      naoIdentificados.push(linha + " (quantidade inválida)");
      continue;
    }
    const codificado = descricao.match(/^(TD|SO|CO)\s*0*(\d{1,2})$/i);
    const codigo = codificado ? codificado[1].toUpperCase()+codificado[2].padStart(2,"0") : apelidos[normalizar(descricao)];
    const candidatos = codigo ? [porCodigo.get(codigo)].filter((v):v is ProdutoPorNome=>Boolean(v)) : porNome.get(normalizar(descricao)) || [];
    if (candidatos.length !== 1) {
      naoIdentificados.push(linha);
      continue;
    }
    const produto = candidatos[0];
    const tipo = String(produto.tipo_produto || "").toLowerCase();
    if (!["sopa","marmita"].includes(tipo) || (modo === "sopa" && tipo !== "sopa") ||
        (modo === "marmita" && tipo !== "marmita")) {
      naoIdentificados.push(linha);
      continue;
    }
    const peso = tipo === "sopa" ? "400g" : pesoDaLinha(descricao) ?? tamanho ?? "300g";
    if (tipo === "marmita" && !pesoDaLinha(descricao) && !tamanho)
      avisos.push("Tamanho não informado para " + descricao + ". Confira a gramatura antes de salvar.");
    encontrados.push({produto,quantidade,peso});
  }

  const totalUnidades = encontrados.reduce((n,it)=>n+it.quantidade,0);
  const aplicarBlack = Boolean(opcoes.blackFridayAtiva && totalUnidades>=5);
  const itens: ItemPorNome[] = encontrados.map(({produto,quantidade,peso}) => {
    const tipo = String(produto.tipo_produto||"").toLowerCase();
    const black = aplicarBlack ? tipo === "sopa" ? 16 : peso === "200g" ? 14 : peso === "300g" ? 17 : 20 : null;
    return {
      productId: produto.id,
      nome: produto.nome,
      quantidade,
      peso,
      precoUnitario: black ?? valorProduto(produto,peso),
    };
  });
  return {itens,naoIdentificados,avisos};
}

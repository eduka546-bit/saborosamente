export type ProdutoEstoqueCozinha = {
  id: string;
  nome: string;
  tipo_produto?: string | null;
};

export type LinhaEstoqueCozinha = {
  produto_id: string;
  nome: string;
  tamanho: "150" | "200" | "300" | "400";
  quantidade: number;
};

const normalizar = (valor: string) => valor
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const apelidos: Record<string, string> = {
  "panqueca de carne": "TD22",
  "panqueca carne": "TD22",
  "panqueca frango": "TD21",
  "panqueca de frango": "TD21",
  "frango americano": "TD17",
  "esc frango": "TD12",
  "escondidinho frango": "TD12",
  "est carne": "TD11",
  "estrogonofe carne": "TD11",
  "las carne": "TD20",
  "lasanha carne": "TD20",
  "lasanha de carne": "TD20",
  "las frango": "TD19",
  "lasanha frango": "TD19",
  "lasanha de frango": "TD19",
  "vaca atolada": "TD04",
  "carbonara": "TD24",
  "parm frango": "TD08",
  "parmegiana frango": "TD08",
  "alm sugo": "TD02",
  "almondegas sugo": "TD02",
  "nhoque": "TD03",
  "tiras de bife": "TD16",
  "tiras bife": "TD16",
  "penne alla creme": "TD28",
  "creme abobora": "SO07",
  "creme de abobora": "SO07",
  "creme mandioquinha": "SO08",
  "creme de mandioquinha": "SO08",
  "canja galinha": "SO06",
  "canja de galinha": "SO06",
};

const codigoDoProduto = (nome: string) =>
  nome.match(/\b(TD|SO|CO)\d{2}\b/i)?.[0]?.toUpperCase() || "";

export function interpretarMensagemEstoqueCozinha(
  mensagem: string,
  produtos: ProdutoEstoqueCozinha[],
): { itens: LinhaEstoqueCozinha[]; erros: string[]; total: number } {
  const itens: LinhaEstoqueCozinha[] = [];
  const erros: string[] = [];
  const vistos = new Set<string>();
  const catalogo = produtos.filter((p) =>
    ["marmita", "sopa", "complemento"].includes(p.tipo_produto || "marmita"),
  );

  mensagem.split(/\r?\n/).forEach((original, indice) => {
    const linha = original.replace(/^\s*[*•#]+\s*/, "").replace(/\*+$/g, "").trim();
    if (!linha || /^(estoque cozinha|estoque da cozinha|marmitas|sopas|complementos)\s*:?\s*$/i.test(normalizar(linha))) return;

    const detalhe = linha.match(/^(.+?)\s+(150|200|300|400)\s*g\s*[-–—:]\s*(\d+)\s*(?:un(?:idades)?)?\s*$/i);
    const simples = detalhe ? null : linha.match(/^(.+?)\s*[-–—:]\s*(\d+)\s*(?:un(?:idades)?)?\s*$/i);
    const correspondencia = detalhe || simples;
    if (!correspondencia) {
      erros.push("Linha " + (indice + 1) + ": formato inválido — " + original.trim());
      return;
    }
    const nomeDigitado = correspondencia[1].trim();
    const termo = normalizar(nomeDigitado);
    const tamanhoInformado = detalhe?.[2] as LinhaEstoqueCozinha["tamanho"] | undefined;
    const quantidade = Number(detalhe?.[3] || simples?.[2]);
    if (!Number.isSafeInteger(quantidade) || quantidade < 0 || quantidade > 100000) {
      erros.push("Linha " + (indice + 1) + ": quantidade inválida");
      return;
    }

    const codigoDigitado = nomeDigitado.match(/\b(TD|SO|CO)\d{2}\b/i)?.[0]?.toUpperCase();
    const apelido = tamanhoInformado === "150" && ["tiras de bife", "tiras bife"].includes(termo)
      ? "CO04"
      : tamanhoInformado === "150" && termo === "frango americano"
        ? "CO02"
        : apelidos[termo];
    const codigo = codigoDigitado || apelido;
    let encontrados = codigo
      ? catalogo.filter((p) => codigoDoProduto(p.nome) === codigo)
      : catalogo.filter((p) => normalizar(p.nome.replace(/^\s*(TD|SO|CO)\d{2}\s*[-–—]?\s*/i, "")) === termo);
    if (!encontrados.length && !codigo && termo.length >= 5) {
      encontrados = catalogo.filter((p) =>
        normalizar(p.nome.replace(/^\s*(TD|SO|CO)\d{2}\s*[-–—]?\s*/i, "")).includes(termo),
      );
    }
    if (encontrados.length !== 1) {
      erros.push("Linha " + (indice + 1) + ": " + (encontrados.length ? "nome ambíguo" : "produto não encontrado") + " — " + nomeDigitado);
      return;
    }
    const produto = encontrados[0];
    const tipo = produto.tipo_produto || "marmita";
    const tamanho = tamanhoInformado || (tipo === "sopa" ? "400" : tipo === "complemento" ? "150" : undefined);
    if (!tamanho ||
      (tipo === "sopa" && tamanho !== "400") ||
      (tipo === "complemento" && tamanho !== "150") ||
      (tipo === "marmita" && tamanho === "150")) {
      erros.push("Linha " + (indice + 1) + ": tamanho inválido ou ausente para " + produto.nome);
      return;
    }
    const chave = produto.id + ":" + tamanho;
    if (vistos.has(chave)) {
      erros.push("Linha " + (indice + 1) + ": produto/tamanho repetido — " + produto.nome + " " + tamanho + "g");
      return;
    }
    vistos.add(chave);
    itens.push({ produto_id: produto.id, nome: produto.nome, tamanho, quantidade });
  });
  return { itens, erros, total: itens.reduce((s, item) => s + item.quantidade, 0) };
}

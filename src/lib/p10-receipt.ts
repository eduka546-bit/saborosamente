/**
 * Leitor de comprovantes do Pedidos10. Não grava pedidos nem altera estoque.
 * Trata descrições quebradas em várias linhas, opções ++ e códigos TD/SO/CO.
 */
export interface P10Item {
  quantidade: number;
  codigo: string;
  nome: string;
  tamanho: string;
}

export interface P10Dados {
  cliente: string;
  telefone: string;
  entrega: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  referencia: string;
  pagamento: string;
  totalPago: number;
  totalAPagar: number;
}

export interface P10Produto {
  id: string;
  nome: string;
  codigo_integracao?: string | null;
}

const normalizar = (s: string) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();

const tamanhos = /\b(150|200|300|400)\s*g\b/i;
const codigoProduto = /\b(TD|SO|CO)\s*0*(\d+)\b/i;
const codigoCanonico = (s: string) => {
  const m = s.match(codigoProduto);
  return m ? m[1].toUpperCase() + m[2].padStart(2, "0") : "";
};

const dinheiro = (s: string): number => {
  const valor = String(s).replace(/[^\d.,]/g, "");
  if (!valor) return 0;
  const numero = valor.includes(",")
    ? Number(valor.replace(/\./g, "").replace(",", "."))
    : Number(valor);
  return Number.isFinite(numero) ? numero : 0;
};

export function parseP10Receipt(texto: string): {
  itens: P10Item[];
  dados: P10Dados;
  total: number;
  taxa: number;
  quantidadeEsperada: number | null;
} {
  const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const campo = (regex: RegExp) =>
    linhas.map(l => l.match(regex)).find(Boolean)?.[1]?.trim() || "";
  const bairroCidade = campo(/^bairro\s*:\s*(.*)$/i).split(/\s*\/\s*/);
  const dados: P10Dados = {
    cliente: campo(/^cliente\s*:\s*(.*)$/i),
    telefone: campo(/^fone\s*:\s*(.*)$/i),
    entrega: campo(/^f\.?\s*entrega\s*:\s*(.*)$/i),
    rua: campo(/^endere[cç]o\s*:\s*(.*)$/i),
    numero: campo(/^n[uú]mero\s*:\s*(.*)$/i),
    complemento: campo(/^complem\.?\s*:\s*(.*)$/i),
    bairro: bairroCidade[0]?.trim() || "",
    cidade: bairroCidade[1]?.trim() || "",
    referencia: campo(/^refer[eê]ncia\s*:\s*(.*)$/i),
    pagamento: campo(/^f\.?\s*pagamento\.?\s*:\s*(.*)$/i),
    totalPago: dinheiro(campo(/^total\s*pago\s*:\s*(.*)$/i)),
    totalAPagar: dinheiro(campo(/^total\s*a\s*pagar\s*:\s*(.*)$/i)),
  };

  const itens: P10Item[] = [];
  let quantidadeGrupo = 1;
  let tamanhoGrupo = "300g";
  let grupoAberto = false;
  let descricaoGrupo = "";
  let temEscolhas = false;
  let escolha = "";
  let quantidadeEsperada: number | null = null;

  function incluir(textoItem: string, quantidade: number, tamanhoPadrao: string) {
    const nome = textoItem.trim().replace(/^[+*\s]+/, "");
    if (!nome) return;
    const matchQtd = nome.match(/^(\d+)\s*x\s+/i);
    const qtd = matchQtd ? Number(matchQtd[1]) * quantidade : quantidade;
    const semQtd = matchQtd ? nome.slice(matchQtd[0].length) : nome;
    const codigo = codigoCanonico(semQtd);
    const tamanho = semQtd.match(tamanhos)?.[1];
    itens.push({
      quantidade: qtd,
      codigo,
      nome: semQtd.replace(codigoProduto, "").replace(tamanhos, "")
        .replace(/^[-–\s]+/, "").trim() || codigo,
      tamanho: tamanho ? tamanho + "g" : tamanhoPadrao,
    });
  }

  function finalizarEscolha() {
    if (escolha.trim()) incluir(escolha, quantidadeGrupo, tamanhoGrupo);
    escolha = "";
  }

  function finalizarGrupo() {
    finalizarEscolha();
    if (grupoAberto && !temEscolhas && descricaoGrupo &&
        !/\b(combo|tradicional\s*[gmp]|sopa\s*\(?(?:400|300)\s*g)/i.test(descricaoGrupo)) {
      incluir(descricaoGrupo, quantidadeGrupo, tamanhoGrupo);
    }
    grupoAberto = false;
    descricaoGrupo = "";
    temEscolhas = false;
  }

  const ignorar = /^(?:cliente\s*:|fone\s*:|f\.?\s*(?:entrega|pagamento)|endere[cç]o\s*:|n[uú]mero\s*:|complem\.?\s*:|bairro\s*:|refer[eê]ncia\s*:|qtd\s+descri|v\.?\s*uni|total\s*(?:itens|pedido|pago|a\s*pagar)|tx\.?\s*entrega|taxa\s*de?\s*entrega|troco\s*:|[-=]{4,})/i;

  for (const linha of linhas) {
    if (ignorar.test(linha)) {
      if (/^(?:total\s*(?:itens|pedido|pago|a\s*pagar)|tx\.?\s*entrega|taxa\s*de?\s*entrega)/i.test(linha)) finalizarGrupo();
      continue;
    }

    // Linha de produto do cupom: "1 COMBO PRATOS MAIS 80,00 80,00".
    const produto = linha.match(/^(\d+)\s+(.+?)\s+\d[\d.,]*\s+\d[\d.,]*$/);
    if (produto) {
      finalizarGrupo();
      quantidadeGrupo = Number(produto[1]);
      descricaoGrupo = produto[2].trim();
      grupoAberto = true;
      tamanhoGrupo = descricaoGrupo.match(tamanhos)?.[1] + "g" || "300g";
      quantidadeEsperada = null;
      continue;
    }

    if (!grupoAberto) {
      const codigoSolto = linha.match(/^(\d+)\s*x\s+((?:TD|SO|CO)\d+.*)$/i);
      if (codigoSolto) incluir(codigoSolto[2], Number(codigoSolto[1]), "300g");
      continue;
    }

    // "TAMANHO" e "* 5 Refeicoes 200g P" definem o peso do combo.
    if (/^(?:tamanho|\*\s*\d+\s*refei[cç][oõ]es)/i.test(linha)) {
      const m = linha.match(tamanhos);
      if (m) tamanhoGrupo = m[1] + "g";
      const qtd = linha.match(/\*\s*(\d+)\s*refei/i);
      if (qtd) quantidadeEsperada = Number(qtd[1]) * quantidadeGrupo;
      continue;
    }
    if (/^(?:escolha|sabor|servir|deseja|garfo)\b/i.test(linha)) continue;
    const qtdCombo = linha.match(/(?:-|\b)(\d+)\s*un\b/i);
    if (qtdCombo && /combo/i.test(descricaoGrupo) && quantidadeEsperada === null) {
      quantidadeEsperada = Number(qtdCombo[1]) * quantidadeGrupo;
    }

    // As opções do combo podem ocupar várias linhas e começam por "++".
    const novaEscolha = linha.match(/^\+\+\s*(.*)$/);
    const escolhaCodificada = linha.match(/^\*\s*((?:TD|SO|CO)\s*\d+.*)$/i);
    if (novaEscolha || escolhaCodificada) {
      finalizarEscolha();
      temEscolhas = true;
      escolha = (novaEscolha?.[1] || escolhaCodificada?.[1] || "").trim();
      continue;
    }

    if (temEscolhas && escolha) {
      escolha += " " + linha;
    } else {
      descricaoGrupo += " " + linha;
      const m = linha.match(tamanhos);
      if (m) tamanhoGrupo = m[1] + "g";
    }
  }
  finalizarGrupo();

  return {
    itens,
    dados,
    total: dinheiro(campo(/^total\s*pedido\s*:\s*(.*)$/i)),
    taxa: dinheiro(campo(/^(?:tx\.?\s*entrega|taxa\s*de?\s*entrega)\s*:\s*(.*)$/i)),
    quantidadeEsperada,
  };
}

// Abreviações e nomes comerciais que não são idênticos ao nome técnico do catálogo.
// A correspondência por código só funciona se o produto existir e estiver ativo.
function codigoPorApelido(s: string): string {
  const n = normalizar(s);
  if (/alcatra.*madeira/.test(n)) return "TD01";
  if (/tilapia.*(?:pesto|batata doce|tomate seco)/.test(n)) return "TD14";
  if (/lasanha.*carne/.test(n)) return "TD20";
  if (/talharim.*(?:bolonhesa|carne moida|patinho)/.test(n)) return "TD26";
  if (/parmegiana.*frango/.test(n)) return "TD08";
  return "";
}

const comuns = new Set(["de", "do", "da", "dos", "das", "ao", "a", "o", "e", "com", "na", "no", "em", "um", "uma"]);
function tokens(s: string): Set<string> {
  return new Set(normalizar(s.replace(/^\s*(?:TD|SO|CO)\d+\s*[-–]?/i, ""))
    .split(" ").filter(t => t.length > 2 && !comuns.has(t)));
}

export function encontrarProdutoP10(item: P10Item, produtos: P10Produto[]): P10Produto | undefined {
  const codigo = item.codigo || codigoPorApelido(item.nome);
  if (codigo) {
    const porCodigo = produtos.find(p =>
      codigoCanonico(p.codigo_integracao || "") === codigo ||
      codigoCanonico(p.nome) === codigo);
    if (porCodigo) return porCodigo;
    // Código expresso no cupom não pode ser adivinhado por semelhança.
    if (item.codigo) return undefined;
  }

  const procurar = tokens(item.nome);
  if (procurar.size < 2) return undefined;
  const candidatos = produtos.map(produto => {
    const cadastrado = tokens(produto.nome);
    const comuns = [...procurar].filter(t => cadastrado.has(t)).length;
    const cobertura = comuns / procurar.size;
    const dice = (2 * comuns) / (procurar.size + cadastrado.size || 1);
    return { produto, pontuacao: 0.65 * cobertura + 0.35 * dice };
  }).sort((a, b) => b.pontuacao - a.pontuacao);
  const melhor = candidatos[0], segundo = candidatos[1];
  if (!melhor || melhor.pontuacao < 0.77 ||
      (segundo && melhor.pontuacao - segundo.pontuacao < 0.1)) return undefined;
  return melhor.produto;
}

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
  agendado: string;
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

/**
 * O P10 costuma imprimir apenas dia/mês. Salva DD/MM/AAAA para o
 * roteiro dos entregadores não confundir sextas-feiras diferentes.
 * Quando o ano não existe no cupom, escolhe a próxima ocorrência.
 */
export function normalizarAgendamentoP10(agendado: string, referencia = new Date()): string {
  const m = agendado.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/);
  if (!m) return agendado;
  const dia = Number(m[1]), mes = Number(m[2]);
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(referencia);
  const valor = (tipo: string) => partes.find(p => p.type === tipo)?.value || "";
  const dataHoje = valor("year") + "-" + valor("month") + "-" + valor("day");
  let ano = m[3] ? Number(m[3]) : Number(valor("year"));
  const pad = (n: number) => String(n).padStart(2, "0");
  const dataISO = (a: number) => a + "-" + pad(mes) + "-" + pad(dia);
  if (!m[3] && dataISO(ano) < dataHoje) ano += 1;
  const validacao = new Date(Date.UTC(ano, mes - 1, dia, 12));
  if (validacao.getUTCFullYear() !== ano || validacao.getUTCMonth() !== mes - 1 ||
      validacao.getUTCDate() !== dia) return agendado;
  return agendado.replace(m[0], pad(dia) + "/" + pad(mes) + "/" + ano);
}

export function parseP10Receipt(texto: string): {
  itens: P10Item[];
  dados: P10Dados;
  total: number;
  taxa: number;
  quantidadeEsperada: number | null;
  divergenciasQuantidade: string[];
} {
  const linhas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const campo = (regex: RegExp) =>
    linhas.map(l => l.match(regex)).find(Boolean)?.[1]?.trim() || "";
  const bairroCidade = campo(/^bairro\s*:\s*(.*)$/i).split(/\s*\/\s*/);
  const dados: P10Dados = {
    cliente: campo(/^cliente\s*:\s*(.*)$/i),
    telefone: campo(/^fone\s*:\s*(.*)$/i),
    entrega: campo(/^f\.?\s*entrega\s*:\s*(.*)$/i),
    agendado: campo(/^agendado\s*:\s*(.*)$/i),
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
  let secao: "nenhuma" | "sabor" | "servir" = "nenhuma";
  let quantidadeEsperada: number | null = null;
  let inicioGrupo = 0;
  const divergenciasQuantidade: string[] = [];

  function incluir(textoItem: string, quantidade: number, tamanhoPadrao: string) {
    const nome = textoItem.trim().replace(/^[+*\s]+/, "");
    if (!nome) return;
    const matchQtd = nome.match(/^(\d+)\s*[x×]\s*(?=\S)/i);
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
    if (grupoAberto && quantidadeEsperada !== null) {
      const lidos = itens.slice(inicioGrupo).reduce((sum, item) => sum + item.quantidade, 0);
      if (lidos !== quantidadeEsperada) divergenciasQuantidade.push(`Combo declara ${quantidadeEsperada} refeições, mas contém ${lidos} sabores. Confira o comprovante.`);
    }
    grupoAberto = false;
    descricaoGrupo = "";
    temEscolhas = false;
    secao = "nenhuma";
  }

  const ignorar = /^(?:cliente\s*:|fone\s*:|agendado\s*:|f\.?\s*(?:entrega|pagamento)|endere[cç]o\s*:|n[uú]mero\s*:|complem\.?\s*:|bairro\s*:|refer[eê]ncia\s*:|qtd\s+descri|v\.?\s*uni|total\s*(?:itens|pedido|pago|a\s*pagar)|tx\.?\s*entrega|taxa\s*de?\s*entrega|troco\s*:|[-=]{4,})/i;

  for (const linha of linhas) {
    if (ignorar.test(linha)) {
      if (/^(?:total\s*(?:itens|pedido|pago|a\s*pagar)|tx\.?\s*entrega|taxa\s*de?\s*entrega)/i.test(linha)) finalizarGrupo();
      continue;
    }

    // Linha de produto do cupom: "1 COMBO PRATOS MAIS 80,00 80,00".
    const linhaProduto = linha.replace(/(UNIDADES)(?=\d[\d.,]*\s+\d[\d.,]*$)/i, "$1 ");
    const produto = linhaProduto.match(/^(\d+)\s+(.+?)\s+\d[\d.,]*\s+\d[\d.,]*$/);
    if (produto) {
      finalizarGrupo();
      inicioGrupo = itens.length;
      quantidadeGrupo = Number(produto[1]);
      descricaoGrupo = produto[2].trim();
      grupoAberto = true;
      const tamanhoNoTitulo = descricaoGrupo.match(tamanhos)?.[1];
      tamanhoGrupo = tamanhoNoTitulo ? tamanhoNoTitulo + "g" : "300g";
      const qtdTitulo = /combo/i.test(descricaoGrupo) && descricaoGrupo.match(/(?:-|\b)(\d+)\s*un(?:idades?)?\b/i);
      quantidadeEsperada = qtdTitulo && !/\d+\s+a\s+\d+\s+un/i.test(descricaoGrupo) ? Number(qtdTitulo[1]) * quantidadeGrupo : null;
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
    if (/^(?:escolha|sabor)\b/i.test(linha)) {
      finalizarEscolha();
      secao = "sabor";
      continue;
    }
    if (/^(?:servir|deseja|garfo)\b/i.test(linha)) {
      finalizarEscolha();
      secao = "servir";
      continue;
    }
    const qtdCombo = linha.match(/(?:-|\b)(\d+)\s*un(?:idades?)?\b/i);
    if (qtdCombo && !/\d+\s+a\s+\d+\s+un/i.test(linha) && /combo/i.test(descricaoGrupo) && quantidadeEsperada === null) {
      quantidadeEsperada = Number(qtdCombo[1]) * quantidadeGrupo;
    }

    // As opções do combo podem ocupar várias linhas e começam por "++".
    const novaEscolha = linha.match(/^\+\+\s*(.*)$/);
    const escolhaCodificada = linha.match(/^\*\s*((?:\d+\s*[x×]\s*)?(?:TD|SO|CO)\s*\d+.*)$/i);
    if (novaEscolha || escolhaCodificada) {
      if (secao === "servir") continue;
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
    divergenciasQuantidade,
  };
}

// Abreviações e nomes comerciais que não são idênticos ao nome técnico do catálogo.
// A correspondência por código só funciona se o produto existir e estiver ativo.
// Nomes históricos do P10 podem manter acompanhamentos antigos. Identificamos
// o prato e a proteína juntos, jamais apenas "arroz", "frango" ou "carne".
function codigoPorApelido(s: string): string {
  const n = normalizar(s).replace(/\b(?:strogonoff|strogonofe|estrogonoff)\b/g, "estrogonofe")
    .replace(/\b(?:parmesiana|parmegiana|parmigiana)\b/g, "parmegiana");
  const frango = /\b(?:frango|galinha)\b/.test(n);
  const bovino = /\b(?:carne|patinho|bovina|bovino)\b/.test(n);
  const familia = (nome: string, f: string, b: string) =>
    new RegExp("\\b" + nome + "\\b").test(n) && frango !== bovino ? (frango ? f : b) : "";
  const porFamilia = familia("estrogonofe", "TD10", "TD11") ||
    familia("escondidinho", "TD12", "TD13") ||
    familia("parmegiana", "TD08", "TD09") ||
    familia("lasanha", "TD19", "TD20") ||
    familia("panqueca", "TD21", "TD22");
  if (porFamilia) return porFamilia;
  if (/\balcatra\b.*\bmadeira\b/.test(n)) return "TD01";
  if (/\btilapia\b.*\b(?:pesto|batata doce|tomate seco)\b/.test(n) && !/\b(?:sopa|caldo)\b/.test(n)) return "TD14";
  if (/\btalharim\b.*\b(?:bolonhesa|carne moida|patinho)\b/.test(n) && !frango) return "TD26";
  return "";
}

const comuns = new Set(["de", "do", "da", "dos", "das", "ao", "a", "o", "e", "com", "na", "no", "em", "um", "uma"]);
const acompanhamento = new Set(["arroz", "branco", "brocolis", "legumes", "batata", "rustica", "inglesa", "pure", "queijo", "molho", "tomate"]);
const discriminantes = new Set(["frango", "carne", "patinho", "alcatra", "tilapia", "bife", "bacon", "calabresa", "sugo", "madeira", "pesto", "carbonara", "bolonhesa", "penne", "talharim", "espaguete", "nhoque", "lasanha", "panqueca", "estrogonofe", "escondidinho", "parmegiana"]);
function tokens(s: string): Set<string> {
  return new Set(normalizar(s.replace(/^\s*(?:TD|SO|CO)\d+\s*[-–]?/i, "").replace(tamanhos, ""))
    .replace(/\b(?:strogonoff|strogonofe|estrogonoff)\b/g, "estrogonofe")
    .replace(/\b(?:parmesiana|parmigiana)\b/g, "parmegiana")
    .split(" ").filter(t => t.length > 2 && !comuns.has(t)));
}
// Aceita uma letra trocada/inserida/ausente, mas nunca aproxima palavras
// curtas nem substitui um ingrediente distintivo por outro.
function erroDeDigitacao(a: string, b: string): boolean {
  if (Math.min(a.length, b.length) < 5 || Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, erros = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++erros > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return erros + (a.length - i) + (b.length - j) <= 1;
}
const pesoToken = (t: string) => discriminantes.has(t) ? 3 : acompanhamento.has(t) ? 0.6 : 1.5;
export function encontrarProdutoP10(item: P10Item, produtos: P10Produto[]): P10Produto | undefined {
  // Erro conhecido do Pedidos10: comprovantes antigos trazem CO07
  // para Carne de Panela 150g. O produto correto do nosso catálogo é CO06.
  // Restringir a exceção ao nome e tamanho evita converter outros CO07 por engano.
  const codigo = item.codigo === "CO07" &&
      /\bcarne de panela\b/.test(normalizar(item.nome)) &&
      item.tamanho === "150g"
    ? "CO06"
    : item.codigo || codigoPorApelido(item.nome);
  if (codigo) {
    const porCodigo = produtos.find(p =>
      codigoCanonico(p.codigo_integracao || "") === codigo ||
      codigoCanonico(p.nome) === codigo);
    if (porCodigo) return porCodigo;
    // Código expresso no cupom não pode ser adivinhado por semelhança.
    if (item.codigo) return undefined;
  }

  const procurar = tokens(item.nome);
  if (procurar.has("frango") && ["carne", "patinho", "bovina", "bovino"].some(t => procurar.has(t)) &&
      ["estrogonofe", "escondidinho", "parmegiana", "lasanha", "panqueca"].some(t => procurar.has(t))) return undefined;
  if (procurar.size < 2) return undefined;
  const candidatos = produtos.filter(produto => !!codigoCanonico(produto.codigo_integracao || produto.nome)).map(produto => {
    const cadastrado = tokens(produto.nome);
    const correspondencias = [...procurar].map(t => {
      if (cadastrado.has(t)) return { t, grau: 1 };
      const aproximado = [...cadastrado].some(c => !discriminantes.has(t) && erroDeDigitacao(t, c));
      return { t, grau: aproximado ? 0.8 : 0 };
    });
    // Evita trocar uma proteína ou massa mencionada expressamente por outra.
    const contradicao = correspondencias.some(({ t, grau }) =>
      discriminantes.has(t) && grau === 0 && !((t === "carne" && cadastrado.has("patinho")) || (t === "patinho" && cadastrado.has("carne"))));
    const aparente = correspondencias.filter(({t, grau}) => grau > 0 && !acompanhamento.has(t)).length;
    const pesoConsulta = [...procurar].reduce((s,t) => s + pesoToken(t),0);
    const cobertura = correspondencias.reduce((n,{t,grau}) => n + pesoToken(t) * grau,0) / pesoConsulta;
    const dice = (2 * correspondencias.reduce((n,{grau}) => n + grau,0)) / (procurar.size + cadastrado.size || 1);
    return { produto, pontuacao: contradicao || aparente < 2 ? 0 : 0.8 * cobertura + 0.2 * dice };
  }).sort((a, b) => b.pontuacao - a.pontuacao);
  const melhor = candidatos[0], segundo = candidatos[1];
  if (!melhor || melhor.pontuacao < 0.74 ||
      (segundo && melhor.pontuacao - segundo.pontuacao < 0.1)) return undefined;
  return melhor.produto;
}

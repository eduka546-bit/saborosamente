import { nomesCozinhaCorrespondem } from "./cozinha-planejamento";
import { auditarRendimentosTeoricos } from "./cozinha-auditoria";

type DadosReceitas = {
  produtos: any[];
  receitas: any[];
  receitaItens: any[];
  montagemItens: any[];
  preparacoes: any[];
  preparacaoItens: any[];
  ingredientes: any[];
};
export type ConferenciaReceita = {
  receitaId: string;
  produto: string;
  codigo: string;
  estrutura: string[];
  rendimentos: string[];
  simulacao: string[];
  simulacoes: number;
};

const quant = (valor: unknown) => Math.max(0, Number(valor) || 0);
const porId = (linhas: any[]) => new Map<string, any>(linhas.map((x) => [String(x.id), x]));
const porReceita = (linhas: any[], id: string) => linhas.filter((x) => x.receita_id === id);
const tamanhoItens = (t: number) => t === 150 ? "gramas_personalizada" : `gramas_${t}`;
const tamanhoMontagem = (t: number) => `gramas_${t}`;

/** Reexecuta três inspeções independentes em TODAS as receitas do cardápio,
 * quando os dados do Supabase mudam. Não altera quantidades ou rendimentos.
 * 1. Integridade estrutural.
 * 2. Rendimento dos preparos (alertas, não supor evaporação).
 * 3. Simulação por tamanho e cruzamento da montagem com a receita.
 */
export function revisarTodasReceitas(dados: DadosReceitas): ConferenciaReceita[] {
  const produtos = porId(dados.produtos);
  const preparacoes = porId(dados.preparacoes);
  const ingredientes = porId(dados.ingredientes);
  const alertasRendimento = new Map(
    auditarRendimentosTeoricos(dados.preparacoes, dados.preparacaoItens, dados.ingredientes)
      .map((a) => [a.preparacaoId, a]),
  );
  return dados.receitas.map((receita) => {
    const produto = produtos.get(receita.produto_id);
    const codigo = String(produto?.codigo_integracao || produto?.nome || "Sem código").split(" - ")[0];
    const itens = porReceita(dados.receitaItens, receita.id);
    const montagem = porReceita(dados.montagemItens, receita.id);
    const refs = Array.isArray(receita.preparacoes) ? receita.preparacoes : [];
    const detalhes: ConferenciaReceita = {
      receitaId: receita.id,
      produto: String(produto?.nome || "Produto não encontrado"),
      codigo,
      estrutura: [],
      rendimentos: [],
      simulacao: [],
      simulacoes: 0,
    };
    if (!produto) detalhes.estrutura.push("Produto vinculado não encontrado.");
    if (!itens.length) detalhes.estrutura.push("Ficha técnica sem componentes.");
    if (!montagem.length) detalhes.estrutura.push("Montagem não cadastrada.");
    const prepsVinculados = [];
    const vistos = new Set<string>();
    for (const ref of refs) {
      const id = String(ref?.id || "");
      if (vistos.has(id)) detalhes.estrutura.push("Preparação vinculada em duplicidade.");
      vistos.add(id);
      const prep = preparacoes.get(id);
      if (!prep) detalhes.estrutura.push(`Preparação vinculada não encontrada: ${ref?.nome || id}`);
      else {
        prepsVinculados.push(prep);
        const aviso = alertasRendimento.get(id);
        if (aviso) detalhes.rendimentos.push(
          `${prep.nome}: ${aviso.tipo === "rendimento_a_conferir" ? "rendimento precisa de pesagem" : "cálculo teórico divergente"} — ${quant(aviso.cadastrado).toFixed(1)} g cadastrados e ${quant(aviso.teorico).toFixed(1)} g estimados.`,
        );
      }
    }
    for (const item of itens) {
      if (item.ingrediente_id && !ingredientes.has(String(item.ingrediente_id)))
        detalhes.estrutura.push("Ingrediente da receita não encontrado.");
      if (item.preparacao_id && !preparacoes.has(String(item.preparacao_id)))
        detalhes.estrutura.push("Preparação da ficha não encontrada.");
      if (item.preparacao_id && !vistos.has(String(item.preparacao_id)))
        detalhes.estrutura.push("Preparação usada na ficha mas ausente dos vínculos.");
    }
    const tipo = String(produto?.tipo_produto || "marmita");
    const tamanhos = tipo === "complemento" ? [150] : tipo === "sopa" ? [400] : [200, 300, 400];
    for (const t of tamanhos) {
      detalhes.simulacoes++;
      const colunaMont = tamanhoMontagem(t);
      const colunaItens = tamanhoItens(t);
      const total = montagem.reduce((s, m) => s + quant(m[colunaMont]), 0);
      if (Math.abs(total - t) > 0.5)
        detalhes.simulacao.push(`${t} g: montagem fecha ${total.toFixed(1)} g em vez de ${t} g.`);
      const matchPrep = prepsVinculados.map((p) => ({
        prep: p,
        correspondentes: montagem.filter((m) => nomesCozinhaCorrespondem(m.nome, p.nome)),
      }));
      for (const {prep, correspondentes} of matchPrep) {
        if (correspondentes.length !== 1)
          detalhes.simulacao.push(`${t} g: preparo "${prep.nome}" corresponde a ${correspondentes.length} componentes de montagem.`);
      }
      // Cruzar preparos da ficha técnica com as respectivas quantidades PRONTAS da montagem.
      for (const item of itens.filter((x) => x.preparacao_id)) {
        const prep = preparacoes.get(String(item.preparacao_id));
        if (!prep) continue;
        const correspondente = montagem.filter((m) => nomesCozinhaCorrespondem(m.nome, prep.nome));
        if (correspondente.length !== 1) continue;
        const prontoMontado = quant(correspondente[0][colunaMont]);
        const registrado = quant(item[colunaItens]);
        if (Math.abs(prontoMontado - registrado) > Math.max(0.55, prontoMontado * 0.005)) {
          detalhes.simulacao.push(`${t} g: preparo ${prep.nome} com ${registrado} g na ficha e ${prontoMontado} g na montagem.`);
        }
      }
      // Os ingredientes diretos devem corresponder ao peso da montagem, se ali aparecem.
      // Água de cocção e QB ficam fora da montagem e não devem criar falsos alertas.
      for (const item of itens.filter((x) => x.ingrediente_id && quant(x[colunaItens]) > 0)) {
        const ing = ingredientes.get(String(item.ingrediente_id));
        if (!ing) continue;
        const encontrados = montagem.filter((m) => nomesCozinhaCorrespondem(m.nome, ing.nome));
        if (encontrados.length !== 1) continue;
        const pronto = quant(encontrados[0][colunaMont]);
        const valorFicha = quant(item[colunaItens]);
        if (Math.abs(valorFicha - pronto) > Math.max(0.55, pronto * 0.005)) {
          detalhes.simulacao.push(`${t} g: ingrediente ${ing.nome} com ${valorFicha} na ficha e ${pronto} na montagem.`);
        }
      }
      if (tipo === "marmita" && itens.every((x) => quant(x[colunaItens]) === 0))
        detalhes.simulacao.push(`${t} g: tamanho sem nenhuma quantidade registrada na receita.`);
    }
    return detalhes;
  }).sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR"));
}

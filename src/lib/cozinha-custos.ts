import { nomesCozinhaCorrespondem, quantidadeBrutaPorRendimento, fatorLoteMassaPanqueca } from "./cozinha-planejamento";

export const MARGEM_SEGURANCA_RECEITA = 10;

export function custoUnitarioIngrediente(ingrediente: any): number {
  if (!ingrediente) return 0;
  return ingrediente.unidade_medida === "un" || ingrediente.unidade_medida === "L"
    ? Number(ingrediente.custo_por_unidade || 0)
    : Number(ingrediente.custo_por_kg || 0) / 1000;
}

// Uma origem por componente pronto: a preparação cobre seus ingredientes,
// e a montagem substitui as linhas antigas que repetem o mesmo componente.
export function linhasCustoReceita(receita: any, linhas: any[], montagem: any[], preparacoes: any[], itens: Map<string, any[]>, ingredientes: any[]) {
  const ids = new Set([...(receita?.preparacoes || []).map((p:any)=>p.id), ...linhas.map((l:any)=>l.preparacao_id)].filter(Boolean));
  const vinculadas = preparacoes.filter(p=>ids.has(p.id));
  const estruturadas = vinculadas.filter(p=>Number(p.rendimento_final_g)>0 && (itens.get(p.id)||[]).some(i=>Number(i.quantidade)>0) && montagem.some(m=>nomesCozinhaCorrespondem(m.nome,p.nome)));
  const cobertos = new Set<string>();
  const coletar = (id:string, vistos=new Set<string>()) => {
    if(vistos.has(id)) return;
    const proximos=new Set(vistos).add(id);
    for(const i of itens.get(id)||[]) {
      if(i.ingrediente_id) cobertos.add(i.ingrediente_id);
      if(i.preparacao_componente_id) coletar(i.preparacao_componente_id,proximos);
    }
  };
  estruturadas.forEach(p=>coletar(p.id));
  const refs=new Set<string>();
  const resultado:any[]=[];
  for(const m of montagem) {
    const prep=estruturadas.find(p=>nomesCozinhaCorrespondem(m.nome,p.nome));
    const ing=prep ? undefined : ingredientes.find(i=>!cobertos.has(i.id) && nomesCozinhaCorrespondem(m.nome,i.nome) && !vinculadas.some(p=>nomesCozinhaCorrespondem(m.nome,p.nome)));
    if(!prep && !ing) continue;
    const chave=prep ? 'p:'+prep.id : 'i:'+ing.id;
    refs.add(chave);
    resultado.push({...m,preparacao_id:prep?.id || null,ingrediente_id:ing?.id || null,gramas_personalizada:m.gramas_150,operacao_producao:'direto',fator_producao:1});
  }
  const montagemCompleta = montagem.some(m=>[150,200,300,400].some(t=>Number(m['gramas_'+t])>0))
    && montagem.every(m=>![150,200,300,400].some(t=>Number(m['gramas_'+t])>0) || resultado.some(l=>l.id===m.id));
  for(const l of montagemCompleta ? [] : linhas) {
    if(l.ingrediente_id && cobertos.has(l.ingrediente_id)) continue;
    if(refs.has(l.preparacao_id ? 'p:'+l.preparacao_id : 'i:'+l.ingrediente_id)) continue;
    resultado.push(l);
  }
  return resultado;
}

export function custoLinhaReceita(linha:any, tamanho:number|string, preparacoes:Map<string,any>, itens:Map<string,any[]>, ingredientes:Map<string,any>) {
  const tamanhoNumero=tamanho==='personalizada' ? 150 : Number(tamanho);
  const campo=tamanhoNumero===150 ? 'gramas_personalizada' : 'gramas_'+tamanhoNumero;
  const base=Number(linha[campo]||0);
  const fator=Number(linha.fator_producao||1);
  const qtd=linha.operacao_producao==='acrescentar' ? base*(1+fator) : linha.operacao_producao==='dividir' ? base/Math.max(.000001,fator) : base;
  if(linha.preparacao_id) {
    const prep=preparacoes.get(linha.preparacao_id);
    const peso=String(prep?.nome).toLowerCase().includes('massa panqueca') ? Number(prep.rendimento_final_g)*fatorLoteMassaPanqueca({[tamanhoNumero]:1}) : qtd;
    return peso*calcularCustoPreparacao(linha.preparacao_id,preparacoes,itens,ingredientes).porGrama;
  }
  const ing=ingredientes.get(linha.ingrediente_id);
  return quantidadeBrutaPorRendimento(qtd,ing||{})*custoUnitarioIngrediente(ing);
}

export function custoComMargemReceita(custoBase: number, percentual = MARGEM_SEGURANCA_RECEITA) {
  const base = Math.max(0, Number(custoBase || 0));
  const margem = base * Math.max(0, Number.isFinite(Number(percentual)) ? Number(percentual) : MARGEM_SEGURANCA_RECEITA) / 100;
  return { base, margem, total: base + margem };
}

export function calcularCustoPreparacao(
  id: string,
  preparacoes: Map<string, any>,
  itens: Map<string, any[]>,
  ingredientes: Map<string, any>,
  visitados = new Set<string>(),
): { custoLote: number; porGrama: number; pendencias: string[] } {
  const prep = preparacoes.get(id);
  const pendencias: string[] = [];
  if (!prep || visitados.has(id)) return { custoLote: 0, porGrama: 0, pendencias: [prep ? `${prep.nome}: vínculo circular` : "Preparação ausente"] };
  const proximos = new Set(visitados).add(id);
  const linhas = itens.get(id) || [];
  if (!linhas.length) pendencias.push(`${prep.nome}: ingredientes não cadastrados`);
  if (!(Number(prep.rendimento_final_g) > 0)) pendencias.push(`${prep.nome}: rendimento pronto não cadastrado`);
  let custoLote = 0;
  for (const linha of linhas) {
    const quantidade = Number(linha.quantidade || 0);
    if (!(quantidade > 0)) continue;
    if (linha.preparacao_componente_id) {
      const filho = calcularCustoPreparacao(linha.preparacao_componente_id, preparacoes, itens, ingredientes, proximos);
      custoLote += quantidade * filho.porGrama;
      pendencias.push(...filho.pendencias);
      continue;
    }
    const ingrediente = ingredientes.get(linha.ingrediente_id);
    if (!ingrediente) {
      pendencias.push(`${prep.nome}: ingrediente ausente`);
      continue;
    }
    const unitario = custoUnitarioIngrediente(ingrediente);
    if (!(unitario > 0) && !/^água$/i.test(String(ingrediente.nome).trim())) pendencias.push(`${ingrediente.nome}: preço não cadastrado`);
    // Quantidade da base = insumo de entrada. Perda/ganho já está no
    // rendimento pronto; não converter novamente nem aplicar margem aqui.
    custoLote += quantidade * unitario;
  }
  return { custoLote, porGrama: Number(prep.rendimento_final_g) > 0 ? custoLote / Number(prep.rendimento_final_g) : 0, pendencias: [...new Set(pendencias)] };
}

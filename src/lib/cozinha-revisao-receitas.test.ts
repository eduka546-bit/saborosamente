import { describe, expect, it } from "vitest";
import { revisarTodasReceitas } from "./cozinha-revisao-receitas";

const base = (): any => ({
  produtos: [{ id:"prod-1",nome:"TD14 - Tilápia assada",codigo_integracao:"TD14",tipo_produto:"marmita" }],
  receitas: [{id:"rec-1",produto_id:"prod-1",preparacoes:[{id:"prep-1",nome:"Tilápia assada"}]}],
  receitaItens: [{receita_id:"rec-1",preparacao_id:"prep-1",gramas_200:70,gramas_300:100,gramas_400:130}],
  montagemItens: [
    {receita_id:"rec-1",nome:"Tilápia assada",gramas_200:70,gramas_300:100,gramas_400:130},
    {receita_id:"rec-1",nome:"Purê de batata doce",gramas_200:130,gramas_300:200,gramas_400:270},
  ],
  preparacoes: [{id:"prep-1",nome:"Tilápia assada",rendimento_final_g:828,observacao:"Rendimento TEÓRICO com 40% de perda"}],
  preparacaoItens: [
    {preparacao_id:"prep-1",ingrediente_id:"ing-1",quantidade:1000},
    {preparacao_id:"prep-1",ingrediente_id:"ing-2",quantidade:300},
  ],
  ingredientes: [
    {id:"ing-1",nome:"Tilápia",unidade_medida:"g",tipo_rendimento:"perda",quebra_percentual:40},
    {id:"ing-2",nome:"Tomate",unidade_medida:"g",tipo_rendimento:"perda",quebra_percentual:24},
  ],
});

describe("auditoria automática em três passagens de cada receita", () => {
  it("revisa estrutura, perdas cadastradas e 3 gramaturas corretamente", () => {
    const revisoes = revisarTodasReceitas(base());
    expect(revisoes).toHaveLength(1);
    expect(revisoes[0].simulacoes).toBe(3);
    expect(revisoes[0].estrutura).toEqual([]);
    expect(revisoes[0].rendimentos).toEqual([]);
    expect(revisoes[0].simulacao).toEqual([]);
  });
  it("identifica simultaneamente erro de vínculo, perda antiga e montagem", () => {
    const dados=base();
    dados.receitas[0].preparacoes.push({id:"prep-removida",nome:"Não encontrada"});
    dados.preparacoes[0].rendimento_final_g=928;
    dados.montagemItens[0].gramas_300=95;
    const [receita] = revisarTodasReceitas(dados);
    expect(receita.estrutura.some((x)=>x.includes("não encontrada"))).toBe(true);
    expect(receita.rendimentos.some((x)=>x.includes("Tilápia"))).toBe(true);
    expect(receita.simulacao.some((x)=>x.includes("300 g"))).toBe(true);
  });
  it("confere o tamanho 150g no campo personalizado sem exigir 200/300/400", () => {
    const dados = base();
    dados.produtos[0].tipo_produto="complemento";
    dados.receitaItens[0].gramas_personalizada=150;
    dados.montagemItens=[{receita_id:"rec-1",nome:"Tilápia assada",gramas_150:150,gramas_200:0,gramas_300:0,gramas_400:0}];
    const [receita] = revisarTodasReceitas(dados);
    expect(receita.simulacoes).toBe(1);
    expect(receita.simulacao).toHaveLength(0);
  });
});

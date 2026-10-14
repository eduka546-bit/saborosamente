import { describe, expect, it } from "vitest";
import { auditarRendimentosTeoricos } from "./cozinha-auditoria";
import { quantidadeBrutaPorRendimento } from "./cozinha-planejamento";

const ingredientes = [
  { id: "tilapia", unidade_medida: "g", tipo_rendimento: "perda", quebra_percentual: 40 },
  { id: "tomate", unidade_medida: "g", tipo_rendimento: "perda", quebra_percentual: 24 },
];
const itens = [
  { preparacao_id: "tilapia-assada", ingrediente_id: "tilapia", quantidade: 1000 },
  { preparacao_id: "tilapia-assada", ingrediente_id: "tomate", quantidade: 300 },
];
const preparacao = {
  id: "tilapia-assada", nome: "Tilápia assada",
  observacao: "Rendimento TEÓRICO: tilápia crua com perda de 40% e tomate cru com perda de 24%.",
};
describe("conferência tripla do rendimento da tilápia", () => {
  it("detecta a preparação antiga com 30% apesar de o ingrediente usar 40%", () => {
    const alertas = auditarRendimentosTeoricos([{ ...preparacao, rendimento_final_g: 928 }], itens, ingredientes);
    expect(alertas).toHaveLength(1);
    expect(alertas[0].teorico).toBeCloseTo(828, 3);
    expect(alertas[0].diferenca).toBeCloseTo(100, 3);
  });
  it("aceita a preparação corrigida e mantém tomate contado uma vez", () => {
    expect(auditarRendimentosTeoricos([{ ...preparacao, rendimento_final_g: 828 }], itens, ingredientes)).toHaveLength(0);
    expect(1000 * 0.60 + 300 * 0.76).toBeCloseTo(828, 6);
  });
  it("escala insumos CRUS pela preparação e não reaplica a perda", () => {
    const pronto130 = 130;
    const peixeCru = pronto130 * 1000 / 828;
    expect(peixeCru).toBeCloseTo(157.00483, 3);
    expect(peixeCru * .6 + (pronto130 * 300 / 828) * .76).toBeCloseTo(pronto130, 4);
    // Perda direta (sem preparação) usa pronta/(1-perda).
    expect(quantidadeBrutaPorRendimento(100, ingredientes[0])).toBeCloseTo(166.666667, 4);
  });
  it("detecta SO12 com rendimento antigo de 30% e aceita 40% no caldo", () => {
    const ensaio = {
      id: "caldo", nome: "Caldo de Peixe (Tilápia)",
      observacao: "Rendimento TEÓRICO com água incorporada. AUDITORIA_AGUA_INTEGRAL.",
    };
    const insumos = [
      { id:"caldo-base", unidade_medida:"g" },
      { id:"tilapia-tiras", unidade_medida:"g", tipo_rendimento:"perda", quebra_percentual:40 },
      { id:"tomate", unidade_medida:"g", tipo_rendimento:"perda", quebra_percentual:24 },
      { id:"cebola", unidade_medida:"g", tipo_rendimento:"perda", quebra_percentual:23 },
      { id:"alho", unidade_medida:"g", tipo_rendimento:"perda", quebra_percentual:10 },
      { id:"oleo", unidade_medida:"g" },
      { id:"salsinha", unidade_medida:"g" },
      { id:"sal", unidade_medida:"g" },
      { id:"agua", nome:"Água", unidade_medida:"L" },
    ];
    const dosagens = [
      ["caldo-base",4000],["tilapia-tiras",400],["tomate",500],["cebola",200],
      ["alho",40],["oleo",50],["salsinha",50],["sal",100],["agua",1.5],
    ].map(([id,qty]) => ({ preparacao_id:"caldo", ingrediente_id:id as string, quantidade:qty as number }));
    const antigos = auditarRendimentosTeoricos([{...ensaio,rendimento_final_g:6550}], dosagens, insumos);
    expect(antigos).toHaveLength(1);
    expect(antigos[0].teorico).toBeCloseTo(6510, 5);
    expect(antigos[0].diferenca).toBeCloseTo(40, 5);
    expect(auditarRendimentosTeoricos([{...ensaio,rendimento_final_g:6510}], dosagens, insumos)).toHaveLength(0);
  });
  it("avisa quando o rendimento da alcatra não é justificado por pesagem", () => {
    const carne = { id:"patinho", unidade_medida:"g", tipo_rendimento:"perda", quebra_percentual:30 };
    const outros = [
      { id:"molho",unidade_medida:"g" },
      { id:"glace",unidade_medida:"g" },
      { id:"champignon",unidade_medida:"g" },
    ];
    const itensAlcatra = [
      ["patinho",3500],["molho",800],["glace",800],["champignon",400],
    ].map(([id,quantidade]) => ({ preparacao_id:"alcatra", ingrediente_id:id as string, quantidade:quantidade as number }));
    const avisos = auditarRendimentosTeoricos([
      { id:"alcatra",nome:"Alcatra molho madeira",rendimento_final_g:3508,observacao:"Preparo do TD01. Base sem rendimento real informado." },
    ],itensAlcatra,[carne,...outros]);
    expect(avisos).toHaveLength(1);
    expect(avisos[0].teorico).toBeCloseTo(4450,3);
    expect(avisos[0].tipo).toBe("rendimento_a_conferir");
    // Nunca alterar rendimento teórico de um lote confirmado em balança.
    expect(auditarRendimentosTeoricos([
      { id:"alcatra",nome:"Alcatra molho madeira",rendimento_final_g:3508,observacao:"Rendimento real medido na cozinha." },
    ],itensAlcatra,[carne,...outros])).toHaveLength(0);
  });
  it("alerta três preparos com leite antes de assumir evaporação como rendimento", () => {
    const leite = { id: "leite", nome: "Leite", unidade_medida: "L" };
    const carne = { id: "carne", nome: "Carne", unidade_medida: "g", tipo_rendimento: "perda", quebra_percentual: 30 };
    const frango = { id: "frango", nome: "Sassami", unidade_medida: "g", tipo_rendimento: "perda", quebra_percentual: 20 };
    const outros = ["margarina","farinha","creme","catchup","mostarda","demi","sal"]
      .map(id => ({id,nome:id,unidade_medida:"g"}));
    const produtos = [
      { id:"strog-carne", nome:"Estrogonofe de carne",rendimento_final_g:1460 },
      { id:"strog-frango", nome:"Estrogonofe de frango",rendimento_final_g:1510 },
      { id:"alla",nome:"Molho alla creme",rendimento_final_g:1380 },
    ].map(p=>({...p,observacao:"Importado da ficha"}));
    const rows = [
      ...["strog-carne","strog-frango"].flatMap(id=> [
        {preparacao_id:id,ingrediente_id:id==="strog-carne"?"carne":"frango",quantidade:1000},
        ...[["margarina",100],["farinha",100],["leite",1],["creme",200],["catchup",50],["mostarda",20]].map(([ing,q])=>({preparacao_id:id,ingrediente_id:ing as string,quantidade:q as number})),
        {preparacao_id:id,ingrediente_id:"sal",quantidade:0,quantidade_texto:"QB · a gosto"}
      ]),
      ...[["carne",1000],["margarina",40],["farinha",40],["leite",1],["demi",200]].map(([ing,q])=>({preparacao_id:"alla",ingrediente_id:ing as string,quantidade:q as number}))
    ];
    const avisos = auditarRendimentosTeoricos(produtos,rows,[leite,carne,frango,...outros]);
    expect(avisos).toHaveLength(3);
    expect(avisos.find(x=>x.preparacao==="Estrogonofe de carne")?.teorico).toBeCloseTo(2170,2);
    expect(avisos.find(x=>x.preparacao==="Estrogonofe de frango")?.teorico).toBeCloseTo(2270,2);
    expect(avisos.find(x=>x.preparacao==="Molho alla creme")?.teorico).toBeCloseTo(1980,2);
    expect(avisos.every(x=>x.tipo==="rendimento_a_conferir")).toBe(true);
  });
  it("não finge exatidão em preparos com água, ovos ou receita-base pesada", () => {
    const outras = [
      { id: "molho", nome: "Molho com água", observacao: "Rendimento TEÓRICO", rendimento_final_g: 700 },
      { id: "observado", nome: "Purê observado", observacao: "Rendimento operacional medido", rendimento_final_g: 700 },
    ];
    const preparos = [
      { preparacao_id: "molho", ingrediente_id: "tilapia", quantidade: 1000 },
      { preparacao_id: "molho", ingrediente_id: "agua", quantidade: 1 },
      { preparacao_id: "observado", ingrediente_id: "tilapia", quantidade: 1000 },
    ];
    expect(auditarRendimentosTeoricos(outras, preparos, [...ingredientes, { id:"agua", unidade_medida:"L" }])).toHaveLength(0);
  });
});

import { describe, expect, it } from "vitest";
import { aplicarIngredientesManuais } from "./cozinha-ingredientes-manuais";
const calculados = [
  {id:"id-alho",quantidade:500,unidade:"g" as const,item:{nome:"Alho"},pratos:["TD20"],qb:false},
  {id:"id-tomate",quantidade:1000,unidade:"g" as const,item:{nome:"Tomate"},pratos:["TD14"],qb:false},
];
const catalogo = [
  {id:"id-alho",nome:"Alho",unidade_medida:"g",custo_por_kg:24},
  {id:"id-tomate",nome:"Tomate",unidade_medida:"g",custo_por_kg:8},
  {id:"id-cebola",nome:"Cebola",unidade_medida:"g",custo_por_kg:6},
];
const make = (val: any) => ({
 id:"man-1",data_producao:"2026-10-16",tipo:"adicional",ingrediente_id:null,
 nome:"Embalagens",unidade:"un",quantidade:20,referencia_original:null,marcado_em:null,...val
});
describe("ajustes manuais não alteram os cálculos da receita", () => {
 it("substitui somente a quantidade de compra do dia, sem duplicar perdas", () => {
  const base=structuredClone(calculados);
  const linhas=aplicarIngredientesManuais(base,[make({
   tipo:"ajuste",ingrediente_id:"id-alho",nome:"Alho",unidade:"g",
   quantidade:650,referencia_original:500
  })] as any,catalogo);
  expect(linhas.find(x=>x.id==="id-alho")?.quantidade).toBe(650);
  expect(linhas.find(x=>x.id==="id-tomate")?.quantidade).toBe(1000);
  expect(base[0].quantidade).toBe(500);
  expect(linhas.find(x=>x.id==="id-alho")?.revisaoNecessaria).toBe(false);
 });
 it("avisa se a receita for alterada após ajuste", () => {
  const linhas=aplicarIngredientesManuais(calculados,[make({
   tipo:"ajuste",ingrediente_id:"id-alho",nome:"Alho",unidade:"g",
   quantidade:650,referencia_original:400
  })] as any,catalogo);
  expect(linhas.find(x=>x.id==="id-alho")?.revisaoNecessaria).toBe(true);
 });
 it("inclui ingrediente cadastrado para descontar seu estoque normalmente", () => {
  const linhas=aplicarIngredientesManuais(calculados,[make({
   ingrediente_id:"id-cebola",nome:"Cebola",unidade:"g",quantidade:200
  })] as any,catalogo);
  expect(linhas.find(x=>x.id==="id-cebola")?.quantidade).toBe(200);
  expect(linhas.find(x=>x.id==="id-cebola")?.item.custo_por_kg).toBe(6);
 });
 it("agrupa avulsos pelo nome normalizado, por unidade, sem confundir datas", () => {
  const linhas=aplicarIngredientesManuais(calculados,[make({nome:"  Filme  PLÁSTICO ",quantidade:1})] as any,catalogo);
  expect(linhas.find(x=>x.id==="avulso:filme plastico")?.quantidade).toBe(1);
  expect(linhas.find(x=>x.id==="avulso:filme plastico")?.item.nome).toBe("  Filme  PLÁSTICO ");
 });
 it("preserva quantidade extra quando item entrou na receita posteriormente, somando apenas o adicional explícito", () => {
  const linhas=aplicarIngredientesManuais(calculados,[make({
   ingrediente_id:"id-alho",nome:"Alho",unidade:"g",quantidade:50
  })] as any,catalogo);
  expect(linhas.find(x=>x.id==="id-alho")?.quantidade).toBe(550);
  expect(linhas.filter(x=>x.id==="id-alho")).toHaveLength(1);
 });
});

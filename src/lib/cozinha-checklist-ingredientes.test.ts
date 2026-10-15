import { describe, expect, it } from "vitest";
import {
  assinaturaChecklist, chaveChecklistIngrediente, etapaEstaMarcada, ingredienteEstaSeparado,
} from "./cozinha-checklist-ingredientes";

describe("checklists operacionais da cozinha", () => {
  it("separa a marcação do mesmo ingrediente por dia e unidade", () => {
    const segunda = chaveChecklistIngrediente("2026-10-12", "ingrediente-alho", "g");
    const terca = chaveChecklistIngrediente("2026-10-13", "ingrediente-alho", "g");
    const litros = chaveChecklistIngrediente("2026-10-12", "ingrediente-alho", "L");
    expect(new Set([segunda,terca,litros]).size).toBe(3);
  });
  it("não marca ingrediente se a quantidade mudou no planejamento", () => {
    const salvo = { quantidade_referencia: "1520.000" };
    expect(ingredienteEstaSeparado(salvo,1520)).toBe(true);
    expect(ingredienteEstaSeparado(salvo,1620)).toBe(false);
    expect(ingredienteEstaSeparado(undefined,1520)).toBe(false);
    expect(ingredienteEstaSeparado({quantidade_referencia:0},0)).toBe(true);
  });
  it("montagem e preparo ficam pendentes quando alteram os itens planejados", () => {
    const assinatura = assinaturaChecklist(["TD14","200",15,"300",25,"400",20]);
    expect(etapaEstaMarcada({ assinatura_referencia: assinatura },assinatura)).toBe(true);
    expect(etapaEstaMarcada({ assinatura_referencia: assinatura },assinaturaChecklist(["TD14","200",15,"300",25,"400",21]))).toBe(false);
    expect(etapaEstaMarcada(undefined,assinatura)).toBe(false);
    expect(assinaturaChecklist(["A","BC"])).not.toBe(assinaturaChecklist(["AB","C"]));
  });
  it("o hash é estável e distingue o tamanho do prato pronto", () => {
    expect(assinaturaChecklist(["TD14","200",15])).toBe(assinaturaChecklist(["TD14","200",15]));
    expect(assinaturaChecklist(["TD14","200",15])).not.toBe(assinaturaChecklist(["TD14","300",15]));
  });
});

import { describe, it, expect } from "vitest";
import { compositionForWeight, compositionValidation } from "./product-composition";
const rows = [
  { nome: "Patinho ao molho", gramas_200: 100, gramas_300: 150, gramas_400: 200 },
  { nome: "Arroz", gramas_200: 60, gramas_300: 90, gramas_400: 110 },
  { nome: "Brócolis", gramas_200: 40, gramas_300: 60, gramas_400: 90 },
];
describe("composition follows selected serving", () => {
  it.each([200, 300, 400])("uses the actual %ig assembly without scaling", (size) => {
    const result = compositionForWeight(rows, `${size}g`);
    expect(result.reduce((s, r) => s + r.gramas, 0)).toBe(size);
    expect(result[0].gramas).toBe(size / 2);
  });
  it("supports single-size soups and complements", () => {
    expect(compositionForWeight([{ nome: "Sopa", gramas_400: 400 }], "400g")[0].gramas).toBe(400);
    expect(compositionForWeight([{ nome: "Frango", gramas_150: 150 }], "150g")[0].gramas).toBe(150);
  });
  it("does not borrow another size or expose zero weights", () => {
    expect(compositionForWeight(rows, "150g")).toEqual([]);
    expect(compositionForWeight([{ nome: "Salsinha", gramas_200: 0 }], "200g")).toEqual([]);
  });
  it("honors manual names and grams", () => {
    expect(compositionForWeight([{ nome: "Nome editado", gramas_300: "125.5" }], "300g")).toEqual([
      { nome: "Nome editado", gramas: 125.5 },
    ]);
  });
  it("rejects duplicates, blank names and invalid weights", () => {
    expect(compositionValidation([{ nome: "Arroz" }, { nome: "arroz" }])).toMatch(/duplicado/);
    expect(compositionValidation([{ nome: "" }])).toMatch(/nome/);
    expect(compositionValidation([{ nome: "Arroz", gramas_200: -1 }])).toMatch(/gramaturas/);
    expect(compositionValidation(rows)).toBeNull();
  });
});

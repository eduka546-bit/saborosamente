import { describe, expect, it } from "vitest";
import { displayIngredients, withDisplayIngredients } from "./product-display-ingredients";

describe("confirmed public ingredient display", () => {
  it("uses one sunflower oil entry and sea salt without duplicate ingredients", () => {
    const result = displayIngredients({ nome: "TD01", ingredientes: ["Óleo de milho", "Óleo de girassol", "Sal mineral", "Sal marinho", "Pimenta"] });
    expect(result.filter((item) => item === "Óleo de girassol")).toHaveLength(1);
    expect(result.filter((item) => item === "Sal marinho")).toHaveLength(1);
    expect(result).not.toContain("Pimenta");
  });
  it("includes the confirmed oil even when absent from an old display list", () => {
    expect(displayIngredients({ nome: "TD04", ingredientes: [] })).toContain("Óleo de girassol");
    expect(displayIngredients({ nome: "CO04", ingredientes: ["Tiras de patinho"] })).toContain("Óleo de girassol");
  });
  it("preserves the source recipe when changing the public display", () => {
    const original = { nome: "TD01 - Alcatra", ingredientes: ["Margarina", "Óleo de milho"] };
    const result = withDisplayIngredients(original);
    expect(result.ingredientes).toContain("Manteiga");
    expect(original.ingredientes).toEqual(["Margarina", "Óleo de milho"]);
    expect(original.nome).toBe("TD01 - Alcatra");
  });
});

describe("registered beef cuts", () => {
  it.each(["TD01 - Tiras de Alcatra ao Molho Madeira", "TD28 - Penne com Tiras de Alcatra"])("preserves Alcatra in %s and matches its displayed ingredients", (nome) => {
    const result = withDisplayIngredients({ nome, ingredientes: ["Patinho em tiras", "Tiras de Alcatra"] });
    expect(result.nome).toBe(nome);
    expect(result.ingredientes.filter((item) => item === "Tiras de Alcatra")).toHaveLength(1);
    expect(result.ingredientes).not.toContain("Patinho em tiras");
  });
  it("keeps Patinho for products registered with that cut", () => {
    const result = withDisplayIngredients({ nome: "CO04 - Tiras de Carne de Patinho", ingredientes: ["Tiras de patinho"] });
    expect(result.nome).toContain("Patinho");
    expect(result.ingredientes).toContain("Tiras de patinho");
  });
});

import { describe, expect, it } from "vitest";
import { commerceReturnPath } from "./commerce-return-path";

describe("commerceReturnPath", () => {
  it("preserves checkout and cashback destinations", () => {
    expect(commerceReturnPath("/checkout?cupom=PRIMEIRACOMPRA")).toBe("/checkout?cupom=PRIMEIRACOMPRA");
    expect(commerceReturnPath("/perfil#cashback")).toBe("/perfil#cashback");
  });
  it("rejects external destinations and browser-normalized external URLs", () => {
    for (const value of ["https://example.com", "//example.com", "/\\example.com", "/\n/example.com", undefined]) {
      expect(commerceReturnPath(value)).toBe("/");
    }
  });
});

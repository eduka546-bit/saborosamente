import { describe, expect, it } from "vitest";
import { checkoutSchema } from "./checkout-validation";

const pedidoValido = { nome: "Maria da Silva", email: "maria@example.com", telefone: "47999998888", endereco: "Rua das Flores, 123", cidade: "Mafra", pagamento: "pix" as const };

describe("checkoutSchema", () => {
  it("aceita os dados mínimos para finalizar um pedido", () => expect(checkoutSchema.safeParse(pedidoValido).success).toBe(true));
  it("rejeita e-mail, telefone e endereço inválidos", () => expect(checkoutSchema.safeParse({ ...pedidoValido, email: "invalido", telefone: "123", endereco: "Rua" }).success).toBe(false));
  it("exige que o troco em dinheiro seja numérico", () => {
    const resultado = checkoutSchema.safeParse({ ...pedidoValido, pagamento: "dinheiro", troco: "dez reais" });
    expect(resultado.success).toBe(false);
    if (!resultado.success) expect(resultado.error.issues.some((issue) => issue.path[0] === "troco")).toBe(true);
  });
});

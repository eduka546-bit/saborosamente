import { describe, expect, it } from "vitest";
import { checkoutSchema } from "./checkout-validation";

const pedidoValido = { nome: "Maria da Silva", email: "maria@example.com", telefone: "47999998888", endereco: "Rua das Flores, 123", cidade: "Mafra", pagamento: "pix" as const };

describe("checkoutSchema", () => {
  it("aceita os dados mínimos para finalizar um pedido", () => expect(checkoutSchema.safeParse(pedidoValido).success).toBe(true));
  it("rejeita e-mail, telefone e endereço inválidos", () => expect(checkoutSchema.safeParse({ ...pedidoValido, email: "invalido", telefone: "123", endereco: "Rua" }).success).toBe(false));
  it("aceita CEP com ou sem hífen e retirada sem CEP", () => {
    expect(checkoutSchema.safeParse({ ...pedidoValido, cep: "89280000" }).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...pedidoValido, cep: "89280-000" }).success).toBe(true);
    expect(checkoutSchema.safeParse({ ...pedidoValido, cep: "" }).success).toBe(true);
  });
  it("rejeita CEP incompleto ou mal formatado", () => {
    expect(checkoutSchema.safeParse({ ...pedidoValido, cep: "8928" }).success).toBe(false);
    expect(checkoutSchema.safeParse({ ...pedidoValido, cep: "abcd-efg" }).success).toBe(false);
  });
  it("aceita troco com vírgula no padrão brasileiro", () => {
    const resultado = checkoutSchema.safeParse({ ...pedidoValido, pagamento: "dinheiro", troco: "50,00" });
    expect(resultado.success).toBe(true);
  });

  it("exige que o troco em dinheiro seja numérico", () => {
    const resultado = checkoutSchema.safeParse({ ...pedidoValido, pagamento: "dinheiro", troco: "dez reais" });
    expect(resultado.success).toBe(false);
    if (!resultado.success) expect(resultado.error.issues.some((issue) => issue.path[0] === "troco")).toBe(true);
  });
});

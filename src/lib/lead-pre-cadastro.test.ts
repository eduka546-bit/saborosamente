import { describe, expect, it } from "vitest";
import {
  PRE_CADASTRO_TTL_MS, telefonePreCadastro, validarLeadPreCadastro,
} from "./lead-pre-cadastro";

describe("pré-cadastro opcional do visitante no sorteio", () => {
  const agora = Date.parse("2026-10-09T16:00:00Z");
  const exemplo = {
    nome: "Maria Eduarda",
    telefone: "(47) 99999-9999",
    sessionId: "sess_1234567890abcdef1234567890abcdef",
    registradoEm: agora - 1000,
  };

  it("aceita nome e WhatsApp informados pela pessoa, inclusive com DDI", () => {
    expect(validarLeadPreCadastro(exemplo, agora)).toEqual({
      ...exemplo,
      telefone: "47999999999",
    });
    expect(telefonePreCadastro("+55 (47) 99999-9999")).toBe("47999999999");
    expect(telefonePreCadastro("(47) 3333-5555")).toBe("4733335555");
  });

  it("não recupera dados pessoais expirados nem timestamps futuros", () => {
    expect(validarLeadPreCadastro({ ...exemplo, registradoEm: agora - PRE_CADASTRO_TTL_MS - 1 }, agora)).toBeNull();
    expect(validarLeadPreCadastro({ ...exemplo, registradoEm: agora + 1000 }, agora)).toBeNull();
  });

  it("rejeita dados adulterados, telefone inválido e sessão incompleta", () => {
    expect(validarLeadPreCadastro({ ...exemplo, nome: "" }, agora)).toBeNull();
    expect(validarLeadPreCadastro({ ...exemplo, telefone: "47" }, agora)).toBeNull();
    expect(validarLeadPreCadastro({ ...exemplo, sessionId: "sess_lead_invalido" }, agora)).toBeNull();
    expect(validarLeadPreCadastro({ ...exemplo, sessionId: "<script>" }, agora)).toBeNull();
    expect(validarLeadPreCadastro(null, agora)).toBeNull();
  });
});

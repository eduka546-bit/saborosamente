import { describe, expect, it } from "vitest";
import { montarBuscaWhatsapp, telefoneChave } from "./whatsapp-customer-match";

describe("busca de clientes pelo histórico WhatsApp", () => {
  const profile = { id: "conta-1", nome: "Elaine Maria", telefone: "(47) 98888-0000" };
  const historico = { id:"historico-1", nome:"Elaine Francine", telefone_normalizado:"47999991111", email:"elaine@example.com",
    cidade:"São Bento do Sul", bairro:"Centro", rua:"Rua das Flores", numero:"10", cep:"89280000" };
  const pedido = { id:"pedido-1", nome_cliente:"Elaine Francine", telefone_cliente:"+55 (47) 99999-1111",
    endereco_cidade:"São Bento do Sul", endereco_rua:"Rua das Flores" };
  it("encontra Elaine Francine apesar de ela não ter login", () => {
    const rows = montarBuscaWhatsapp([profile], [historico], [pedido], "Elaine Francine");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      source:"historico", id:null, nome:"Elaine Francine",
      endereco:"Rua das Flores", numero:"10", email:"elaine@example.com",
    });
  });
  it("não confunde duas Elaines de pessoas diferentes", () => {
    const rows = montarBuscaWhatsapp([profile], [historico], [pedido], "Elaine");
    expect(rows).toHaveLength(2);
    expect(rows.find(r=>r.source==="conta")?.id).toBe("conta-1");
    expect(rows.find(r=>r.source==="historico")?.id).toBeNull();
  });
  it("localiza pelo telefone formatado e prioriza histórico consolidado", () => {
    const rows = montarBuscaWhatsapp([profile], [historico], [pedido], "9999");
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("historico");
    expect(telefoneChave("+55 (47) 99999-1111")).toBe("47999991111");
  });
  it("clientes sem telefone não se misturam por coincidência de nome", () => {
    const rows = montarBuscaWhatsapp([],[],[
      {id:"um",nome_cliente:"Maria",telefone_cliente:""},
      {id:"dois",nome_cliente:"Maria",telefone_cliente:""},
    ],"Maria");
    expect(rows).toHaveLength(2);
  });
});

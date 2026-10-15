import { describe, expect, it } from "vitest";
import { phoneForWhatsapp, isOpenOrder, orderWhatsappMessage, orderWhatsappUrl } from "./order-whatsapp";

describe("WhatsApp de pedidos abertos", () => {
  it("converte números brasileiros para wa.me e recusa contato incompleto", () => {
    expect(phoneForWhatsapp("(47) 99999-8888")).toBe("5547999998888");
    expect(phoneForWhatsapp("+55 (47) 99999-8888")).toBe("5547999998888");
    expect(phoneForWhatsapp("4799999")).toBe("");
  });
  it("oferece WhatsApp somente enquanto o pedido está em aberto", () => {
    for (const status of ["pendente", "preparando", "pronto para retirada", "saiu para entrega"])
      expect(isOpenOrder(status)).toBe(true);
    for (const status of ["entregue", "cancelado", "rascunho"])
      expect(isOpenOrder(status)).toBe(false);
  });
  it("gera mensagem pronta com pedido e itens em ordem numérica", () => {
    const order = {
      id:"12345678-xyz", nome_cliente:"Maria Silva", telefone_cliente:"(47) 99999-8888",
      status:"preparando", metodo_entrega:"retirada", horario_recebimento:"16/10/2026 - 15:00",
      valor_total:65.90,
      itens:[{quantidade:2, produtos:{nome:"TD09 - Panqueca"}},{quantidade:1,produtos:{nome:"TD01 - Frango"}}]
    };
    const msg=orderWhatsappMessage(order);
    expect(msg).toContain("Maria");
    expect(msg).toContain("Retirada na loja");
    expect(msg.indexOf("TD01")).toBeLessThan(msg.indexOf("TD09"));
    const link=orderWhatsappUrl(order);
    expect(link).toContain("https://wa.me/5547999998888?text=");
    expect(decodeURIComponent(link!.split("?text=")[1])).toContain("TD01");
    expect(orderWhatsappUrl({...order,status:"entregue"})).toBeNull();
    expect(orderWhatsappUrl({...order,telefone_cliente:""})).toBeNull();
  });
});

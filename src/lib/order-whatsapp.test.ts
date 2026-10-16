import { describe, expect, it } from "vitest";
import { phoneForWhatsapp, isOpenOrder, orderWhatsappMessage, orderWhatsappUrl } from "./order-whatsapp";

describe("Mensagem WhatsApp dos pedidos", () => {
  it("normaliza telefones brasileiros e não cria link com número inválido", () => {
    expect(phoneForWhatsapp("(47) 99999-8888")).toBe("5547999998888");
    expect(phoneForWhatsapp("+55 (47) 99999-8888")).toBe("5547999998888");
    expect(phoneForWhatsapp("4799999")).toBe("");
  });
  it("só mostra o botão para pedidos em aberto", () => {
    for (const status of ["pendente", "preparando", "pronto para retirada", "saiu para entrega"])
      expect(isOpenOrder(status)).toBe(true);
    for (const status of ["entregue", "cancelado", "rascunho"])
      expect(isOpenOrder(status)).toBe(false);
  });
  it("usa o padrão SaborosaMente com nome, data completa, endereço, pagamento e código em ordem", () => {
    const order = {
      id: "ABC12345-5678", nome_cliente: "Talita Souza",
      telefone_cliente: "(47) 99999-8888", status: "preparando",
      metodo_entrega: "entrega", horario_recebimento: "08/04/2024 após 18h30",
      endereco_rua: "Rua Exemplo", endereco_numero: "42", endereco_bairro: "Centro",
      endereco_cidade: "São Bento do Sul", endereco_complemento: "Sala 2",
      metodo_pagamento: "cartao", tipo_cartao: "Débito • Elo", valor_total: 112.5,
      itens: [
        { quantidade: 2, produtos: { nome: "TD09 - Panqueca" }, observacao: "Peso: 300g" },
        { quantidade: 1, produtos: { nome: "TD01 - Frango 200g" }, tamanho: "200g" },
      ],
    };
    const msg = orderWhatsappMessage(order);
    expect(msg).toContain("Olá, Talita! 🙌🏻");
    expect(msg).toContain("Aqui é da SaborosaMente 🫶🏼");
    expect(msg).toContain("*#ABC12345*");
    expect(msg).toContain("*entregue* na Segunda-feira, 08/04, após 18h30 🎉");
    expect(msg).toContain("*Entrega:* Segunda-feira, 08/04, após 18h30");
    expect(msg).toContain("*Local de Entrega:* Rua Exemplo, 42 - Sala 2 - Centro - São Bento do Sul");
    expect(msg).toContain("*Forma de Pagamento:* Cartão — Débito • Elo");
    expect(msg.indexOf("TD01")).toBeLessThan(msg.indexOf("TD09"));
    expect(msg).toContain("1x TD01 - Frango 200g");
    expect(msg).not.toContain("200g (200g)");
    expect(msg).toContain("2x TD09 - Panqueca (300g)");
    expect(msg.replace(/\u00a0/g, " ")).toContain("*Total:* R$ 112,50");
    expect(msg).toContain("Qualquer dúvida, estamos à disposição! 🤩");
    const link = orderWhatsappUrl(order);
    expect(link).toContain("https://wa.me/5547999998888?text=");
    expect(decodeURIComponent(link!.split("?text=")[1])).toBe(msg);
  });
  it("preserva faixa de entrega agendada P10 com dia e mês, sem inventar dia da semana", () => {
    const msg = orderWhatsappMessage({
      id: "d55aa1", nome_cliente: "Cliente Exemplo", status: "pendente",
      metodo_entrega: "entrega", horario_recebimento: "16/10 - 15:00 - 18:00",
      endereco_rua: "Travessa Teste", endereco_numero: "144",
      endereco_bairro: "Centro", endereco_cidade: "Rio Negrinho",
      metodo_pagamento: "cartao", tipo_cartao: "Débito • ELO", valor_total: 112.5,
      itens: [{ nome_item: "SO04 - Sopa de feijão", quantidade: 1, observacao: "Peso: 400g" }],
    });
    expect(msg).toContain("*entregue* no dia 16/10, das 15h às 18h");
    expect(msg).not.toContain("Sexta-feira");
    expect(msg).toContain("*Local de Entrega:* Travessa Teste, 144 - Centro - Rio Negrinho");
    expect(msg).toContain("SO04 - Sopa de feijão (400g)");
    expect(msg).toContain("Cartão — Débito • ELO");
  });
  it("distingue retirada e não inventa endereço ou horário desconhecidos", () => {
    const msg = orderWhatsappMessage({
      id: "12345678", nome_cliente: "Maria", status: "preparando",
      metodo_entrega: "retirada", valor_total: 45.2,
      itens: [{ nome_item: "TD05 - Arroz carreteiro", quantidade: 1 }],
    });
    expect(msg).toContain("*retirado* 🎉");
    expect(msg).toContain("*Retirada:* Horário a combinar");
    expect(msg).toContain("*Local de Retirada:* Loja SaborosaMente");
    expect(msg).toContain("*Forma de Pagamento:* A combinar");
    expect(msg).not.toContain("Local de Entrega");
    expect(msg).not.toContain("undefined");
    expect(msg).not.toContain("null");
  });
  it("formata data ISO válida sem deslocamento de fuso e conserva formato com intervalos", () => {
    const msg = orderWhatsappMessage({
      id: "45", status: "preparando", nome_cliente: "Ana", metodo_entrega: "entrega",
      horario_recebimento: "2026-10-16 15:00 - 18:00", valor_total: 80,
    });
    expect(msg).toContain("Sexta-feira, 16/10, das 15h às 18h");
  });
});

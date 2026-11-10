import { describe, expect, it } from "vitest";
import { phoneForWhatsapp, isOpenOrder, orderWhatsappMessage, orderWhatsappUrl } from "./order-whatsapp";

describe("Mensagem de confirmação SaborosaMente — WhatsApp", () => {
  it("normaliza número brasileiro para copiar e nunca inventa telefone", () => {
    expect(phoneForWhatsapp("(47) 99999-8888")).toBe("5547999998888");
    expect(phoneForWhatsapp("+55 (47) 99999-8888")).toBe("5547999998888");
    expect(phoneForWhatsapp("4799999")).toBe("");
  });

  it("preserva a identificação de pedidos abertos nas integrações anteriores", () => {
    for (const status of ["pendente", "preparando", "pronto para retirada", "saiu para entrega"])
      expect(isOpenOrder(status)).toBe(true);
    for (const status of ["entregue", "cancelado", "rascunho"])
      expect(isOpenOrder(status)).toBe(false);
  });

  it("segue o modelo do cliente: primeiro nome, data BR, negritos e itens em linhas separadas", () => {
    const order = {
      id: "C076743A-5678", nome_cliente: "Thaís Oliveira", origem: "site",
      telefone_cliente: "(47) 99999-8888", status: "pendente",
      metodo_entrega: "entrega", horario_recebimento: "27/10/2026 • 16:30h ~ 17:30h",
      endereco_rua: "Rua Exemplo", endereco_numero: "42", endereco_bairro: "Centro",
      endereco_cidade: "São Bento do Sul", endereco_cep: "89290-075",
      metodo_pagamento: "alimentacao", tipo_cartao: "Alelo", valor_total: 122.5,
      itens: [
        { quantidade: 1, produtos: { nome: "TD18 - Patinho" }, observacao: "Peso: 400g" },
        { quantidade: 2, produtos: { nome: "TD02 - Almôndegas ao Molho Sugo" }, observacao: "Peso: 400g" },
      ],
    };
    const msg = orderWhatsappMessage(order);
    expect(msg).toContain("Olá, Thaís! 🙌🏻");
    expect(msg).not.toContain("Olá, Thaís Oliveira");
    expect(msg).toContain("Aqui é da *SaborosaMente Refeições, Marmitas e Sopas Congeladas* 🫶");
    expect(msg).toContain("Seu pedido: *#C076743A* feito em nosso site está confirmado");
    expect(msg).toContain("ser entregue na Terça-feira - 27/10, entre 16:30h ~ 17:30h");
    expect(msg).toContain("*Entrega:* Terça-feira - 27/10, entre 16:30h ~ 17:30h");
    expect(msg).toContain("*Local de Entrega:* Rua Exemplo, 42 - Centro - São Bento do Sul - CEP 89290075");
    expect(msg).toContain("*Forma de Pagamento:* Cartão alimentação/refeição — Alelo");
    expect(msg).toContain("*Itens do pedido:*\n\n• 2x TD02 - Almôndegas ao Molho Sugo (400g)");
    expect(msg).toContain("• 1x TD18 - Patinho (400g)");
    expect(msg.indexOf("TD02")).toBeLessThan(msg.indexOf("TD18"));
    expect(msg).not.toContain("R$ 45,00 —");
    expect(msg).toContain("*Total:* R$ 122,50");
    expect(msg.endsWith("Qualquer dúvida, estamos à disposição! 🥰")).toBe(true);
    const url = orderWhatsappUrl(order);
    expect(url).toContain("https://wa.me/5547999998888?text=");
    expect(decodeURIComponent(url!.split("?text=")[1])).toBe(msg);
  });

  it("retirada mostra o endereço da loja, e não inventa um horário por ler '15 minutos' como 15 horas", () => {
    const msg = orderWhatsappMessage({
      id: "12345678", nome_cliente: "Maria da Silva", status: "preparando", origem: "site",
      metodo_entrega: "retirada", horario_recebimento: "02/11/2026 • Retirada na loja: separação em até 20 minutos",
      endereco_rua: "Rua que não é da loja", endereco_numero: "999",
      valor_total: 45.2, itens: [{ nome_item: "TD05 - Arroz carreteiro", quantidade: 1 }],
    });
    expect(msg).toContain("Olá, Maria!");
    expect(msg).toContain("programado para retirada na Segunda-feira - 02/11");
    expect(msg).toContain("*Retirada:* Segunda-feira - 02/11, separação em até 20 minutos");
    expect(msg).toContain("*Local de Retirada:* Rua Estevão Buschle, 114 - 25 de Julho - São Bento do Sul - CEP 89290075");
    expect(msg).not.toContain("Rua que não é da loja");
    expect(msg).not.toContain("às 15h");
    expect(msg).toContain("*Forma de Pagamento:* A combinar");
  });

  it("não inventa dia da semana para agendamento parcial do WhatsApp/P10", () => {
    const msg = orderWhatsappMessage({
      id: "d55aa1", nome_cliente: "Cliente Exemplo", origem: "whatsapp", status: "pendente",
      metodo_entrega: "entrega", horario_recebimento: "16/10 - 15:00 - 18:00",
      endereco_rua: "Travessa Teste", endereco_numero: "144", endereco_bairro: "Centro",
      endereco_cidade: "Rio Negrinho", metodo_pagamento: "cartao", tipo_cartao: "Débito • ELO",
      valor_total: 112.5, itens: [{ nome_item: "SO04 - Sopa de feijão", quantidade: 1, observacao: "Peso: 400g" }],
    });
    expect(msg).toContain("*Entrega:* 16/10, entre 15:00h ~ 18:00h");
    expect(msg).not.toContain("Sexta-feira");
    expect(msg).not.toContain("feito em nosso site");
    expect(msg).toContain("• 1x SO04 - Sopa de feijão (400g)");
    expect(msg).toContain("Cartão — Débito • ELO");
  });

  it("formata ISO válido na data civil sem inverter dia/mês por fuso", () => {
    const msg = orderWhatsappMessage({
      id: "45", status: "preparando", nome_cliente: "Ana", metodo_entrega: "entrega",
      horario_recebimento: "2026-10-16 15:00 - 18:00", valor_total: 80,
    });
    expect(msg).toContain("Sexta-feira - 16/10, entre 15:00h ~ 18:00h");
    expect(msg).toContain("*Local de Entrega:* Endereço a confirmar");
    expect(msg).not.toContain("undefined");
  });
});

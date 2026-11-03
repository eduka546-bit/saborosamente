import { describe, expect, it } from "vitest";
import { formatOrderDateBR } from "./date-br";

describe("datas de pedidos no painel administrativo", () => {
  it("preserva a data de entrega real do pedido A62BC4E3, 2 de novembro", () => {
    const horarioRecebimento = "02/11/2026 • 15:30h ~ 16:30h";
    const dataExtraida = horarioRecebimento.match(/\b\d{2}\/\d{2}\/\d{4}\b/)?.[0];
    expect(formatOrderDateBR(dataExtraida)).toBe("02/11/2026");
    expect(formatOrderDateBR(dataExtraida)).not.toBe("11/02/2026");
  });

  it("mantém DD/MM/AAAA em outras datas sem inverter os números", () => {
    expect(formatOrderDateBR("11/02/2026")).toBe("11/02/2026");
    expect(formatOrderDateBR("31/12/2026")).toBe("31/12/2026");
    expect(formatOrderDateBR("01/03/2027")).toBe("01/03/2027");
  });

  it("converte datas do banco no formato ISO sem inverter mês e dia", () => {
    expect(formatOrderDateBR("2026-11-02")).toBe("02/11/2026");
    expect(formatOrderDateBR("2026-02-11")).toBe("11/02/2026");
    expect(formatOrderDateBR("2026-11-02T15:30:00")).toBe("02/11/2026");
  });

  it("formata timestamps UTC na data civil de Brasília", () => {
    expect(formatOrderDateBR("2026-11-02T17:49:09.476Z")).toBe("02/11/2026");
    expect(formatOrderDateBR("2026-11-02T01:30:00.000Z")).toBe("01/11/2026");
  });

  it("não inventa datas para valores ausentes ou sem formato conhecido", () => {
    expect(formatOrderDateBR(null)).toBe("");
    expect(formatOrderDateBR(undefined)).toBe("");
    expect(formatOrderDateBR("")).toBe("");
    expect(formatOrderDateBR("agendado")).toBe("agendado");
  });
});

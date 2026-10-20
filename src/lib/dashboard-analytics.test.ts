import { describe, expect, it } from "vitest";
import { calculateKPIs } from "./dashboard-analytics";

describe("calculateKPIs", () => {
  it("does not expose invalid dashboard values when there are no valid orders", () => {
    const kpis = calculateKPIs([{ created_at: "invalid" }], []);

    expect(kpis.peakHour).toBe("Sem dados");
    expect(kpis.topPaymentMethod).toBe("Não informado");
  });

  it("uses the order date and payment method when they are available", () => {
    const kpis = calculateKPIs(
      [
        { created_at: "2026-10-10T09:00:00.000Z", metodo_pagamento: "PIX", valor_total: 20 },
        { created_at: "2026-10-10T09:30:00.000Z", metodo_pagamento: "PIX", valor_total: 30 },
      ],
      [],
    );

    expect(kpis.peakHour).toBe(`${new Date("2026-10-10T09:00:00.000Z").getHours()}:00`);
    expect(kpis.topPaymentMethod).toBe("PIX");
  });
});

import { describe, expect, it } from "vitest";
import {
  MAX_DIAS_PLANEJAMENTO, alterarLimitePeriodo, dataISOValida,
  deslocarPeriodo, listarDatasPeriodo, periodoComDuracao, quantidadeDiasPeriodo,
  selecionarDiasPeriodo, somarDiasPeriodo,
} from "./cozinha-periodo";

describe("período flexível da cozinha", () => {
  it("permite 1, 3, 7, 14, 30, 60 e 90 dias inclusivos", () => {
    for (const dias of [1, 3, 7, 14, 30, 60, 90]) {
      const p = periodoComDuracao("2026-10-14", dias);
      expect(quantidadeDiasPeriodo(p.inicio, p.fim)).toBe(dias);
      expect(listarDatasPeriodo(p.inicio, p.fim)).toHaveLength(dias);
    }
  });
  it("atravessa mudanças de mês, ano e fevereiro bissexto sem repetir datas", () => {
    expect(somarDiasPeriodo("2028-02-28", 1)).toBe("2028-02-29");
    expect(somarDiasPeriodo("2028-02-28", 2)).toBe("2028-03-01");
    expect(somarDiasPeriodo("2026-12-31", 1)).toBe("2027-01-01");
    expect(dataISOValida("2026-02-30")).toBe(false);
    expect(listarDatasPeriodo("2026-12-30","2027-01-02")).toEqual(["2026-12-30","2026-12-31","2027-01-01","2027-01-02"]);
  });
  it("ajusta limites inválidos sem deixar mais de 90 dias de consulta", () => {
    const anterior = periodoComDuracao("2026-10-12", 7);
    const reduzido = alterarLimitePeriodo(anterior, "fim", "2026-10-14");
    expect(listarDatasPeriodo(reduzido.inicio,reduzido.fim)).toHaveLength(3);
    const maior = alterarLimitePeriodo(anterior, "fim", "2027-03-01");
    expect(quantidadeDiasPeriodo(maior.inicio, maior.fim)).toBe(MAX_DIAS_PLANEJAMENTO);
    const reverso = alterarLimitePeriodo(anterior, "inicio", "2026-11-01");
    expect(reverso.inicio).toBe("2026-11-01");
    expect(reverso.fim).toBe("2026-11-01");
    expect(alterarLimitePeriodo(anterior,"fim","invalido")).toEqual(anterior);
  });
  it("as setas navegam exatamente a extensão do período escolhido", () => {
    const p = { inicio: "2026-10-14", fim: "2026-10-16" };
    expect(deslocarPeriodo(p, 1)).toEqual({inicio:"2026-10-17",fim:"2026-10-19"});
    expect(deslocarPeriodo(p, -1)).toEqual({inicio:"2026-10-11",fim:"2026-10-13"});
  });
  it("somente os dias selecionados entram na soma; preparos dos demais não são considerados", () => {
    const datas = listarDatasPeriodo("2026-10-12", "2026-10-16");
    const escolhidos = selecionarDiasPeriodo(datas, new Set(["2026-10-13","2026-10-15"]));
    const registros = [
      { data: "2026-10-12", tilapiaCrua: 500, preparo: "Tilápia assada" },
      { data: "2026-10-13", tilapiaCrua: 1200, preparo: "Tilápia assada" },
      { data: "2026-10-14", tilapiaCrua: 600, preparo: "Frango empanado" },
      { data: "2026-10-15", tilapiaCrua: 700, preparo: "Tilápia assada" },
    ];
    expect(escolhidos).toEqual(["2026-10-12","2026-10-14","2026-10-16"]);
    expect(registros.filter(r=>escolhidos.includes(r.data)).reduce((sum,r)=>sum+r.tilapiaCrua,0)).toBe(1100);
    const porDia = registros.filter(r=>escolhidos.includes(r.data)).map(r=>({dia:r.data,preparo:r.preparo}));
    expect(porDia).toEqual([{dia:"2026-10-12",preparo:"Tilápia assada"},{dia:"2026-10-14",preparo:"Frango empanado"}]);
  });
});

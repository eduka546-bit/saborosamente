import { describe, expect, it } from "vitest";
import { criarRelatorioWhatsApp } from "./WhatsAppReports";
import type { AtendimentoEstado, Etiqueta } from "./WhatsAppBusinessTools";

const etiqueta: Etiqueta = { id: "vip", nome: "Cliente VIP", cor: "#a855f7" };
const estado = (id: string, extras: Partial<AtendimentoEstado> = {}): AtendimentoEstado => ({
  conversa_id: id, fixada: false, arquivada: false, marcada_nao_lida: false,
  ultima_leitura: null, etiquetas: [], anotacoes: "", responsavel_id: null,
  lembrete_em: null, lembrete_texto: null, resolvida_em: null, ...extras,
});

describe("WhatsApp Business — relatório", () => {
  it("não inventa tempos quando mensagens não têm timestamp", () => {
    const r = criarRelatorioWhatsApp([
      { id:"a", modo:"humano", mensagens:[{ role:"user", content:"Olá" }] },
    ], [], []);
    expect(r.total).toBe(1);
    expect(r.aguardando).toBe(1);
    expect(r.tempoMedioMin).toBeNull();
    expect(r.amostraTempos).toBe(0);
  });

  it("calcula tempos apenas entre fala do cliente e resposta com horário válido", () => {
    const r = criarRelatorioWhatsApp([
      { id:"a", modo:"humano", mensagens:[
        { role:"user",timestamp:"2026-11-18T12:00:00Z" },
        { role:"assistant",manual:true,timestamp:"2026-11-18T12:05:00Z" },
        { role:"user",timestamp:"2026-11-18T12:20:00Z" },
        { role:"assistant",manual:false,timestamp:"2026-11-18T12:25:00Z" },
      ] },
    ], [], []);
    expect(r.tempoMedioMin).toBe(5);
    expect(r.amostraTempos).toBe(2);
    expect(r.respostaIA).toBe(1);
  });

  it("conta etiquetas, conversas fixadas, arquivadas e atribuídas", () => {
    const r = criarRelatorioWhatsApp([
      { id:"a",modo:"humano",mensagens:[{role:"user"}] },
      { id:"b",modo:"ia",mensagens:[{role:"assistant",manual:false}] },
    ], [
      estado("a", { fixada:true, arquivada:true, etiquetas:["vip"], responsavel_id:"staff1" }),
      estado("b", { etiquetas:["vip"] }),
    ], [etiqueta]);
    expect(r.total).toBe(2);
    expect(r.humanos).toBe(1);
    expect(r.arquivadas).toBe(1);
    expect(r.fixadas).toBe(1);
    expect(r.comResponsavel).toBe(1);
    expect(r.etiquetas[0].quantidade).toBe(2);
  });
});

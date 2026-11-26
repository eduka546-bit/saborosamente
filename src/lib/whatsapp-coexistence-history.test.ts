import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const agent = readFileSync(new URL("../../supabase/functions/whatsapp-agent/index.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../../supabase/migrations/20261126095500_whatsapp_coexistencia_historico_integral.sql", import.meta.url), "utf8");

describe("histórico integral WhatsApp Business (Coexistence)", () => {
  it("persiste cada lote no arquivo antes de limitar a janela a 30 mensagens", () => {
    expect(migration).toContain("INSERT INTO public.whatsapp_mensagens_historico");
    expect(migration).toContain("ON CONFLICT (conversa_id, chave)");
    expect(migration.indexOf("INSERT INTO public.whatsapp_mensagens_historico"))
      .toBeLessThan(migration.indexOf("LIMIT 30"));
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain("REVOKE ALL ON FUNCTION");
    expect(migration).toContain("TO service_role");
  });
  it("importa o lote completo via RPC atômica em vez de sobrescrever uma janela de 30", () => {
    const start = agent.indexOf("async function appendMensagensCoexistencia(");
    const end = agent.indexOf("async function processarCoexistenciaEchoes(",start);
    expect(start).toBeGreaterThan(-1);
    const section = agent.slice(start,end);
    expect(section).toContain("whatsapp_coexistencia_registrar_lote");
    expect(section).toContain("inicio += 200");
    expect(section).not.toContain(".slice(-30)");
    expect(section).not.toContain('.update(update)');
  });
  it("deduplica pelo ID da Meta e permite tentar novamente após erro de banco", () => {
    expect(migration).toContain("'meta:' || v_id");
    const echo = agent.slice(agent.indexOf("async function processarCoexistenciaEchoes("),
      agent.indexOf("async function obterListaSyncWhatsApp("));
    expect(echo.indexOf("await appendMensagemCoexistencia("))
      .toBeLessThan(echo.indexOf("await registrarIdCoexistencia(echo.id"));
  });
  it("processa todas as alterações de histórico de cada webhook", () => {
    expect(agent).toContain("const todasMudancas");
    expect(agent).toContain("for (const change of todasMudancas)");
    expect(agent).toContain('change?.field === "history"');
    expect(agent).toContain("appendMensagensCoexistencia(telefoneThread, nome, historicoCompleto, false)");
    expect(agent).toContain('"coexistencia_history_sync"');
  });
});

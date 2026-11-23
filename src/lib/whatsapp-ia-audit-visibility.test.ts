import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CENARIOS_AUDITORIA } from "./whatsapp-ia-audit";

const componente = readFileSync(new URL("../components/admin/WhatsAppIAAudit.tsx", import.meta.url), "utf8");

describe("auditoria final do WhatsApp: todos os 100 casos visíveis", () => {
  it("exige os dez lotes e 100 respostas distintas do servidor", () => {
    expect(CENARIOS_AUDITORIA.map(c => c.id)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
    expect(componente).toContain("ids.length !== 10");
    expect(componente).toContain("nova.length !== 100");
    expect(componente).toContain("new Set(nova.map(r => r.id)).size !== 100");
  });
  it("carrega automaticamente no painel sem exigir clicar em um botão", () => {
    expect(componente).toContain("void buscarAuditoriaFinal().then");
    expect(componente).toContain("setOrigemRelatorio(\"servidor\")");
    expect(componente).toContain("As 100 respostas finais estão carregadas");
  });
  it("não esconde o restante das respostas em rolagem interna de 560 pixels", () => {
    expect(componente).not.toContain("max-h-[560px]");
    expect(componente).toContain('filtrados.map(r => <details');
    expect(componente).toContain("Mostrando {filtrados.length} de {resultados.length} respostas");
    expect(componente).toContain("Mostrar todas");
  });
  it("preserva a revisão humana e as observações para os 100 casos", () => {
    expect(componente).toContain(".update({revisao:parecer})");
    expect(componente).toContain(".update({observacoes: observacoes.slice(0,1000)})");
    expect(componente).toContain("runId: String(x.run_id)");
  });
});

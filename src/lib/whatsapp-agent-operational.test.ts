import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const agente = readFileSync(new URL("../../supabase/functions/whatsapp-agent/index.ts", import.meta.url), "utf8");

describe("regras operacionais do agente ativo no WhatsApp", () => {
  it("usa preços por faixa com tabela do checkout e não soma desconto percentual", () => {
    expect(agente).toContain("normalizarPrecosMarmita(configuracao.data?.parametros_loja?.precos_marmita)");
    expect(agente).toContain("NÃO aplique novamente 3%, 7% ou 12%");
    expect(agente).not.toContain("5 ou mais marmitas: 3% de desconto");
    expect(agente).not.toContain("A ÚNICA EXCEÇÃO é quando o cliente pedir");
  });
  it("nunca oferece produtos ocultos no cardápio público", () => {
    expect(agente).toContain('.eq("ativo", true).eq("visivel_online", true)');
  });
  it("não confunde estoque não controlado com garantido", () => {
    expect(agente).toContain('p.controle_estoque');
    expect(agente).toContain('confirmar disponibilidade com a equipe');
  });
  it("confere telefone do remetente antes de permitir consulta por protocolo", () => {
    expect(agente).toContain("pedidosVisiveisAoContato(data ?? [], numero, protocolo)");
    expect(agente).not.toContain('query = query.ilike("id"');
  });
  it("não autentica pessoas ou vincula cadastros a partir de CPF em texto", () => {
    expect(agente).toContain('async function buscarClientePorCpf(');
    expect(agente).not.toContain('.update({ telefone }).eq("id", profile.id)');
    expect(agente).not.toContain('name: "buscar_cliente_cpf"');
  });
  it("não permite URL arbitrária proposta pela IA no envio de arquivos", () => {
    expect(agente).toContain("(arquivosPermitidos ?? []).find(");
    expect(agente).toContain('url.startsWith("https://")');
  });
  it("PARAR registra descadastro global e o atendimento humano não usa esse comando", () => {
    expect(agente).toContain('from("whatsapp_marketing_optout").upsert');
    expect(agente).toContain('origem:"pedido_explicito_de_atendente"');
    expect(agente).toContain('modo:"humano"');
  });
  it("campanhas bloqueiam envios de opt-out registrados", () => {
    const campanha = readFileSync(new URL("../../supabase/functions/whatsapp-campanha-enviar/index.ts", import.meta.url), "utf8");
    expect(campanha).toContain('from("whatsapp_marketing_optout")');
    expect(campanha).toContain('status:"bloqueado"');
    expect(campanha).toContain('if (optOut)');
  });
  it("orienta o atendimento humano em alergia ou comprovante sem verificação", () => {
    expect(agente).toContain("contaminação cruzada");
    expect(agente).toContain("Comprovantes enviados por foto não comprovam recebimento bancário");
  });
});

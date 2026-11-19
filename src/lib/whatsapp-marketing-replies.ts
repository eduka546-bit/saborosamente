export const normalizarCTA = (value: unknown) => String(value ?? "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, " ").trim();

const ACOES: Record<string, string> = {
  "cardapio": "menu_cardapio", "menu cardapio": "menu_cardapio", "btn cardapio": "menu_cardapio",
  "solicitar cardapio": "menu_cardapio", "solicitar o cardapio": "menu_cardapio",
  "ver cardapio": "menu_cardapio", "ver o cardapio": "menu_cardapio",
  "quero cardapio": "menu_cardapio", "quero o cardapio": "menu_cardapio",
  "receber cardapio": "menu_cardapio", "receber o cardapio": "menu_cardapio",
  "enviar cardapio": "menu_cardapio", "cardapio completo": "menu_cardapio",
  "fazer pedido": "menu_pedido", "fazer um pedido": "menu_pedido", "menu pedido": "menu_pedido",
  "btn pedido": "menu_pedido", "quero fazer pedido": "menu_pedido", "quero fazer um pedido": "menu_pedido",
  "falar com atendente": "menu_atendente", "falar com a equipe": "menu_atendente",
  "acessar o site": "menu_site", "ver site": "menu_site",
};

// Ações exclusivamente identificadas em botões reais de templates/CTA.
// Não interpreta texto livre ou "sim" ambíguo como pedido de cardápio.
export const ACOES_CONFIGURAVEIS = [
  ["menu_cardapio", "Enviar cardápio e menu"],
  ["menu_pedido", "Iniciar pedido com a equipe"],
  ["menu_atendente", "Falar com atendente (cashback, repetir pedido, etc.)"],
  ["menu_site", "Enviar link do site"],
  ["duvida_como_funciona", "Como funciona"],
  ["duvida_entrega", "Entrega e mínimo"],
  ["duvida_pagamento", "Formas de pagamento"],
  ["duvida_descontos", "Descontos"],
] as const;
export type RegraBotao = { chave: string; acao: string; ativo: boolean };
export function identificarAcaoMarketing(msg: any, regras: RegraBotao[] = []): string | null {
  const botao = msg?.button ?? msg?.interactive?.button_reply;
  if (!botao) return null;
  const rotulo = normalizarCTA(botao.text ?? botao.title);
  const id = normalizarCTA(botao.payload ?? botao.id);
  // O rótulo recebido pelo cliente é prioritário; payloads podem ser IDs opacos.
  if (/^(nao|parar|sair|cancelar|stop)( |$)/.test(rotulo)) return null;
  const custom = regras.find(r => r.ativo === true && r.chave === rotulo && ACOES_CONFIGURAVEIS.some(([acao]) => acao === r.acao));
  if (custom) return custom.acao;
  return Object.hasOwn(ACOES, rotulo) ? ACOES[rotulo] : Object.hasOwn(ACOES, id) ? ACOES[id] : null;
}

export async function executarCardapioEMenu(acoes: {
  enviarPdf: () => Promise<boolean>;
  enviarLink: () => Promise<boolean>;
  enviarMenu: () => Promise<boolean>;
}): Promise<{ cardapio: "pdf" | "link" | "falha"; menuEnviado: boolean }> {
  const pdf = await acoes.enviarPdf().catch(() => false);
  const cardapio = pdf ? "pdf" : await acoes.enviarLink().catch(() => false) ? "link" : "falha";
  if (cardapio === "falha") return { cardapio, menuEnviado: false };
  return { cardapio, menuEnviado: await acoes.enviarMenu().catch(() => false) };
}

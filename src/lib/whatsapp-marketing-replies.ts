const normalizarCTA = (value: unknown) => String(value ?? "")
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
export function identificarAcaoMarketing(msg: any): string | null {
  const botao = msg?.button ?? msg?.interactive?.button_reply;
  if (!botao) return null;
  const rotulo = normalizarCTA(botao.text ?? botao.title);
  const id = normalizarCTA(botao.payload ?? botao.id);
  // O rótulo recebido pelo cliente é prioritário; payloads podem ser IDs opacos.
  if (/^(nao|parar|sair|cancelar|stop)( |$)/.test(rotulo)) return null;
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

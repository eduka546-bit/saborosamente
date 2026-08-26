import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// Variáveis de ambiente — validadas no startup para falhar cedo e com clareza
// ─────────────────────────────────────────────────────────────────────────────

function requireEnv(nome: string): string {
  const valor = Deno.env.get(nome);
  if (!valor) {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${nome}. ` +
        `Configure os secrets da função (supabase secrets set ${nome}=...) antes de fazer o deploy.`,
    );
  }
  return valor;
}

const OPENAI_API_KEY = requireEnv("OPENAI_API_KEY");
const WHATSAPP_TOKEN = requireEnv("WHATSAPP_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "saborosamente-webhook-2026";
const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const JANELA_DE_CONVERSA_MS = 12 * 60 * 60 * 1000;
// Após esse tempo sem atividade em atendimento humano, o bot reassume a conversa
// (evita deixar o cliente no vácuo se ninguém da equipe respondeu).
const HANDOFF_TIMEOUT_MS = 6 * 60 * 60 * 1000;
const MEDIA_DELIVERY_BUFFER_MS = 5000;
const OPENAI_TIMEOUT_MS = 25_000;
const WHATSAPP_API_VERSION = "v20.0";
const MAX_TENTATIVAS_ENVIO = 2; // tentativas de reenvio de mídia ao WhatsApp
const IMG_TRANSFORM = "width=800&quality=75"; // otimização de imagem do Supabase Storage
const SITE_URL = "saborosamente.vercel.app";
// Mensagem padrão quando a OpenAI falha (timeout/erro transitório).
const MSG_ERRO_TECNICO = "Desculpe, tive um problema técnico. Tente novamente em instantes! 🙏";

// Desconto progressivo — deve espelhar src/lib/cart.tsx (PROGRESSIVE_DISCOUNT).
// O desconto incide APENAS sobre marmitas; sopas e complementos contam na
// quantidade total mas não recebem desconto.
const FAIXAS_DESCONTO_PROGRESSIVO = [
  { min: 20, desconto: 0.07 },
  { min: 10, desconto: 0.05 },
  { min: 5, desconto: 0.03 },
];
// "combo" cobre os Combos Prontos (já têm desconto no preço): contam na
// quantidade mas não recebem desconto progressivo adicional.
const CATEGORIAS_SEM_DESCONTO = ["sopa", "complemento", "combo"];

function categoriaSemDesconto(categoria: string | null | undefined): boolean {
  const c = String(categoria ?? "").toLowerCase();
  return CATEGORIAS_SEM_DESCONTO.some((termo) => c.includes(termo));
}

// Retorna a porcentagem de desconto (0, 0.03, 0.05 ou 0.07) para uma quantidade total.
function descontoProgressivoPorQuantidade(totalUnidades: number): number {
  return FAIXAS_DESCONTO_PROGRESSIVO.find((f) => totalUnidades >= f.min)?.desconto ?? 0;
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Cloud API helpers
// ─────────────────────────────────────────────────────────────────────────────

const WHATSAPP_MESSAGES_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

// Faz um POST no endpoint /messages do WhatsApp, centralizando URL, headers e
// tratamento de erro/rede. Retorna true se a API aceitou a requisição.
async function postWhatsApp(payload: Record<string, unknown>, contexto: string): Promise<boolean> {
  const res = await fetch(WHATSAPP_MESSAGES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).catch((error) => {
    console.error(`${contexto} network error:`, error);
    return null;
  });

  if (!res) return false;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error(`${contexto} error:`, JSON.stringify(err));
    return false;
  }
  return true;
}

async function sendWhatsAppMessage(to: string, text: string) {
  await postWhatsApp(
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: removerLinksDeArquivos(text) },
    },
    "sendWhatsAppMessage",
  );
}

// Nota: a API de "mark as read"/typing do WhatsApp Cloud não usa o campo "to"
// no corpo (só messaging_product, message_id e status). O parâmetro é mantido
// por consistência com os demais helpers, mas prefixado com _ por não ser usado.
async function sendTypingIndicator(_to: string, messageId?: string) {
  if (!messageId) return;
  await postWhatsApp(
    {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
      typing_indicator: { type: "text" },
    },
    "sendTypingIndicator",
  );
}

// Envia lista interativa (menu com seções e opções clicáveis)
async function sendWhatsAppList(
  to: string,
  headerText: string,
  bodyText: string,
  buttonLabel: string,
  sections: { title: string; rows: { id: string; title: string; description?: string }[] }[],
): Promise<boolean> {
  return await postWhatsApp(
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        header: { type: "text", text: headerText },
        body: { text: bodyText },
        action: { button: buttonLabel, sections },
      },
    },
    "sendWhatsAppList",
  );
}

// Envia botões de resposta rápida (a API do WhatsApp aceita no máximo 3).
async function sendWhatsAppButtons(
  to: string,
  bodyText: string,
  buttons: { id: string; title: string }[],
) {
  await postWhatsApp(
    {
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: buttons.slice(0, 3).map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    },
    "sendWhatsAppButtons",
  );
}

// Envia o menu principal da Saborosa
async function sendMenuPrincipal(to: string, nomeCliente?: string) {
  const saudacao = nomeCliente ? `Oii, ${nomeCliente.split(" ")[0]}! 🫶🏼` : "Oii! 🫶🏼";
  await sendMenuInterativo(to, saudacao);
}

async function sendMenuInterativo(to: string, saudacao?: string) {
  const menuEnviado = await sendWhatsAppList(
    to,
    "SaborosaMente 🍱",
    saudacao
      ? `${saudacao} Bem-vindo(a)! Como posso te ajudar hoje?\n\nEscolha uma opção abaixo 👇`
      : "Escolha uma opção abaixo 👇",
    "Ver opções",
    [
      {
        title: "O que você precisa?",
        rows: [
          { id: "menu_cardapio", title: "🍽️ Cardápio", description: "Ver pratos e preços" },
          { id: "menu_pedido", title: "🛒 Fazer um pedido", description: "Montar meu pedido" },
          { id: "menu_recomenda", title: "⭐ Recomendações", description: "Escolher um prato" },
          { id: "menu_duvidas", title: "❓ Dúvidas", description: "Entrega, pagamento e preparo" },
          { id: "menu_site", title: "🌐 Acessar o site", description: SITE_URL },
          {
            id: "menu_atendente",
            title: "👤 Falar com atendente",
            description: "Falar com nossa equipe",
          },
        ],
      },
    ],
  );

  if (!menuEnviado) {
    await sendWhatsAppMessage(
      to,
      `${saudacao ? `${saudacao} Bem-vindo(a)! Como posso te ajudar hoje?\n\n` : ""}MENU PRINCIPAL 🍱\n\n1. 🍽️ Cardápio\n2. 🛒 Fazer um pedido\n3. ⭐ Recomendações\n4. ❓ Dúvidas\n5. 🌐 Acessar o site\n6. 👤 Falar com atendente\n\nDigite o número ou escreva o que precisa.`,
    );
  }
}

function solicitouMenuPrincipal(texto: string): boolean {
  const normalizado = texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return (
    /(^|\s)(menu|opcao|opcoes)(\s|$)/.test(normalizado) ||
    ["oi", "ola", "bom dia", "boa tarde", "boa noite"].includes(normalizado)
  );
}

function identificarOpcaoMenu(texto: string): string | null {
  const opcoes: Record<string, string> = {
    "1": "menu_cardapio",
    "2": "menu_pedido",
    "3": "menu_recomenda",
    "4": "menu_duvidas",
    "5": "menu_site",
    "6": "menu_atendente",
  };
  return opcoes[texto.trim()] ?? null;
}

async function sendWhatsAppImage(to: string, imageUrl: string, caption?: string): Promise<boolean> {
  // Otimiza a URL para reduzir egress (transformação de imagem do Supabase Storage).
  let optimizedUrl = imageUrl;
  if (imageUrl.includes("supabase.co")) {
    const separator = imageUrl.includes("?") ? "&" : "?";
    optimizedUrl = `${imageUrl}${separator}${IMG_TRANSFORM}`;
  }

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "image",
    image: { link: optimizedUrl, ...(caption ? { caption } : {}) },
  };

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_ENVIO; tentativa++) {
    if (await postWhatsApp(payload, `sendWhatsAppImage (tentativa ${tentativa})`)) return true;
  }
  return false;
}

async function sendWhatsAppDocument(
  to: string,
  docUrl: string,
  filename: string,
  caption?: string,
): Promise<boolean> {
  const mediaUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/media`;
  const messageUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const arquivo = await fetch(docUrl).catch((error) => {
    console.error("Download do documento falhou:", error);
    return null;
  });
  if (!arquivo?.ok) {
    console.error("Download do documento retornou status:", arquivo?.status);
    return false;
  }

  const arquivoBytes = await arquivo.arrayBuffer();
  let uploadData: { id?: string; error?: unknown } = {};
  let uploadOk = false;

  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    const formData = new FormData();
    formData.append("messaging_product", "whatsapp");
    formData.append("type", "application/pdf");
    formData.append("file", new Blob([arquivoBytes], { type: "application/pdf" }), filename);

    const upload = await fetch(mediaUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` },
      body: formData,
    }).catch((error) => {
      console.error(`Upload do documento para o WhatsApp falhou (tentativa ${tentativa}):`, error);
      return null;
    });
    uploadData = (await upload?.json().catch(() => ({}))) as { id?: string; error?: unknown };
    console.log(
      `Upload do documento resposta (tentativa ${tentativa}):`,
      JSON.stringify(uploadData),
    );
    uploadOk = !!upload?.ok && !!uploadData.id;
    if (uploadOk) break;
    if (tentativa === 1) await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  if (!uploadOk) {
    console.error("Upload do documento recusado após tentativas:", JSON.stringify(uploadData));
    return false;
  }

  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    if (tentativa > 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    const res = await fetch(messageUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "document",
        document: { id: uploadData.id, filename, ...(caption ? { caption } : {}) },
      }),
    }).catch((error) => {
      console.error(`sendWhatsAppDocument network error (tentativa ${tentativa}):`, error);
      return null;
    });
    const err = await res?.json().catch(() => ({}));
    console.log(`sendWhatsAppDocument resposta (tentativa ${tentativa}):`, JSON.stringify(err));
    if (res?.ok) return true;
  }
  return false;
}

function removerLinksDeArquivos(texto: string): string {
  return texto
    .replace(/https?:\/\/[^\s]+supabase\.co\/storage\/[^\s]+/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function enviarCardapioPrincipal(telefone: string): Promise<boolean> {
  const { data: arquivos } = await supabase
    .from("agente_arquivos")
    .select("nome, descricao, tipo, url")
    .eq("ativo", true)
    .or("nome.ilike.%card%,descricao.ilike.%card%")
    .limit(10);

  const arquivo = arquivos?.find((item: any) => {
    const texto = `${item.nome ?? ""} ${item.descricao ?? ""}`.toLowerCase();
    return (
      item.tipo?.toLowerCase() === "pdf" || texto.includes("cardápio") || texto.includes("cardapio")
    );
  });

  if (!arquivo?.url) return false;

  const legenda = "Aqui está nosso cardápio completo! 📎 Escolha o que você quer 😊";
  const enviado = await sendWhatsAppDocument(
    telefone,
    arquivo.url,
    "Cardápio Saborosamente.pdf",
    legenda,
  );
  if (enviado) await new Promise((resolve) => setTimeout(resolve, MEDIA_DELIVERY_BUFFER_MS));
  return enviado;
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversa helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getOrCreateConversa(telefone: string, nome?: string) {
  const { data, error: selectError } = await supabase
    .from("whatsapp_conversas")
    .select("*")
    .eq("telefone", telefone)
    .maybeSingle();

  if (selectError) console.error("getOrCreateConversa (select) erro:", JSON.stringify(selectError));
  if (data) return data;

  const { data: nova, error: insertError } = await supabase
    .from("whatsapp_conversas")
    .insert({ telefone, nome: nome ?? null, mensagens: [], pedido_em_andamento: null })
    .select()
    .single();

  if (insertError) console.error("getOrCreateConversa (insert) erro:", JSON.stringify(insertError));
  return nova;
}

function conversaComecouNovamente(conversa: any, historico: any[]): boolean {
  if (!historico.length) return true;

  const ultimaMensagem = conversa?.ultima_msg ? new Date(conversa.ultima_msg).getTime() : 0;
  return (
    !Number.isFinite(ultimaMensagem) ||
    !ultimaMensagem ||
    Date.now() - ultimaMensagem > JANELA_DE_CONVERSA_MS
  );
}

async function appendMensagem(id: string, mensagens: any[], novaMensagem: any) {
  const atualizado = [...mensagens, novaMensagem].slice(-30);
  await supabase
    .from("whatsapp_conversas")
    .update({ mensagens: atualizado, ultima_msg: new Date().toISOString() })
    .eq("id", id);
  return atualizado;
}

async function salvarPedidoEmAndamento(conversaId: string, pedido: any) {
  await supabase
    .from("whatsapp_conversas")
    .update({ pedido_em_andamento: pedido })
    .eq("id", conversaId);
}

// Registra um evento de observabilidade (escalação, falha de pedido, etc).
// Best-effort: nunca deixa uma falha de log quebrar o fluxo do agente.
async function registrarEvento(
  tipo: string,
  telefone: string,
  conversaId: string | null,
  detalhe: Record<string, unknown> = {},
) {
  try {
    await supabase.from("agente_eventos").insert({
      tipo,
      telefone,
      conversa_id: conversaId,
      detalhe,
    });
  } catch (e: any) {
    console.error("registrarEvento erro:", e?.message ?? e);
  }
}

// Mensagens amigáveis por status de pedido
const STATUS_PEDIDO_MSG: Record<string, string> = {
  rascunho: "está sendo montado 📝",
  novo_pedido: "foi recebido e está aguardando confirmação ⏳",
  pendente: "foi recebido e está aguardando confirmação ⏳",
  pagamento_confirmado: "teve o pagamento confirmado ✅",
  preparando: "está sendo preparado com carinho 👩‍🍳",
  "saiu para entrega": "saiu para entrega 🛵",
  entregue: "foi entregue ✅ Bom apetite! 🍱",
  cancelado: "foi cancelado ❌",
};

// Consulta o status de um pedido. Se houver protocolo, busca por ele; senão,
// o pedido mais recente do telefone. Retorna uma mensagem pronta ao cliente.
async function consultarPedidoStatus(telefone: string, protocolo?: string): Promise<string> {
  try {
    let query = supabase
      .from("pedidos")
      .select("id, status, created_at, metodo_entrega, valor_total")
      .order("created_at", { ascending: false })
      .limit(1);

    const protoLimpo = (protocolo ?? "").replace(/[^0-9a-fA-F]/g, "");
    if (protoLimpo.length >= 6) {
      query = query.ilike("id", `${protoLimpo}%`);
    } else {
      query = query.eq("telefone_cliente", telefone);
    }

    const { data: pedidos, error } = await query;
    if (error) {
      console.error("consultarPedidoStatus erro:", JSON.stringify(error));
      return "Tive um problema para consultar seu pedido agora 😔 Pode tentar de novo em instantes?";
    }

    const pedido = pedidos?.[0];
    if (!pedido) {
      return protoLimpo.length >= 6
        ? "Não encontrei nenhum pedido com esse protocolo 🤔 Confere o número pra mim? É o código que enviei na confirmação."
        : "Não encontrei um pedido recente no seu número 🤔 Se você fez o pedido com outro telefone, me passa o protocolo (o código da confirmação).";
    }

    const proto = String(pedido.id).slice(0, 8).toUpperCase();
    const statusMsg =
      STATUS_PEDIDO_MSG[String(pedido.status).toLowerCase()] ?? `está com status: ${pedido.status}`;
    return `Seu pedido *#${proto}* ${statusMsg}`;
  } catch (e: any) {
    console.error("consultarPedidoStatus exceção:", e?.message ?? e);
    return "Tive um problema para consultar seu pedido agora 😔 Pode tentar de novo em instantes?";
  }
}

// Normaliza texto para comparação (minúsculo, sem acento, sem espaços extras)
function normalizarTexto(s: string | null | undefined): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// Busca a taxa de entrega cadastrada para uma cidade/bairro em delivery_rates.
// Retorna a taxa (number) se a área for atendida, ou null caso contrário.
async function buscarTaxaEntrega(cidade: string, bairro: string): Promise<number | null> {
  const { data: taxas, error } = await supabase
    .from("delivery_rates")
    .select("cidade, bairro, valor")
    .eq("ativo", true);

  if (error) {
    console.error("buscarTaxaEntrega erro:", JSON.stringify(error));
    return null;
  }

  const cidadeN = normalizarTexto(cidade);
  const bairroN = normalizarTexto(bairro);

  const match = (taxas ?? []).find(
    (t: any) => normalizarTexto(t.cidade) === cidadeN && normalizarTexto(t.bairro) === bairroN,
  );

  return match ? Number(match.valor) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Contexto dinâmico do banco
// ─────────────────────────────────────────────────────────────────────────────

async function getProdutosContexto(): Promise<{ texto: string; produtos: any[] }> {
  const { data: produtos, error } = await supabase
    .from("produtos")
    .select("id, nome, preco, preco_300g, preco_400g, descricao, imagem_url, categorias(nome)")
    .eq("ativo", true)
    .order("nome")
    .limit(80);

  if (error) console.error("getProdutosContexto erro:", JSON.stringify(error));
  if (!produtos?.length) return { texto: "", produtos: [] };

  const linhas = produtos.map((p: any) => {
    const cat = p.categorias?.nome ?? "Sem categoria";
    let precos = `R$ ${Number(p.preco).toFixed(2)}`;
    if (p.preco_300g) precos += ` | 300g: R$ ${Number(p.preco_300g).toFixed(2)}`;
    if (p.preco_400g) precos += ` | 400g: R$ ${Number(p.preco_400g).toFixed(2)}`;
    const desc = p.descricao ? ` — ${p.descricao.slice(0, 80)}` : "";
    return `- [ID:${p.id}] ${p.nome} (${cat}) — ${precos}${desc}`;
  });

  return {
    texto: `\n\nCARDÁPIO COMPLETO (sempre consulte aqui antes de informar preços):\n${linhas.join("\n")}`,
    produtos,
  };
}

async function getEntregasContexto(): Promise<string> {
  const { data: taxas } = await supabase
    .from("delivery_rates")
    .select("cidade, bairro, valor")
    .eq("ativo", true)
    .order("cidade")
    .order("bairro");

  if (!taxas?.length)
    return "\n\nÁREAS DE ENTREGA: consulte nossa equipe para confirmar disponibilidade.";

  // Agrupa por cidade
  const porCidade: Record<string, { bairro: string; valor: number }[]> = {};
  for (const t of taxas) {
    if (!porCidade[t.cidade]) porCidade[t.cidade] = [];
    porCidade[t.cidade].push({ bairro: t.bairro, valor: Number(t.valor) });
  }

  const linhas: string[] = [
    "\n\nÁREAS DE ENTREGA (use SOMENTE esses bairros/cidades para confirmar entrega e informar taxa):",
  ];
  for (const [cidade, bairros] of Object.entries(porCidade)) {
    linhas.push(`\n📍 ${cidade}:`);
    for (const b of bairros) {
      linhas.push(`  - ${b.bairro}: R$ ${b.valor.toFixed(2)}`);
    }
  }
  linhas.push(
    "\nSe o bairro/cidade não estiver na lista, informe que não atendemos aquela região ainda.",
  );

  return linhas.join("\n");
}

async function getSiteSettings(): Promise<string> {
  const { data } = await supabase
    .from("site_settings")
    .select("whatsapp, instagram, endereco, payment_methods, meal_flags, card_flags")
    .maybeSingle();

  if (!data) return "";

  const pagamentos: string[] = [];
  if (Array.isArray(data.payment_methods)) {
    data.payment_methods
      .filter((p: any) => p.enabled !== false)
      .forEach((p: any) => pagamentos.push(p.label));
  }
  if (Array.isArray(data.meal_flags)) {
    data.meal_flags
      .filter((p: any) => p.enabled !== false)
      .forEach((p: any) => pagamentos.push(p.label));
  }
  if (Array.isArray(data.card_flags)) {
    data.card_flags
      .filter((p: any) => p.enabled !== false)
      .forEach((p: any) => pagamentos.push(p.label));
  }

  const linhas = ["\n\nINFORMAÇÕES DO NEGÓCIO:"];
  if (data.endereco) linhas.push(`- Endereço loja: ${data.endereco}`);
  if (data.whatsapp) linhas.push(`- WhatsApp: ${data.whatsapp}`);
  if (pagamentos.length) linhas.push(`- Formas de pagamento aceitas: ${pagamentos.join(", ")}`);

  return linhas.join("\n");
}

async function getArquivosContexto(): Promise<{ texto: string; arquivos: any[] }> {
  const { data: arquivos } = await supabase
    .from("agente_arquivos")
    .select("id, nome, descricao, tipo, url")
    .eq("ativo", true)
    .order("ordem");

  if (!arquivos?.length) return { texto: "", arquivos: [] };

  const linhas = arquivos.map(
    (a: any) => `- [${a.tipo.toUpperCase()}] "${a.nome}": ${a.descricao} → URL: ${a.url}`,
  );

  return {
    texto: `\n\nARQUIVOS DISPONÍVEIS PARA ENVIAR AO CLIENTE:\n${linhas.join("\n")}\nQuando o cliente pedir algo relacionado a esses arquivos, use a função enviar_arquivo com a URL correspondente.`,
    arquivos,
  };
}

// Busca módulos ativos do banco e monta o prompt base
async function getModulosPrompt(): Promise<string> {
  const { data: modulos, error } = await supabase
    .from("agente_modulos")
    .select("nome, categoria, conteudo")
    .eq("ativo", true)
    .order("ordem");

  if (error) console.error("getModulosPrompt erro:", JSON.stringify(error));
  if (!modulos?.length) return "";

  // Agrupa por categoria na ordem lógica
  const ordemCategorias = ["identidade", "cardapio", "pedidos", "entregas", "comportamento"];
  const porCategoria: Record<string, any[]> = {};
  for (const mod of modulos) {
    if (!porCategoria[mod.categoria]) porCategoria[mod.categoria] = [];
    porCategoria[mod.categoria].push(mod);
  }

  const secoes: string[] = [];
  for (const cat of ordemCategorias) {
    const mods = porCategoria[cat];
    if (!mods?.length) continue;
    for (const mod of mods) {
      secoes.push(`## ${mod.nome}\n${mod.conteudo}`);
    }
  }

  // Categorias extras não previstas na ordem
  for (const [cat, mods] of Object.entries(porCategoria)) {
    if (!ordemCategorias.includes(cat)) {
      for (const mod of mods) {
        secoes.push(`## ${mod.nome}\n${mod.conteudo}`);
      }
    }
  }

  return secoes.join("\n\n");
}
// ─────────────────────────────────────────────────────────────────────────────
// Reconhecimento de cliente — telefone primeiro, depois CPF
// ─────────────────────────────────────────────────────────────────────────────

async function montarContextoCliente(profile: any): Promise<string> {
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select(
      "id, created_at, valor_total, status, endereco_bairro, endereco_cidade, metodo_pagamento",
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: enderecos } = await supabase
    .from("user_addresses")
    .select("label, cidade, bairro, rua, numero, complemento")
    .eq("user_id", profile.id)
    .order("principal", { ascending: false })
    .limit(3);

  const linhas = [`\n\nCLIENTE RECONHECIDO — personalize o atendimento com essas informações:`];
  linhas.push(`- Nome: ${profile.nome}`);

  if (enderecos?.length) {
    linhas.push(`- Endereços salvos:`);
    enderecos.forEach((e: any) => {
      linhas.push(
        `  • ${e.label ?? "Endereço"}: ${e.rua}, ${e.numero} — ${e.bairro}, ${e.cidade}${e.complemento ? ` (${e.complemento})` : ""}`,
      );
    });
  }

  if (pedidos?.length) {
    linhas.push(`- Últimos pedidos:`);
    pedidos.forEach((p: any) => {
      const data = new Date(p.created_at).toLocaleDateString("pt-BR");
      linhas.push(
        `  • ${data}: R$ ${Number(p.valor_total).toFixed(2)} — ${p.status} — ${p.endereco_bairro ?? "retirada"}`,
      );
    });
    const pagMaisUsado = pedidos[0]?.metodo_pagamento;
    if (pagMaisUsado) linhas.push(`- Forma de pagamento preferida: ${pagMaisUsado}`);

    // Itens do último pedido — permite ao agente oferecer "repetir o de sempre".
    const ultimoPedidoId = pedidos[0]?.id;
    if (ultimoPedidoId) {
      const { data: itens } = await supabase
        .from("pedido_itens")
        .select("quantidade, observacao, produtos:produto_id(nome)")
        .eq("pedido_id", ultimoPedidoId);
      if (itens?.length) {
        const itensTxt = itens
          .map((i: any) => {
            const nome = i.produtos?.nome ?? "item";
            const peso = i.observacao?.replace(/^Peso:\s*/i, "") ?? "";
            return `${i.quantidade}x ${nome}${peso ? ` (${peso})` : ""}`;
          })
          .join(", ");
        linhas.push(
          `- Itens do último pedido (para oferecer repetir, se o cliente quiser): ${itensTxt}`,
        );
      }
    }
  }

  linhas.push(
    `\nChame o cliente pelo primeiro nome. Ao pedir entrega, sugira o endereço salvo. Ao pedir pagamento, sugira o preferido. Se o cliente pedir para "repetir o pedido" ou "o de sempre", use os itens do último pedido acima.`,
  );
  return linhas.join("\n");
}

// Confere se dois telefones representam o mesmo número, ignorando formatação
// e diferenças de DDI/9º dígito (compara pelos últimos 10/11 dígitos).
function telefonesBatem(a: string, b: string): boolean {
  const da = a.replace(/\D/g, "");
  const db = b.replace(/\D/g, "");
  if (!da || !db) return false;
  return da === db || da.slice(-11) === db.slice(-11) || da.slice(-10) === db.slice(-10);
}

async function buscarClientePorTelefone(
  telefone: string,
): Promise<{ encontrado: boolean; contexto: string; profile: any }> {
  const tel = telefone.replace(/\D/g, "");
  if (!tel) return { encontrado: false, contexto: "", profile: null };

  // 1) Filtra no próprio banco pelos últimos 8 dígitos (sobrevive à formatação
  //    e ao 9º dígito/DDI). Isso evita carregar milhares de perfis em memória.
  const sufixo = tel.slice(-8);
  const { data: candidatos, error } = await supabase
    .from("profiles")
    .select("id, nome, telefone, cpf")
    .not("telefone", "is", null)
    .ilike("telefone", `%${sufixo}%`)
    .limit(50);

  if (error) console.error("buscarClientePorTelefone erro:", JSON.stringify(error));

  const profile =
    candidatos?.find((c: any) => telefonesBatem(String(c.telefone ?? ""), tel)) ?? null;
  if (!profile) return { encontrado: false, contexto: "", profile: null };

  const contexto = await montarContextoCliente(profile);
  return { encontrado: true, contexto, profile };
}

async function buscarClientePorCpf(
  cpf: string,
  telefone: string,
): Promise<{ encontrado: boolean; contexto: string; profile: any }> {
  // Remove tudo que não é número
  const cpfNum = cpf.replace(/\D/g, "");
  if (cpfNum.length !== 11) return { encontrado: false, contexto: "", profile: null };

  // Busca candidatos pelos dígitos do CPF e compara de forma EXATA (o CPF no
  // banco pode ter máscara). Evita casar por substring/CPF parcial.
  const { data: candidatos } = await supabase
    .from("profiles")
    .select("id, nome, telefone, cpf")
    .ilike("cpf", `%${cpfNum}%`)
    .limit(20);

  const profile =
    (candidatos ?? []).find((p: any) => String(p.cpf ?? "").replace(/\D/g, "") === cpfNum) ?? null;
  if (!profile) return { encontrado: false, contexto: "", profile: null };

  // Segurança/privacidade: só vincula este telefone ao cadastro se ele NÃO tiver
  // telefone cadastrado. Se já houver um telefone (mesmo diferente), NÃO
  // sobrescrevemos — assim ninguém "rouba" um cadastro alheio informando o CPF.
  const telefoneCadastrado = String(profile.telefone ?? "").replace(/\D/g, "");
  if (telefone && !telefoneCadastrado) {
    await supabase.from("profiles").update({ telefone }).eq("id", profile.id);
    console.log(`Telefone ${telefone} vinculado ao perfil ${profile.id} via CPF (perfil sem telefone)`);
  } else if (telefone && !telefonesBatem(telefone, telefoneCadastrado)) {
    // Cadastro já pertence a outro número: reconhece para leitura mas não vincula.
    console.warn(
      `CPF ${cpfNum} consultado do telefone ${telefone}, mas o cadastro já tem outro telefone. Vínculo NÃO alterado.`,
    );
  }

  const contexto = await montarContextoCliente(profile);
  return { encontrado: true, contexto, profile };
}

// ─────────────────────────────────────────────────────────────────────────────

async function criarPedidoNoBanco(pedidoDados: any): Promise<string | null> {
  try {
    const insertData: any = {
      user_id: null,
      nome_cliente: pedidoDados.nome,
      telefone_cliente: pedidoDados.telefone,
      email_cliente: pedidoDados.email ?? null,
      metodo_entrega: pedidoDados.metodoEntrega,
      metodo_pagamento: pedidoDados.pagamento,
      observacao: pedidoDados.observacoes ?? null,
      valor_total: pedidoDados.valorTotal,
      taxa_entrega: pedidoDados.taxaEntrega ?? 0,
      desconto_aplicado: pedidoDados.descontoAplicado ?? 0,
      status: "preparando",
      origem: "whatsapp",
      horario_recebimento: "",
    };

    if (pedidoDados.metodoEntrega === "entrega") {
      if (pedidoDados.cidade) insertData.endereco_cidade = pedidoDados.cidade;
      if (pedidoDados.bairro) insertData.endereco_bairro = pedidoDados.bairro;
      if (pedidoDados.endereco) insertData.endereco_rua = pedidoDados.endereco;
    }

    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert(insertData)
      .select()
      .single();

    if (pedidoError) {
      console.error("Erro ao criar pedido:", JSON.stringify(pedidoError));
      return null;
    }

    // Resolve produto_id por nome quando o UUID estiver faltando/inválido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const itensResolvidos = await Promise.all(
      pedidoDados.itens.map(async (item: any) => {
        let produtoId = item.produto_id;

        // Se não tiver UUID válido, busca pelo nome
        if (!produtoId || !uuidRegex.test(produtoId)) {
          const { data: prods } = await supabase
            .from("produtos")
            .select("id")
            .ilike("nome", `%${item.nome}%`)
            .eq("ativo", true)
            .limit(1);
          produtoId = prods?.[0]?.id ?? null;
          console.log(`Produto resolvido por nome "${item.nome}": ${produtoId}`);
        }

        return {
          pedido_id: pedido.id,
          produto_id: produtoId,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          observacao: item.peso ? `Peso: ${item.peso}` : null,
        };
      }),
    );

    const { error: itensError } = await supabase.from("pedido_itens").insert(itensResolvidos);

    if (itensError) {
      console.error("Erro ao criar itens:", JSON.stringify(itensError));
      await supabase.from("pedidos").delete().eq("id", pedido.id);
      return null;
    }

    return pedido.id;
  } catch (e: any) {
    console.error("criarPedidoNoBanco exception:", e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI — com function calling para ações estruturadas
// ─────────────────────────────────────────────────────────────────────────────

const FUNCTIONS_SCHEMA = [
  {
    name: "criar_pedido",
    description:
      "Cria um pedido no sistema quando o cliente confirmou todos os dados (nome, itens, endereço/retirada, pagamento). Só use quando o cliente confirmar explicitamente.",
    parameters: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome completo do cliente" },
        telefone: { type: "string", description: "Telefone do cliente (ex: 5547999999999)" },
        metodoEntrega: {
          type: "string",
          enum: ["entrega", "retirada"],
          description: "Método de entrega",
        },
        cidade: { type: "string", description: "Cidade (apenas se entrega)" },
        bairro: { type: "string", description: "Bairro (apenas se entrega)" },
        endereco: { type: "string", description: "Rua e número (apenas se entrega)" },
        pagamento: { type: "string", description: "Forma de pagamento escolhida" },
        observacoes: { type: "string", description: "Observações adicionais do cliente" },
        taxaEntrega: { type: "number", description: "Taxa de entrega em reais" },
        valorTotal: { type: "number", description: "Valor total dos itens (sem taxa de entrega)" },
        itens: {
          type: "array",
          description: "Lista de itens do pedido",
          items: {
            type: "object",
            properties: {
              produto_id: { type: "string", description: "ID do produto (UUID)" },
              nome: { type: "string", description: "Nome do produto" },
              quantidade: { type: "number" },
              preco_unitario: { type: "number" },
              peso: { type: "string", description: "Ex: 300g ou 400g, se aplicável" },
            },
            required: ["produto_id", "nome", "quantidade", "preco_unitario"],
          },
        },
      },
      required: ["nome", "telefone", "metodoEntrega", "pagamento", "valorTotal", "itens"],
    },
  },
  {
    name: "enviar_arquivo",
    description:
      "Envia um arquivo (imagem ou PDF) ao cliente pelo WhatsApp quando ele solicitar ou quando for relevante.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL do arquivo a enviar" },
        tipo: {
          type: "string",
          enum: ["imagem", "pdf", "documento"],
          description: "Tipo do arquivo",
        },
        nome: { type: "string", description: "Nome do arquivo" },
        mensagem: { type: "string", description: "Mensagem de texto para acompanhar o arquivo" },
      },
      required: ["url", "tipo", "mensagem"],
    },
  },
  {
    name: "enviar_menu",
    description:
      "Envia o menu principal interativo com as opções da SaborosaMente. Use na primeira mensagem do cliente, quando ele pedir um menu/opções, ou quando a conversa ficar confusa e precisar de um ponto de partida claro.",
    parameters: {
      type: "object",
      properties: {
        motivo: {
          type: "string",
          description:
            "Motivo de enviar o menu (ex: primeira mensagem, cliente pediu menu, reorientar conversa)",
        },
      },
      required: ["motivo"],
    },
  },
  {
    name: "consultar_cashback",
    description:
      "Consulta o saldo de cashback do cliente quando ele perguntar sobre cashback, saldo, desconto acumulado ou créditos.",
    parameters: {
      type: "object",
      properties: {
        motivo: { type: "string", description: "Por que o cliente quer saber o cashback" },
      },
      required: ["motivo"],
    },
  },
  {
    name: "buscar_cliente_cpf",
    description:
      "Busca o cadastro do cliente pelo CPF quando não foi possível reconhecê-lo pelo telefone. Use quando o cliente informar o CPF durante a conversa. Se encontrar, o sistema vincula o telefone automaticamente.",
    parameters: {
      type: "object",
      properties: {
        cpf: { type: "string", description: "CPF informado pelo cliente (apenas números)" },
      },
      required: ["cpf"],
    },
  },
  {
    name: "consultar_pedido",
    description:
      "Consulta o status de um pedido quando o cliente pergunta sobre o andamento ('cadê meu pedido?', 'meu pedido saiu?'). Se o cliente informar o número/protocolo, passe em 'protocolo'. Caso contrário, o sistema busca o pedido mais recente do próprio telefone.",
    parameters: {
      type: "object",
      properties: {
        protocolo: {
          type: "string",
          description:
            "Protocolo do pedido informado pelo cliente (os primeiros caracteres do código), se houver. Opcional.",
        },
      },
      required: [],
    },
  },
];

async function chamarOpenAI(systemPrompt: string, historico: any[], pedidoEmAndamento: any) {
  const mensagensFiltradas = historico.map((m: any) => ({
    role: m.role,
    content: m.content,
  }));

  const pedidoCtx = pedidoEmAndamento
    ? `\n\nPEDIDO EM ANDAMENTO (estado atual da coleta):\n${JSON.stringify(pedidoEmAndamento, null, 2)}`
    : "";

  const payload = JSON.stringify({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt + pedidoCtx }, ...mensagensFiltradas],
    functions: FUNCTIONS_SCHEMA,
    function_call: "auto",
    max_tokens: 600,
    temperature: 0.65,
  });

  // Faz a chamada com timeout; tenta novamente uma vez em caso de erro de rede,
  // timeout ou erro transitório da OpenAI (429/5xx).
  let data: any = null;
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: payload,
        signal: controller.signal,
      });

      data = await response.json().catch(() => null);

      if (response.ok) break;

      const transitorio = response.status === 429 || response.status >= 500;
      console.error(
        `OpenAI error (tentativa ${tentativa}, status ${response.status}):`,
        JSON.stringify(data),
      );
      if (!transitorio || tentativa === 2) {
        return { tipo: "texto", conteudo: MSG_ERRO_TECNICO };
      }
    } catch (e: any) {
      const motivo = e?.name === "AbortError" ? "timeout" : (e?.message ?? "erro de rede");
      console.error(`OpenAI falhou (tentativa ${tentativa}): ${motivo}`);
      if (tentativa === 2) {
        return { tipo: "texto", conteudo: MSG_ERRO_TECNICO };
      }
    } finally {
      clearTimeout(timeout);
    }

    // Pequeno backoff antes da segunda tentativa
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  const choice = data?.choices?.[0];
  const msg = choice?.message;

  if (msg?.function_call) {
    let args: any = {};
    try {
      args = JSON.parse(msg.function_call.arguments);
    } catch (_) {
      /* ignore */
    }
    return { tipo: "function", nome: msg.function_call.name, args };
  }

  return {
    tipo: "texto",
    conteudo: msg?.content ?? "Desculpe, não consegui processar sua mensagem. Tente novamente.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE AUTOMAÇÕES
// ─────────────────────────────────────────────────────────────────────────────

async function verificarEExecutarAutomacoes(
  telefone: string,
  texto: string,
  conversa: any,
  historico: any[],
  gatilhoTipo: string,
  gatilhoContexto: any = {},
) {
  try {
    // Busca automações ativas com esse gatilho
    const { data: automacoes } = await supabase
      .from("automacoes")
      .select("*")
      .eq("ativo", true)
      .eq("gatilho_tipo", gatilhoTipo);

    if (!automacoes?.length) return false;

    for (const aut of automacoes) {
      const dispara = avaliarGatilho(aut, texto, gatilhoContexto);
      if (!dispara) continue;

      // Verifica se já há execução em andamento para este contato nesta automação
      const { data: execExistente } = await supabase
        .from("automacao_execucoes")
        .select("*")
        .eq("automacao_id", aut.id)
        .eq("telefone", telefone)
        .eq("status", "em_andamento")
        .maybeSingle();

      if (execExistente) continue; // já está em execução

      // Inicia nova execução
      const nos: any[] = aut.nos ?? [];
      if (!nos.length) continue;

      const { data: execucao } = await supabase
        .from("automacao_execucoes")
        .insert({
          automacao_id: aut.id,
          conversa_id: conversa.id,
          telefone,
          no_atual_id: nos[0].id,
          status: "em_andamento",
          dados: {},
        })
        .select()
        .single();

      if (!execucao) continue;

      // Executa o primeiro nó
      await executarNo(nos[0], nos, execucao, telefone, conversa, historico);

      // Incrementa contador
      await supabase
        .from("automacoes")
        .update({ execucoes_total: (aut.execucoes_total ?? 0) + 1 })
        .eq("id", aut.id);

      return true; // uma automação disparou
    }
  } catch (e: any) {
    console.error("Erro nas automações:", e.message);
  }
  return false;
}

function avaliarGatilho(automacao: any, texto: string, ctx: any): boolean {
  const val = automacao.gatilho_valor ?? {};

  switch (automacao.gatilho_tipo) {
    case "keyword": {
      const palavras: string[] = val.palavras ?? [];
      const textoLower = texto.toLowerCase();
      if (val.modo === "all") return palavras.every((p) => textoLower.includes(p.toLowerCase()));
      return palavras.some((p) => textoLower.includes(p.toLowerCase()));
    }
    case "primeira_msg":
      return ctx.primeiraMsg === true;
    case "pedido_criado":
      return ctx.pedidoCriado === true;
    case "status_pedido":
      return ctx.novoStatus === val.status;
    case "tag":
      return ctx.tagAdicionada === val.tag;
    case "sem_resposta":
      return ctx.horasSemResposta >= (val.horas ?? 2);
    default:
      return false;
  }
}

async function executarNo(
  no: any,
  todos_nos: any[],
  execucao: any,
  telefone: string,
  conversa: any,
  historico: any[],
) {
  switch (no.tipo) {
    case "mensagem": {
      const msg = no.config.texto ?? "";
      if (msg) await sendWhatsAppMessage(telefone, msg);
      await avancarExecucao(no, todos_nos, execucao, telefone, conversa, historico, true);
      break;
    }

    case "menu": {
      const opcoes: string[] = no.config.opcoes ?? [];
      if (opcoes.length > 0) {
        const rows = opcoes.slice(0, 10).map((op: string, i: number) => ({
          id: `auto_${execucao.id}_${i}`,
          title: op.slice(0, 24),
        }));
        await sendWhatsAppList(
          telefone,
          no.config.titulo ?? "Menu",
          no.config.corpo ?? "Escolha uma opção:",
          "Ver opções",
          [{ title: "Opções", rows }],
        );
      }
      // Se o nó pede para aguardar a resposta do cliente, pausa a execução aqui.
      // A próxima mensagem do cliente retoma o fluxo (ver retomarPorResposta).
      // Nós antigos sem esse flag mantêm o comportamento anterior (avançam direto).
      if (no.config.aguardar_resposta) {
        await supabase
          .from("automacao_execucoes")
          .update({ aguardando_resposta: true, no_atual_id: no.id })
          .eq("id", execucao.id);
        break;
      }
      await avancarExecucao(no, todos_nos, execucao, telefone, conversa, historico, true);
      break;
    }

    case "aguardar": {
      const valor = no.config.valor ?? 1;
      const unidade = no.config.unidade ?? "horas";
      const ms =
        unidade === "minutos"
          ? valor * 60_000
          : unidade === "horas"
            ? valor * 3_600_000
            : valor * 86_400_000;
      const aguardandoAte = new Date(Date.now() + ms).toISOString();
      await supabase
        .from("automacao_execucoes")
        .update({ aguardando_ate: aguardandoAte, no_atual_id: no.id })
        .eq("id", execucao.id);
      // A retomada acontece no próximo processamento
      break;
    }

    case "condicao": {
      const campo = no.config.campo ?? "mensagem";
      const valor = (no.config.valor ?? "").toLowerCase();
      let condicaoVerdadeira = false;

      if (campo === "mensagem") {
        const ultimaMsg = (historico.at(-1)?.content ?? "").toLowerCase();
        condicaoVerdadeira = ultimaMsg.includes(valor);
      } else if (campo === "tag") {
        const { data: tag } = await supabase
          .from("contato_tags")
          .select("id")
          .eq("telefone", telefone)
          .eq("tag", valor)
          .maybeSingle();
        condicaoVerdadeira = !!tag;
      }

      const proximoId = condicaoVerdadeira ? no.proximo_sim_id : no.proximo_nao_id;
      const proximoNo = todos_nos.find((n: any) => n.id === proximoId);
      if (proximoNo) {
        await executarNo(proximoNo, todos_nos, execucao, telefone, conversa, historico);
      } else {
        await concluirExecucao(execucao);
      }
      break;
    }

    case "tag": {
      const tag = no.config.tag ?? "";
      if (tag) {
        await supabase
          .from("contato_tags")
          .upsert({ telefone, tag }, { onConflict: "telefone,tag" });
      }
      await avancarExecucao(no, todos_nos, execucao, telefone, conversa, historico, true);
      break;
    }

    case "transferir": {
      await supabase.from("whatsapp_conversas").update({ modo: "humano" }).eq("id", conversa.id);
      await registrarEvento("escalacao_humano", telefone, conversa.id, {
        origem: "automacao",
        automacao_id: execucao?.automacao_id ?? null,
      });
      await concluirExecucao(execucao);
      break;
    }

    case "encerrar": {
      if (no.config.mensagem_final) {
        await sendWhatsAppMessage(telefone, no.config.mensagem_final);
      }
      await concluirExecucao(execucao);
      break;
    }
  }
}

async function avancarExecucao(
  no: any,
  todos_nos: any[],
  execucao: any,
  telefone: string,
  conversa: any,
  historico: any[],
  _avancou: boolean,
) {
  const proximoId = no.proximo_id;
  const proximoNo = todos_nos.find((n: any) => n.id === proximoId);

  if (proximoNo) {
    await supabase
      .from("automacao_execucoes")
      .update({ no_atual_id: proximoNo.id })
      .eq("id", execucao.id);
    // Executa próximo nó imediatamente (exceto aguardar)
    if (proximoNo.tipo !== "aguardar") {
      await executarNo(proximoNo, todos_nos, execucao, telefone, conversa, historico);
    }
  } else {
    await concluirExecucao(execucao);
  }
}

async function concluirExecucao(execucao: any) {
  await supabase
    .from("automacao_execucoes")
    .update({ status: "concluida", updated_at: new Date().toISOString() })
    .eq("id", execucao.id);
}

// Retoma uma automação que estava pausada num nó de menu aguardando a resposta
// do cliente. Retorna true se retomou (e portanto a IA não deve processar a
// mensagem), false se não havia execução aguardando resposta.
async function retomarPorResposta(
  telefone: string,
  texto: string,
  conversa: any,
  historico: any[],
): Promise<boolean> {
  try {
    const { data: execucao } = await supabase
      .from("automacao_execucoes")
      .select("*")
      .eq("telefone", telefone)
      .eq("status", "em_andamento")
      .eq("aguardando_resposta", true)
      .maybeSingle();

    if (!execucao) return false;

    const { data: automacao } = await supabase
      .from("automacoes")
      .select("id, ativo, nos")
      .eq("id", execucao.automacao_id)
      .maybeSingle();

    // Automação removida/desativada: encerra a execução pendente.
    if (!automacao || automacao.ativo === false) {
      await concluirExecucao(execucao);
      return false;
    }

    const nos: any[] = automacao.nos ?? [];
    const noAtual = nos.find((n: any) => n.id === execucao.no_atual_id);
    if (!noAtual) {
      await concluirExecucao(execucao);
      return false;
    }

    // Guarda a resposta do cliente e limpa o flag de espera.
    const dados = { ...(execucao.dados ?? {}), ultima_resposta: texto };
    await supabase
      .from("automacao_execucoes")
      .update({ aguardando_resposta: false, dados })
      .eq("id", execucao.id);

    const execAtualizada = { ...execucao, dados, aguardando_resposta: false };

    // Avança a partir do nó de menu. A condição seguinte (se houver) usa a
    // última mensagem do histórico, que já contém a resposta do cliente.
    await avancarExecucao(noAtual, nos, execAtualizada, telefone, conversa, historico, true);
    return true;
  } catch (e: any) {
    console.error("retomarPorResposta erro:", e?.message ?? e);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MODO TREINO — processa mensagens do admin como instruções para a IA
// ─────────────────────────────────────────────────────────────────────────────

async function processarModoTreino(
  telefone: string,
  texto: string,
  conversa: any,
  historico: any[],
  config: any,
) {
  const textoLower = texto.trim().toLowerCase();

  // Comando #sair — desativa o modo treino
  if (textoLower === "#sair") {
    await supabase.from("agente_config").update({ modo_treino: false }).eq("id", config.id);
    await sendWhatsAppMessage(
      telefone,
      "✅ Modo treino *desativado*!\n\nA Saborosa voltará a responder normalmente a todos os clientes. 🍱",
    );
    return;
  }

  // Comando #ver — lista os últimos módulos salvos
  if (textoLower === "#ver") {
    const { data: modulos } = await supabase
      .from("agente_modulos")
      .select("nome, categoria, ativo, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!modulos?.length) {
      await sendWhatsAppMessage(telefone, "Nenhum módulo salvo ainda.");
      return;
    }

    const lista = modulos
      .map((m: any, i: number) => `${i + 1}. *${m.nome}* [${m.categoria}] ${m.ativo ? "✅" : "❌"}`)
      .join("\n");

    await sendWhatsAppMessage(
      telefone,
      `📚 *Últimos módulos:*\n\n${lista}\n\n_Use #testar para simular uma conversa de cliente._`,
    );
    return;
  }

  // Comando #testar — entra em modo simulação (a IA responde como cliente)
  if (textoLower === "#testar") {
    await supabase
      .from("whatsapp_conversas")
      .update({ mensagens: [] }) // limpa histórico para simular novo cliente
      .eq("id", conversa.id);
    await sendWhatsAppMessage(
      telefone,
      "🧪 *Modo simulação ativado!*\n\nAgora vou responder como se fosse um cliente. Mande uma mensagem para testar.\n\n_Envie #sair para encerrar o treino._",
    );
    return;
  }

  // Mensagem normal no modo treino → interpreta como nova instrução
  // Usa GPT para categorizar e nomear o módulo automaticamente
  const promptCategorizar = `Você é um assistente que ajuda a organizar instruções de treinamento para um chatbot de delivery de marmitas.

O administrador enviou esta instrução:
"${texto}"

Responda em JSON com:
{
  "nome": "título curto e descritivo (máximo 50 chars)",
  "categoria": "identidade" | "cardapio" | "pedidos" | "entregas" | "comportamento",
  "conteudo": "a instrução formatada de forma clara e direta para a IA seguir"
}

Responda APENAS o JSON, sem explicações.`;

  let modulo = { nome: "Instrução de treino", categoria: "comportamento", conteudo: texto };
  let raw = "";

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: promptCategorizar }],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });
    const json = await resp.json();
    raw = json.choices?.[0]?.message?.content ?? "";

    // Tenta extrair JSON de dentro de markdown code blocks
    let jsonStr = raw.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);
    if (parsed.nome && parsed.categoria && parsed.conteudo) {
      modulo = parsed;
    } else {
      console.warn("Resposta do GPT incompleta:", parsed);
    }
  } catch (e: any) {
    console.error("Erro ao categorizar instrução:", e.message, "Raw response:", raw);
  }

  // Busca a maior ordem atual
  const { data: maxOrdem } = await supabase
    .from("agente_modulos")
    .select("ordem")
    .order("ordem", { ascending: false })
    .limit(1);
  const novaOrdem = ((maxOrdem?.[0] as any)?.ordem ?? 0) + 1;

  // Salva o módulo
  const { error } = await supabase.from("agente_modulos").insert({
    nome: modulo.nome,
    categoria: modulo.categoria,
    conteudo: modulo.conteudo,
    ativo: true,
    ordem: novaOrdem,
  });

  if (error) {
    console.error("Erro ao salvar módulo - Detalhes:", error);
    await sendWhatsAppMessage(
      telefone,
      `❌ Erro ao salvar instrução: ${error.message}\n\nDados tentados: Nome="${modulo.nome}", Categoria="${modulo.categoria}"`,
    );
    return;
  }

  await appendMensagem(conversa.id, historico, { role: "user", content: texto });
  await sendWhatsAppMessage(
    telefone,
    `✅ *Instrução salva!*\n\n📌 *${modulo.nome}*\n🏷️ Categoria: ${modulo.categoria}\n\n_A Saborosa já vai usar essa instrução nas próximas conversas._\n\nEnvie mais instruções, *#ver* para listar, *#testar* para simular ou *#sair* para encerrar.`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler principal
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // ── Verificação do webhook (GET) ─────────────────────────────────────────
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ── Recebe mensagens (POST) ──────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      // Parse do corpo dentro do try: um body inválido não deve derrubar a
      // função com 500 (o WhatsApp reenviaria o webhook). Respondemos 200.
      const body = await req.json().catch(() => null);
      if (!body) return new Response("OK", { status: 200 });

      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages?.length) return new Response("OK", { status: 200 });

      const msg = messages[0];
      const telefone = msg.from;
      const nomeContato = value?.contacts?.[0]?.profile?.name;

      await sendTypingIndicator(telefone, msg.id);

      // Captura ID da opção selecionada (lista interativa ou botão)
      const menuId =
        msg.interactive?.list_reply?.id ??
        msg.interactive?.button_reply?.id ??
        identificarOpcaoMenu(msg.text?.body ?? "");

      // Suporte a texto, botão interativo e lista interativa
      const texto =
        msg.text?.body ??
        msg.interactive?.button_reply?.title ??
        msg.interactive?.list_reply?.title ??
        "";

      // Mídia não suportada (áudio, imagem, figurinha, localização, contato...):
      // não deixa o cliente no vácuo. Responde pedindo para escrever — a menos
      // que a conversa esteja em atendimento humano (aí um atendente cuida).
      if (!texto && !menuId) {
        const tiposMidia = ["audio", "voice", "image", "video", "sticker", "document", "location", "contacts"];
        if (msg.type && tiposMidia.includes(msg.type)) {
          const conversaMidia = await getOrCreateConversa(telefone, nomeContato);
          if (conversaMidia?.modo !== "humano") {
            const aviso =
              msg.type === "audio" || msg.type === "voice"
                ? "Oi! 😊 Ainda não consigo ouvir áudios por aqui. Pode me escrever sua mensagem que eu te ajudo rapidinho? 🫶🏼"
                : "Oi! 😊 Recebi seu arquivo, mas por aqui eu consigo te ajudar melhor por texto. Pode me escrever o que você precisa? 🫶🏼";
            await sendWhatsAppMessage(telefone, aviso);
          }
        }
        return new Response("OK", { status: 200 });
      }

      // ── Busca/cria conversa ──────────────────────────────────────────────
      const conversa = await getOrCreateConversa(telefone, nomeContato);
      let historico: any[] = conversa?.mensagens ?? [];
      const pedidoEmAndamento = conversa?.pedido_em_andamento ?? null;
      const primeiraMsg = conversaComecouNovamente(conversa, historico);
      const nomeConhecido = nomeContato ?? conversa?.nome ?? null;

      // ── Modo humano: só salva, não responde ──────────────────────────────
      if (conversa?.modo === "humano") {
        // Retorno automático ao bot: se o atendimento humano ficou inativo por
        // muito tempo, o bot reassume para não deixar o cliente sem resposta.
        const ultimaAtividade = conversa?.ultima_msg
          ? new Date(conversa.ultima_msg).getTime()
          : 0;
        const handoffExpirou =
          ultimaAtividade > 0 && Date.now() - ultimaAtividade > HANDOFF_TIMEOUT_MS;

        if (handoffExpirou) {
          await supabase
            .from("whatsapp_conversas")
            .update({ modo: "bot" })
            .eq("id", conversa.id);
          conversa.modo = "bot";
          await registrarEvento("retorno_bot", telefone, conversa.id, {
            motivo: "timeout_handoff",
          });
          // Segue o fluxo normal abaixo (o bot volta a responder).
        } else {
          // Atendimento humano ativo: só registra a mensagem, não responde.
          await appendMensagem(conversa.id, historico, {
            role: "user",
            content: texto || menuId || "",
          });
          return new Response("OK", { status: 200 });
        }
      }

      // ── Busca config do agente ───────────────────────────────────────────
      const { data: config } = await supabase
        .from("agente_config")
        .select("*")
        .eq("ativo", true)
        .maybeSingle();

      if (!config) {
        await sendWhatsAppMessage(
          telefone,
          "Olá! 😊 Nosso assistente está temporariamente indisponível. Entre em contato pelo WhatsApp normalmente.",
        );
        return new Response("OK", { status: 200 });
      }

      // ── MODO TREINO: processa mensagens do treinador como instruções ──────
      if (config.modo_treino && config.treinador_telefone) {
        // Usa telefonesBatem (mesma comparação robusta do reconhecimento de
        // cliente) em vez de endsWith solto, que poderia dar falso-positivo.
        if (telefonesBatem(telefone, String(config.treinador_telefone))) {
          await processarModoTreino(telefone, texto || menuId || "", conversa, historico, config);
          return new Response("OK", { status: 200 });
        }
      }

      // ── Retoma automação pausada aguardando resposta do cliente ───────────
      // Se um nó de menu ficou esperando a resposta, a mensagem atual retoma o
      // fluxo (e não deve ser processada pela IA nem reiniciar outra automação).
      {
        const respostaCliente = texto || menuId || "";
        // Passa um histórico com a resposta em memória (sem persistir ainda) para
        // que a condição por "mensagem" enxergue a resposta do cliente.
        const historicoComResposta = [
          ...historico,
          { role: "user", content: respostaCliente },
        ];
        const retomou = await retomarPorResposta(
          telefone,
          respostaCliente,
          conversa,
          historicoComResposta,
        );
        if (retomou) {
          // Só agora persiste a mensagem do cliente (a retomada assumiu o turno).
          await appendMensagem(conversa.id, historico, {
            role: "user",
            content: respostaCliente,
          });
          return new Response("OK", { status: 200 });
        }
        // Não retomou: não persistimos nada aqui; os fluxos seguintes (keyword/IA)
        // cuidam de gravar a mensagem do usuário normalmente.
      }

      // ── Verifica automações de keyword ───────────────────────────────────
      if (texto && !menuId) {
        const autoDisparou = await verificarEExecutarAutomacoes(
          telefone,
          texto,
          conversa,
          historico,
          "keyword",
          {},
        );
        // Se uma automação de keyword disparou, ela já enviou a própria resposta.
        // Encerramos aqui para não gerar resposta duplicada da IA.
        if (autoDisparou) {
          await appendMensagem(conversa.id, historico, { role: "user", content: texto });
          return new Response("OK", { status: 200 });
        }
      }

      // ── Busca cliente por telefone — ANTES do switch do menu ─────────────
      const clienteResult = await buscarClientePorTelefone(telefone);
      const pediuMenu = solicitouMenuPrincipal(texto);

      // Verifica automações de primeira mensagem.
      // Só reenviamos o menu automaticamente quando NÃO houver um clique de menu
      // pendente — caso contrário o clique do cliente seria perdido e o switch
      // abaixo não seria executado.
      if ((primeiraMsg || pediuMenu) && !menuId) {
        if (primeiraMsg) {
          await verificarEExecutarAutomacoes(telefone, texto, conversa, historico, "primeira_msg", {
            primeiraMsg: true,
          });
        }
        const nomeCliente = clienteResult?.profile?.nome ?? nomeConhecido;
        await sendMenuPrincipal(telefone, nomeCliente);
        await appendMensagem(conversa.id, historico, {
          role: "assistant",
          content: "[Menu principal enviado]",
        });
        return new Response("OK", { status: 200 });
      }

      // ── Intercepta seleções do menu principal (sem precisar da OpenAI) ──
      if (menuId) {
        const nomeCliente = clienteResult?.profile?.nome ?? nomeContato ?? null;
        const primeiroNome = nomeCliente?.split(" ")[0];

        switch (menuId) {
          case "menu_atendente": {
            // Transfere para humano
            await supabase
              .from("whatsapp_conversas")
              .update({ modo: "humano" })
              .eq("id", conversa.id);
            await registrarEvento("escalacao_humano", telefone, conversa.id, {
              origem: "menu_atendente",
            });
            const msg = primeiroNome
              ? `Tudo bem, ${primeiroNome}! 😊 Vou te conectar com nossa equipe agora. Um momento!`
              : "Tudo bem! 😊 Vou te conectar com nossa equipe agora. Um momento!";
            await sendWhatsAppMessage(telefone, msg);
            await appendMensagem(conversa.id, historico, { role: "assistant", content: msg });
            return new Response("OK", { status: 200 });
          }
          case "menu_site": {
            await sendWhatsAppButtons(
              telefone,
              `🌐 Acesse nosso site para ver o cardápio completo, fazer pedidos e acompanhar entregas:\n\n${SITE_URL}`,
              [
                { id: "btn_cardapio", title: "🍽️ Ver cardápio" },
                { id: "btn_pedido", title: "🛒 Fazer pedido" },
              ],
            );
            await appendMensagem(conversa.id, historico, {
              role: "assistant",
              content: "[Site enviado]",
            });
            await sendMenuInterativo(telefone);
            return new Response("OK", { status: 200 });
          }
          case "menu_cardapio":
          case "btn_cardapio": {
            await appendMensagem(conversa.id, historico, {
              role: "user",
              content: "Quero ver o cardápio completo",
            });
            const cardapioEnviado = await enviarCardapioPrincipal(telefone);
            if (cardapioEnviado) {
              await appendMensagem(conversa.id, historico, {
                role: "assistant",
                content: "[Cardápio enviado]",
              });
              await sendMenuInterativo(telefone);
              return new Response("OK", { status: 200 });
            }
            break;
          }
          case "menu_pedido":
          case "btn_pedido": {
            await appendMensagem(conversa.id, historico, {
              role: "user",
              content: "Quero fazer um pedido",
            });
            break;
          }
          case "menu_recomenda": {
            await appendMensagem(conversa.id, historico, {
              role: "user",
              content: "Me dê uma recomendação de prato",
            });
            break;
          }
          case "menu_duvidas": {
            await sendWhatsAppList(
              telefone,
              "❓ Dúvidas Frequentes",
              "Escolha o assunto da sua dúvida 👇",
              "Ver assuntos",
              [
                {
                  title: "Sobre nós",
                  rows: [
                    {
                      id: "duvida_entrega",
                      title: "🚚 Entrega e frete",
                      description: "Cidades, taxas e prazos",
                    },
                    {
                      id: "duvida_pagamento",
                      title: "💳 Formas de pagamento",
                      description: "Pix, cartão, alimentação...",
                    },
                    {
                      id: "duvida_preparo",
                      title: "🍲 Como preparar",
                      description: "Tempo e modo de preparo",
                    },
                    {
                      id: "duvida_validade",
                      title: "❄️ Validade e armazenamento",
                      description: "Quanto tempo dura",
                    },
                    {
                      id: "duvida_minimo",
                      title: "📦 Pedido mínimo",
                      description: "Quantidade mínima",
                    },
                  ],
                },
              ],
            );
            await appendMensagem(conversa.id, historico, {
              role: "assistant",
              content: "[Menu dúvidas enviado]",
            });
            await sendMenuInterativo(telefone);
            return new Response("OK", { status: 200 });
          }
          case "duvida_entrega": {
            await appendMensagem(conversa.id, historico, {
              role: "user",
              content: "Como funciona a entrega e qual o frete?",
            });
            break;
          }
          case "duvida_pagamento": {
            await appendMensagem(conversa.id, historico, {
              role: "user",
              content: "Quais as formas de pagamento aceitas?",
            });
            break;
          }
          case "duvida_preparo": {
            await appendMensagem(conversa.id, historico, {
              role: "user",
              content: "Como preparo as marmitas congeladas?",
            });
            break;
          }
          case "duvida_validade": {
            await appendMensagem(conversa.id, historico, {
              role: "user",
              content: "Qual a validade e como armazenar as marmitas?",
            });
            break;
          }
          case "duvida_minimo": {
            await appendMensagem(conversa.id, historico, {
              role: "user",
              content: "Tem pedido mínimo?",
            });
            break;
          }
          default: {
            // Opção não reconhecida — trata como texto normal
            await appendMensagem(conversa.id, historico, {
              role: "user",
              content: texto || menuId,
            });
            break;
          }
        }
        // Recarga historico após append
        const { data: conversaAtualizada } = await supabase
          .from("whatsapp_conversas")
          .select("mensagens")
          .eq("id", conversa.id)
          .single();
        historico = conversaAtualizada?.mensagens ?? historico;
      }

      // ── Busca contexto dinâmico em paralelo ──────────────────────────────
      const [
        { texto: cardapioContexto, produtos },
        entregasContexto,
        settingsContexto,
        { texto: arquivosContexto },
        modulosPrompt,
      ] = await Promise.all([
        getProdutosContexto(),
        getEntregasContexto(),
        getSiteSettings(),
        getArquivosContexto(),
        getModulosPrompt(),
      ]);

      // Contexto do cliente reconhecido (se encontrado)
      const clienteCtx = clienteResult.encontrado
        ? clienteResult.contexto
        : `\n\nCLIENTE NÃO CADASTRADO: telefone ${telefone}${nomeContato ? `, nome do WhatsApp: ${nomeContato}` : ""}.
Se for a primeira mensagem, cumprimente e atenda normalmente.
Se o cliente disser o CPF, use a função buscar_cliente_cpf para verificar o cadastro.`;

      // Instrução de saudação na primeira mensagem
      const saudacaoCtx = primeiraMsg
        ? clienteResult.encontrado
          ? `\n\nINSTRUÇÃO ESPECIAL — PRIMEIRA MENSAGEM: Use a função enviar_menu para mostrar as opções. Antes do menu, mande uma mensagem calorosa chamando pelo nome: "Oii, ${clienteResult.profile?.nome?.split(" ")[0] ?? ""}! Que bom ter você aqui 🫶🏼"`
          : `\n\nINSTRUÇÃO ESPECIAL — PRIMEIRA MENSAGEM: Use a função enviar_menu para mostrar as opções ao cliente. Antes do menu, mande uma saudação calorosa curta.`
        : "";

      // ── Monta system prompt completo ─────────────────────────────────────
      // Usa módulos do banco se existirem, senão cai no system_prompt da agente_config
      const basePrompt = modulosPrompt || config.system_prompt;

      const systemPrompt = `${basePrompt}
${cardapioContexto}
${entregasContexto}
${settingsContexto}
${arquivosContexto}
${clienteCtx}
${saudacaoCtx}

REGRAS OPERACIONAIS FIXAS (sempre aplicar, independente dos módulos):

1. NUNCA invente preços — consulte o CARDÁPIO COMPLETO acima antes de informar qualquer valor.
2. NUNCA confirme entrega em bairro/cidade fora da lista ÁREAS DE ENTREGA.
3. Para enviar arquivos: use a função enviar_arquivo com a URL exata da lista ARQUIVOS DISPONÍVEIS.
4. Para buscar cliente por CPF: use a função buscar_cliente_cpf quando o cliente informar o CPF.
5. Site para pedidos online: ${SITE_URL}
6. Quando o cliente perguntar sobre o andamento/status de um pedido ("cadê meu pedido?", "já saiu?"), use a função consultar_pedido. Se ele informar o protocolo/número, repasse; senão a função busca o pedido mais recente do número dele.

PREÇOS E DESCONTO PROGRESSIVO (aplicar SEMPRE que informar valores):
- Ao informar o valor de uma marmita, apresente como "a partir de R$ X,XX", porque o preço final cai conforme a quantidade (desconto progressivo).
- Explique de forma curta e simpática o desconto progressivo nas MARMITAS:
  • 5 ou mais marmitas: 3% de desconto
  • 10 ou mais marmitas: 5% de desconto
  • 20 ou mais marmitas: 7% de desconto
- A quantidade que define a faixa é o TOTAL de itens do pedido. Sopas e complementos CONTAM nessa quantidade, mas eles NÃO recebem desconto (o desconto incide só sobre as marmitas).
- Não prometa um valor final fechado com desconto sem saber a quantidade. Se o cliente ainda não disse quantas, diga o "a partir de" e convide a montar o combo: "Quanto mais marmitas, maior o desconto 😉".
- Nunca invente outras porcentagens além dessas. Se o cliente pedir algo fora dessas faixas, explique as faixas reais.

FLUXO OBRIGATÓRIO PARA PEDIDOS — siga esta sequência sem pular etapas:

ETAPA 1 — IDENTIFICAR O CLIENTE (obrigatória, antes de qualquer coisa):
${
  clienteResult.encontrado
    ? `✅ Cliente JÁ identificado: ${clienteResult.profile?.nome}. Pule para ETAPA 2.`
    : `⚠️ Cliente NÃO identificado ainda. Ao iniciar um pedido, pergunte o nome completo primeiro:
   "Para começar seu pedido, qual é o seu nome completo? 😊"
   → Com o nome: busque no banco usando o número de telefone já registrado.
   → Se não encontrar pelo nome/telefone: "Não encontrei seu cadastro. Qual é o seu CPF para eu verificar?"
   → Se encontrar pelo CPF: use a função buscar_cliente_cpf e confirme: "Encontrei! ✅ Seja bem-vindo de volta, [nome]!"
   → Se não encontrar de jeito nenhum: "Tudo bem! Vou criar seu cadastro. Pode continuar 😊" — colete nome e telefone.`
}

ETAPA 2 — COLETAR ITENS (uma pergunta por vez):
- "O que você vai querer hoje? 🍱" → cliente responde com produto
- Se o produto tiver variação de peso (300g/400g): "Qual o tamanho? 300g ou 400g?"
- Confirme cada item: "Mais alguma coisa ou pode fechar?"

ETAPA 3 — ENTREGA OU RETIRADA:
- "Vai ser entrega ou retirada na loja?"
- Se entrega: "Qual a cidade e bairro?" → verifique na lista ÁREAS DE ENTREGA e informe a taxa.
- Se entrega em São Bento do Sul e o pedido tiver 5 ou mais unidades (somando as quantidades de todos os itens): informe "Boa notícia! Como seu pedido tem 5 itens ou mais, o frete para São Bento do Sul fica só R$ 5,00! 🎉" e use taxaEntrega = 5.00.
- Se entrega: pergunte rua e número.
- HORÁRIO DE ENTREGA: entregamos no horário que o cliente preferir, das 9h30 às 19h. Pergunte de forma natural: "Que horário fica melhor pra você receber? Entregamos das 9h30 às 19h 😊". Se o cliente pedir um horário fora dessa janela, explique gentilmente que só entregamos entre 9h30 e 19h e ofereça um horário dentro dela. Nunca prometa um horário exato de chegada — combine a janela/preferência e diga que a equipe confirma. Inclua o horário combinado no campo observacoes ao criar o pedido (ex: "Entrega preferida: 14h").

ETAPA 4 — FORMA DE PAGAMENTO:
- "Como vai preferir pagar?" → liste as opções disponíveis.
- Se dinheiro: "Precisa de troco? Para quanto?"

ETAPA 5 — RESUMO E CONFIRMAÇÃO (obrigatório antes de criar o pedido):
Mostre o resumo COMPLETO:
"Só para confirmar tudo certinho 😊

📦 *Pedido:*
[lista de itens com preços]

[entrega/retirada e endereço]
💰 Taxa de entrega: R$ X,XX

💳 Pagamento: [forma]
💵 *Total: R$ X,XX*

Confirma o pedido? ✅"

ETAPA 6 — SÓ APÓS CONFIRMAÇÃO EXPLÍCITA ("sim", "confirma", "pode fazer", "fecha"):
- Use a função criar_pedido.
- NUNCA crie o pedido sem o cliente confirmar.
- Se o cliente pedir qualquer alteração, volte para a etapa correspondente.

REGRA DE SEGURANÇA:
- Se qualquer dado estiver faltando ou duvidoso, pergunte antes de prosseguir.
- Prefira errar por excesso de confirmação do que criar um pedido errado.
- Se o cliente ficar confuso ou pedir para cancelar: "Sem problema! Pedido cancelado 😊 Posso te ajudar com mais alguma coisa?"`;

      // ── Adiciona mensagem do usuário ─────────────────────────────────────
      historico = await appendMensagem(conversa.id, historico, { role: "user", content: texto });

      // ── Chama OpenAI ─────────────────────────────────────────────────────
      const resultado = await chamarOpenAI(systemPrompt, historico, pedidoEmAndamento);

      // ── Processa resultado ───────────────────────────────────────────────
      if (resultado.tipo === "function") {
        // ── Criar pedido ─────────────────────────────────────────────────
        if (resultado.nome === "criar_pedido") {
          const args = resultado.args;
          args.telefone = telefone; // garante o número correto
          args.itens = Array.isArray(args.itens) ? args.itens : [];

          // Guard: nunca cria pedido sem itens (evita pedido fantasma de R$ 0).
          if (args.itens.length === 0) {
            const msg =
              "Ops, não consegui identificar os itens do seu pedido 😅 Pode me dizer o que você vai querer?";
            await sendWhatsAppMessage(telefone, msg);
            await appendMensagem(conversa.id, historico, { role: "assistant", content: msg });
            return new Response("OK", { status: 200 });
          }

          // ── Validação de entrega (servidor) ──────────────────────────────
          // Só confia no modelo para itens; endereço e taxa são validados aqui.
          if (args.metodoEntrega === "entrega") {
            // 1) Endereço obrigatório: cidade, bairro e rua/número.
            if (!args.cidade || !args.bairro || !args.endereco) {
              const msg =
                "Para entrega eu preciso do endereço completo 😊 Me confirma a *cidade*, o *bairro* e a *rua com número*?";
              await sendWhatsAppMessage(telefone, msg);
              await appendMensagem(conversa.id, historico, { role: "assistant", content: msg });
              return new Response("OK", { status: 200 });
            }

            // 2) Área atendida? Valida cidade/bairro contra delivery_rates e usa
            //    a taxa CADASTRADA (não a que o modelo informou).
            const taxaCadastrada = await buscarTaxaEntrega(args.cidade, args.bairro);
            if (taxaCadastrada === null) {
              const msg = `Poxa, ainda não entregamos em *${args.bairro}, ${args.cidade}* 😕 Posso registrar como *retirada na loja* ou você prefere outro endereço dentro da nossa área de entrega?`;
              await sendWhatsAppMessage(telefone, msg);
              await appendMensagem(conversa.id, historico, { role: "assistant", content: msg });
              await registrarEvento("area_nao_atendida", telefone, conversa.id, {
                cidade: args.cidade,
                bairro: args.bairro,
              });
              return new Response("OK", { status: 200 });
            }
            args.taxaEntrega = taxaCadastrada;
          } else {
            // Retirada não tem taxa de entrega.
            args.taxaEntrega = 0;
          }

          // Preço real: corrige preco_unitario de cada item usando o preço do
          // banco (o modelo pode inventar valor). Casa por produto_id ou nome e
          // escolhe o preço conforme o peso (200g padrão, 300g, 400g).
          // Fallback: mantém o valor do modelo se o produto não for encontrado.
          for (const item of args.itens) {
            const prod = produtos.find(
              (p: any) =>
                (item.produto_id && p.id === item.produto_id) ||
                (item.nome && normalizarTexto(p.nome) === normalizarTexto(item.nome)),
            );
            if (!prod) continue;

            const peso = normalizarTexto(item.peso);
            let precoReal = Number(prod.preco) || 0;
            if (peso.includes("300") && prod.preco_300g) precoReal = Number(prod.preco_300g);
            else if (peso.includes("400") && prod.preco_400g) precoReal = Number(prod.preco_400g);

            if (precoReal > 0) item.preco_unitario = precoReal;
          }

          // Calcula valor total real no servidor (ignora o total que o modelo mandou)
          const subtotal = args.itens.reduce(
            (acc: number, item: any) =>
              acc + (Number(item.preco_unitario) || 0) * (Number(item.quantidade) || 0),
            0,
          );
          args.valorTotal = subtotal;

          // Regra determinística do frete promocional de São Bento do Sul:
          // entrega + cidade São Bento do Sul + 5 ou mais unidades no total → R$ 5,00.
          const totalUnidades = args.itens.reduce(
            (acc: number, item: any) => acc + (Number(item.quantidade) || 0),
            0,
          );
          const cidadeNorm = String(args.cidade ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim();
          const ehSaoBento = cidadeNorm.includes("sao bento");
          if (args.metodoEntrega === "entrega" && ehSaoBento && totalUnidades >= 5) {
            args.taxaEntrega = 5.0;
          }

          // Desconto progressivo determinístico: incide só sobre marmitas.
          // A faixa é definida pelo total de unidades (sopas/complementos contam
          // na quantidade, mas não recebem desconto).
          const pctDesconto = descontoProgressivoPorQuantidade(totalUnidades);
          let descontoValor = 0;
          if (pctDesconto > 0) {
            const subtotalComDesconto = args.itens.reduce((acc: number, item: any) => {
              // Resolve a categoria do item pelo contexto de produtos (por id ou nome)
              const prod = produtos.find(
                (p: any) =>
                  (item.produto_id && p.id === item.produto_id) ||
                  (item.nome && String(p.nome).toLowerCase() === String(item.nome).toLowerCase()),
              );
              const categoria = prod?.categorias?.nome ?? "";
              const valorItem = (Number(item.preco_unitario) || 0) * (Number(item.quantidade) || 0);
              return categoriaSemDesconto(categoria) ? acc : acc + valorItem;
            }, 0);
            descontoValor = Number((subtotalComDesconto * pctDesconto).toFixed(2));
          }
          args.descontoAplicado = descontoValor;

          const pedidoId = await criarPedidoNoBanco(args);

          if (pedidoId) {
            // Cliente novo (não reconhecido em profiles): guarda o nome informado
            // na conversa para reconhecê-lo pelo nome nas próximas vezes.
            // (profiles.id tem FK para auth.users, então não criamos profile aqui.)
            if (!clienteResult.encontrado && args.nome && !conversa?.nome) {
              await supabase
                .from("whatsapp_conversas")
                .update({ nome: args.nome })
                .eq("id", conversa.id);
            }

            const protocolo = pedidoId.slice(0, 8).toUpperCase();
            const itensTexto = args.itens
              .map(
                (i: any) =>
                  `${i.quantidade}x ${i.nome}${i.peso ? ` (${i.peso})` : ""} — R$ ${(i.preco_unitario * i.quantidade).toFixed(2)}`,
              )
              .join("\n");
            const desconto = Number(args.descontoAplicado ?? 0);
            const total = (subtotal - desconto + (args.taxaEntrega ?? 0)).toFixed(2);

            const confirmacao = `✅ *Pedido confirmado!*

🔖 Protocolo: *#${protocolo}*

📦 *Itens:*
${itensTexto}

${desconto > 0 ? `🎉 Desconto progressivo: -R$ ${desconto.toFixed(2)}\n` : ""}${args.metodoEntrega === "entrega" ? `📍 Entrega em: ${args.bairro}, ${args.cidade}\n💰 Taxa de entrega: R$ ${(args.taxaEntrega ?? 0).toFixed(2)}\n` : "🏪 Retirada na loja\n"}💳 Pagamento: ${args.pagamento}
💵 *Total: R$ ${total}*

Em breve nossa equipe confirma o horário de entrega. Obrigada por escolher a SaborosaMente! 🍱❤️`;

            await sendWhatsAppMessage(telefone, confirmacao);
            await salvarPedidoEmAndamento(conversa.id, null); // limpa pedido em andamento
            await appendMensagem(conversa.id, historico, {
              role: "assistant",
              content: confirmacao,
            });
            await sendMenuInterativo(telefone);
          } else {
            const erroMsg =
              `Ops! Tive um problema técnico ao registrar seu pedido 😔\n\nPode digitar *confirmo* de novo para tentar outra vez, ou fazer o pedido pelo site: ${SITE_URL}`;
            await sendWhatsAppMessage(telefone, erroMsg);
            await appendMensagem(conversa.id, historico, { role: "assistant", content: erroMsg });
            await registrarEvento("pedido_falhou", telefone, conversa.id, {
              itens: args.itens?.length ?? 0,
              metodoEntrega: args.metodoEntrega ?? null,
              valorTotal: args.valorTotal ?? null,
            });
            await sendMenuInterativo(telefone);
          }
        }

        // ── Enviar arquivo (imagem, PDF, documento) ──────────────────────
        else if (resultado.nome === "enviar_arquivo") {
          const { url, tipo, nome, mensagem } = resultado.args;

          const legenda = removerLinksDeArquivos(mensagem ?? "Aqui está o arquivo solicitado.");

          let midiaEnviada = true;
          if (tipo === "imagem") {
            midiaEnviada = await sendWhatsAppImage(telefone, url, legenda);
          } else {
            const filename = "Cardápio Saborosamente.pdf";
            midiaEnviada = await sendWhatsAppDocument(telefone, url, filename, legenda);
          }

          await appendMensagem(conversa.id, historico, {
            role: "assistant",
            content: `[Arquivo enviado: ${nome ?? url}] ${legenda}`,
          });
          if (!midiaEnviada) {
            await sendWhatsAppMessage(
              telefone,
              "Não consegui entregar o arquivo agora. Vou tentar novamente quando você solicitar. 🙏",
            );
            return new Response("OK", { status: 200 });
          }
          await new Promise((resolve) => setTimeout(resolve, MEDIA_DELIVERY_BUFFER_MS));
          await sendMenuInterativo(telefone);
        }

        // ── Enviar menu principal ─────────────────────────────────────────
        else if (resultado.nome === "enviar_menu") {
          await sendMenuInterativo(telefone);
          await appendMensagem(conversa.id, historico, {
            role: "assistant",
            content: "[Menu principal enviado]",
          });
        }

        // ── Buscar cliente por CPF ────────────────────────────────────────
        else if (resultado.nome === "buscar_cliente_cpf") {
          const { cpf } = resultado.args;
          const cpfResult = await buscarClientePorCpf(cpf, telefone);

          let resposta: string;
          if (cpfResult.encontrado) {
            const nomeCliente = cpfResult.profile?.nome?.split(" ")[0] ?? "cliente";
            resposta = `Ótimo! Encontrei seu cadastro 😊 Seja bem-vindo de volta, *${nomeCliente}*! Já vinculamos seu número para as próximas vezes. Posso te ajudar?`;
            await appendMensagem(conversa.id, historico, {
              role: "system",
              content: cpfResult.contexto,
            });
          } else {
            resposta =
              "Não encontrei nenhum cadastro com esse CPF. Sem problema! Pode continuar normalmente que vou te ajudar 😊";
          }

          await sendWhatsAppMessage(telefone, resposta);
          await appendMensagem(conversa.id, historico, { role: "assistant", content: resposta });
          await sendMenuInterativo(telefone);
        }

        // ── Consultar cashback ────────────────────────────────────────────
        else if (resultado.nome === "consultar_cashback") {
          // Usa o cliente reconhecido; se não houver, tenta reconsultar por
          // telefone (o vínculo pode ter sido feito por CPF nesta mesma conversa).
          let profile = clienteResult.encontrado ? clienteResult.profile : null;
          if (!profile?.id) {
            const recheck = await buscarClientePorTelefone(telefone);
            if (recheck.encontrado) profile = recheck.profile;
          }
          if (!profile?.id) {
            const msg =
              "Não encontrei seu cadastro para verificar o cashback 😊 Você tem conta no nosso site? Me diga seu CPF que eu verifico!";
            await sendWhatsAppMessage(telefone, msg);
            await appendMensagem(conversa.id, historico, { role: "assistant", content: msg });
          } else {
            const { data: saldoData } = await supabase
              .from("cashback_saldo")
              .select("saldo")
              .eq("user_id", profile.id)
              .maybeSingle();
            const saldo = Number((saldoData as any)?.saldo ?? 0);
            const nome = profile.nome?.split(" ")[0] ?? "você";
            const msg =
              saldo > 0
                ? `💰 *${nome}*, seu saldo de cashback é *R$ ${saldo.toFixed(2).replace(".", ",")}*!\n\nVocê pode usá-lo como desconto no próximo pedido pelo site: ${SITE_URL} 🛒`
                : `Oi, *${nome}*! Você ainda não tem saldo de cashback 😊\n\nA cada pedido você acumula cashback para usar nas próximas compras. Que tal pedir agora? 🍱`;
            await sendWhatsAppMessage(telefone, msg);
            await appendMensagem(conversa.id, historico, { role: "assistant", content: msg });
          }
        }

        // ── Consultar status do pedido ────────────────────────────────────
        else if (resultado.nome === "consultar_pedido") {
          const protocolo = resultado.args?.protocolo as string | undefined;
          const msg = await consultarPedidoStatus(telefone, protocolo);
          await sendWhatsAppMessage(telefone, msg);
          await appendMensagem(conversa.id, historico, { role: "assistant", content: msg });
        }
      } else {
        // ── Resposta de texto normal ─────────────────────────────────────
        const resposta = resultado.conteudo;

        // Processa avaliação se cliente estiver no fluxo de avaliação
        if (conversa?.aguardando_avaliacao) {
          const notaMatch = texto.trim().match(/^[1-5]$/);
          if (notaMatch) {
            const nota = parseInt(notaMatch[0]);
            const pedidoId = conversa.aguardando_avaliacao;

            await supabase.from("avaliacoes").insert({
              pedido_id: pedidoId,
              telefone,
              nota,
              comentario: null,
            });

            await supabase
              .from("whatsapp_conversas")
              .update({ aguardando_avaliacao: null })
              .eq("id", conversa.id);

            const msgs = [
              "",
              "Ih, precisa melhorar 😔",
              "Vamos nos esforçar mais! 🙏",
              "Obrigado pelo feedback 😊",
              "Que ótimo! Ficamos felizes 😄",
              "Perfeito! Que alegria! 🎉",
            ];
            const agradecimento = `${msgs[nota]} Obrigada pela avaliação, *${nota} estrela${nota > 1 ? "s" : ""}*! ⭐\n\nSe quiser comentar algo, pode escrever agora. Se não, é só me chamar quando precisar! 🫶🏼`;
            await sendWhatsAppMessage(telefone, agradecimento);
            await appendMensagem(conversa.id, historico, {
              role: "assistant",
              content: agradecimento,
            });
          } else {
            // Resposta conversacional: NÃO reexibir o menu (evita atrito de
            // grudar o menu no meio de uma conversa fluida).
            await sendWhatsAppMessage(telefone, resposta);
            await appendMensagem(conversa.id, historico, { role: "assistant", content: resposta });
          }
        } else {
          // Resposta conversacional normal: NÃO reexibir o menu.
          await sendWhatsAppMessage(telefone, resposta);
          await appendMensagem(conversa.id, historico, { role: "assistant", content: resposta });
        }
      }
    } catch (err: any) {
      console.error("Erro no agente:", err.message ?? err);
    }

    return new Response("OK", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});

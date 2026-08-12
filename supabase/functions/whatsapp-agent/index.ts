import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "saborosamente-webhook-2026";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Envia mensagem via WhatsApp Cloud API ─────────────────────────────────────
async function sendWhatsAppMessage(to: string, text: string) {
  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    }),
  });
}

// ── Busca/cria conversa e adiciona mensagem ao histórico ──────────────────────
async function getOrCreateConversa(telefone: string, nome?: string) {
  const { data } = await supabase
    .from("whatsapp_conversas")
    .select("*")
    .eq("telefone", telefone)
    .maybeSingle();

  if (data) return data;

  const { data: nova } = await supabase
    .from("whatsapp_conversas")
    .insert({ telefone, nome: nome ?? null, mensagens: [] })
    .select()
    .single();

  return nova;
}

async function appendMensagem(id: string, mensagens: any[], novaMensagem: any) {
  const atualizado = [...mensagens, novaMensagem].slice(-20); // mantém últimas 20
  await supabase
    .from("whatsapp_conversas")
    .update({ mensagens: atualizado, ultima_msg: new Date().toISOString() })
    .eq("id", id);
  return atualizado;
}

// ── Busca produtos do banco para dar contexto à IA ────────────────────────────
async function getProdutosContexto() {
  const { data: produtos } = await supabase
    .from("produtos")
    .select("nome, preco, preco_300g, preco_400g, descricao, categorias(nome)")
    .eq("ativo", true)
    .order("nome")
    .limit(60);

  if (!produtos?.length) return "";

  const linhas = produtos.map((p: any) => {
    const cat = p.categorias?.nome ?? "";
    let precos = `R$ ${Number(p.preco).toFixed(2)}`;
    if (p.preco_300g) precos += ` | 300g: R$ ${Number(p.preco_300g).toFixed(2)}`;
    if (p.preco_400g) precos += ` | 400g: R$ ${Number(p.preco_400g).toFixed(2)}`;
    return `- ${p.nome} (${cat}) — ${precos}`;
  });

  return `\n\nCARDÁPIO ATUAL:\n${linhas.join("\n")}`;
}

// ── Chama a OpenAI ────────────────────────────────────────────────────────────
async function chamarOpenAI(systemPrompt: string, historico: any[]) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...historico,
      ],
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "Desculpe, não consegui processar sua mensagem. Tente novamente.";
}

// ── Handler principal ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Verificação do webhook (GET)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === WHATSAPP_VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // Recebe mensagens (POST)
  if (req.method === "POST") {
    const body = await req.json();

    try {
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages?.length) {
        return new Response("OK", { status: 200 });
      }

      const msg = messages[0];
      const telefone = msg.from;
      const texto = msg.text?.body ?? msg.interactive?.button_reply?.title ?? "";
      const nomeContato = value?.contacts?.[0]?.profile?.name;

      if (!texto) return new Response("OK", { status: 200 });

      // Busca configuração do agente
      const { data: config } = await supabase
        .from("agente_config")
        .select("*")
        .eq("ativo", true)
        .maybeSingle();

      if (!config) {
        await sendWhatsAppMessage(telefone, "Olá! Nosso assistente está temporariamente indisponível. Entre em contato pelo WhatsApp normalmente. 😊");
        return new Response("OK", { status: 200 });
      }

      // Busca contexto do cardápio
      const cardapioContexto = await getProdutosContexto();

      // System prompt completo
      const systemPrompt = config.system_prompt + cardapioContexto + `

INFORMAÇÕES IMPORTANTES:
- Site para pedidos: ${SUPABASE_URL.replace("https://", "").split(".")[0]} (mencione o site quando relevante)
- Para fazer pedidos: acesse saborosamente.vercel.app ou fale no WhatsApp
- Pagamento: PIX, cartão crédito/débito, alimentação (VR, Ticket, Alelo, etc.), Mercado Pago, dinheiro
- Entrega: várias cidades da região — São Bento do Sul, Rio Negrinho, Campo Alegre e outras
- Validade: 6 meses no freezer
- Preparo: até 7 minutos no micro-ondas

REGRAS DE COMPORTAMENTO:
- Seja simpático, use emojis moderadamente 🍱
- Respostas curtas e diretas (máximo 3 parágrafos)
- Se o cliente quiser fazer pedido, direcione para o site ou diga que pode receber pelo WhatsApp
- Não confirme pedidos por aqui — o sistema oficial de pedidos é o site
- Se perguntar preço, consulte o cardápio acima e responda com precisão
- Horário: encomendas 24h, entregas conforme disponibilidade`;

      // Busca/cria conversa
      const conversa = await getOrCreateConversa(telefone, nomeContato);
      let historico: any[] = conversa?.mensagens ?? [];

      // Adiciona mensagem do usuário
      historico = await appendMensagem(conversa.id, historico, {
        role: "user",
        content: texto,
      });

      // Chama a IA
      const resposta = await chamarOpenAI(systemPrompt, historico);

      // Adiciona resposta ao histórico
      await appendMensagem(conversa.id, historico, {
        role: "assistant",
        content: resposta,
      });

      // Envia resposta no WhatsApp
      await sendWhatsAppMessage(telefone, resposta);

    } catch (err) {
      console.error("Erro no agente:", err);
    }

    return new Response("OK", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});

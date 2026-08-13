import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const WHATSAPP_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "saborosamente-webhook-2026";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp Cloud API helpers
// ─────────────────────────────────────────────────────────────────────────────

async function sendWhatsAppMessage(to: string, text: string) {
  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("sendWhatsAppMessage error:", JSON.stringify(err));
  }
}

async function sendWhatsAppImage(to: string, imageUrl: string, caption?: string) {
  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "image",
      image: { link: imageUrl, ...(caption ? { caption } : {}) },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("sendWhatsAppImage error:", JSON.stringify(err));
  }
}

async function sendWhatsAppDocument(to: string, docUrl: string, filename: string, caption?: string) {
  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "document",
      document: { link: docUrl, filename, ...(caption ? { caption } : {}) },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("sendWhatsAppDocument error:", JSON.stringify(err));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversa helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getOrCreateConversa(telefone: string, nome?: string) {
  const { data } = await supabase
    .from("whatsapp_conversas")
    .select("*")
    .eq("telefone", telefone)
    .maybeSingle();

  if (data) return data;

  const { data: nova } = await supabase
    .from("whatsapp_conversas")
    .insert({ telefone, nome: nome ?? null, mensagens: [], pedido_em_andamento: null })
    .select()
    .single();

  return nova;
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

// ─────────────────────────────────────────────────────────────────────────────
// Contexto dinâmico do banco
// ─────────────────────────────────────────────────────────────────────────────

async function getProdutosContexto(): Promise<{ texto: string; produtos: any[] }> {
  const { data: produtos } = await supabase
    .from("produtos")
    .select("id, nome, preco, preco_300g, preco_400g, descricao, imagem_url, categorias(nome)")
    .eq("ativo", true)
    .order("nome")
    .limit(80);

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

  if (!taxas?.length) return "\n\nÁREAS DE ENTREGA: consulte nossa equipe para confirmar disponibilidade.";

  // Agrupa por cidade
  const porCidade: Record<string, { bairro: string; valor: number }[]> = {};
  for (const t of taxas) {
    if (!porCidade[t.cidade]) porCidade[t.cidade] = [];
    porCidade[t.cidade].push({ bairro: t.bairro, valor: Number(t.valor) });
  }

  const linhas: string[] = ["\n\nÁREAS DE ENTREGA (use SOMENTE esses bairros/cidades para confirmar entrega e informar taxa):"];
  for (const [cidade, bairros] of Object.entries(porCidade)) {
    linhas.push(`\n📍 ${cidade}:`);
    for (const b of bairros) {
      linhas.push(`  - ${b.bairro}: R$ ${b.valor.toFixed(2)}`);
    }
  }
  linhas.push("\nSe o bairro/cidade não estiver na lista, informe que não atendemos aquela região ainda.");

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
    data.payment_methods.filter((p: any) => p.enabled !== false).forEach((p: any) => pagamentos.push(p.label));
  }
  if (Array.isArray(data.meal_flags)) {
    data.meal_flags.filter((p: any) => p.enabled !== false).forEach((p: any) => pagamentos.push(p.label));
  }
  if (Array.isArray(data.card_flags)) {
    data.card_flags.filter((p: any) => p.enabled !== false).forEach((p: any) => pagamentos.push(p.label));
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

  const linhas = arquivos.map((a: any) => `- [${a.tipo.toUpperCase()}] "${a.nome}": ${a.descricao} → URL: ${a.url}`);

  return {
    texto: `\n\nARQUIVOS DISPONÍVEIS PARA ENVIAR AO CLIENTE:\n${linhas.join("\n")}\nQuando o cliente pedir algo relacionado a esses arquivos, use a função enviar_arquivo com a URL correspondente.`,
    arquivos,
  };
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
      desconto_aplicado: 0,
      status: "pendente",
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
      console.error("Erro ao criar pedido:", pedidoError.message);
      return null;
    }

    // Insere itens
    const itens = pedidoDados.itens.map((item: any) => ({
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      observacao: item.peso ? `Peso: ${item.peso}` : null,
    }));

    const { error: itensError } = await supabase
      .from("pedido_itens")
      .insert(itens);

    if (itensError) {
      console.error("Erro ao criar itens:", itensError.message);
      // Pedido criado mas sem itens — cancela
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
    description: "Cria um pedido no sistema quando o cliente confirmou todos os dados (nome, itens, endereço/retirada, pagamento). Só use quando o cliente confirmar explicitamente.",
    parameters: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome completo do cliente" },
        telefone: { type: "string", description: "Telefone do cliente (ex: 5547999999999)" },
        metodoEntrega: { type: "string", enum: ["entrega", "retirada"], description: "Método de entrega" },
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
    description: "Envia um arquivo (imagem ou PDF) ao cliente pelo WhatsApp quando ele solicitar ou quando for relevante (ex: cliente quer ver o cardápio em PDF, quer ver fotos dos pratos).",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL do arquivo a enviar (use exatamente a URL da lista de arquivos disponíveis)" },
        tipo: { type: "string", enum: ["imagem", "pdf", "documento"], description: "Tipo do arquivo" },
        nome: { type: "string", description: "Nome do arquivo (para PDFs/documentos)" },
        mensagem: { type: "string", description: "Mensagem de texto para acompanhar o arquivo" },
      },
      required: ["url", "tipo", "mensagem"],
    },
  },
    description: "Envia uma imagem do cardápio quando o cliente pede para ver o cardápio visualmente",
    parameters: {
      type: "object",
      properties: {
        mensagem: { type: "string", description: "Mensagem de texto para acompanhar a imagem" },
      },
      required: ["mensagem"],
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

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt + pedidoCtx },
        ...mensagensFiltradas,
      ],
      functions: FUNCTIONS_SCHEMA,
      function_call: "auto",
      max_tokens: 600,
      temperature: 0.65,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("OpenAI error:", JSON.stringify(data));
    return { tipo: "texto", conteudo: "Desculpe, tive um problema técnico. Tente novamente em instantes! 🙏" };
  }

  const choice = data.choices?.[0];
  const msg = choice?.message;

  if (msg?.function_call) {
    let args: any = {};
    try { args = JSON.parse(msg.function_call.arguments); } catch (_) { /* ignore */ }
    return { tipo: "function", nome: msg.function_call.name, args };
  }

  return { tipo: "texto", conteudo: msg?.content ?? "Desculpe, não consegui processar sua mensagem. Tente novamente." };
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler principal
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
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
    const body = await req.json();

    try {
      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const messages = value?.messages;

      if (!messages?.length) return new Response("OK", { status: 200 });

      const msg = messages[0];
      const telefone = msg.from;
      const nomeContato = value?.contacts?.[0]?.profile?.name;

      // Suporte a texto, botão interativo e lista interativa
      const texto =
        msg.text?.body ??
        msg.interactive?.button_reply?.title ??
        msg.interactive?.list_reply?.title ??
        "";

      if (!texto) return new Response("OK", { status: 200 });

      // ── Busca/cria conversa ──────────────────────────────────────────────
      const conversa = await getOrCreateConversa(telefone, nomeContato);
      let historico: any[] = conversa?.mensagens ?? [];
      const pedidoEmAndamento = conversa?.pedido_em_andamento ?? null;

      // ── Modo humano: só salva, não responde ──────────────────────────────
      if (conversa?.modo === "humano") {
        await appendMensagem(conversa.id, historico, { role: "user", content: texto });
        return new Response("OK", { status: 200 });
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
          "Olá! 😊 Nosso assistente está temporariamente indisponível. Entre em contato pelo WhatsApp normalmente."
        );
        return new Response("OK", { status: 200 });
      }

      // ── Busca contexto dinâmico em paralelo ──────────────────────────────
      const [{ texto: cardapioContexto, produtos }, entregasContexto, settingsContexto, { texto: arquivosContexto, arquivos }] =
        await Promise.all([getProdutosContexto(), getEntregasContexto(), getSiteSettings(), getArquivosContexto()]);

      // ── Monta system prompt completo ─────────────────────────────────────
      const systemPrompt = `${config.system_prompt}
${cardapioContexto}
${entregasContexto}
${settingsContexto}
${arquivosContexto}

REGRAS CRÍTICAS:
- NUNCA invente preços. Consulte sempre o CARDÁPIO COMPLETO acima antes de informar qualquer valor.
- NUNCA confirme entrega em bairro/cidade que não esteja na lista ÁREAS DE ENTREGA.
- Para pedidos: colete as informações passo a passo (não pergunte tudo de uma vez):
  1. O que deseja pedir (produto, quantidade, peso se aplicável)
  2. Entrega ou retirada?
  3. Se entrega: cidade, bairro, rua e número
  4. Forma de pagamento
  5. Nome completo do cliente
  6. Confirmar resumo do pedido e aguardar confirmação do cliente
  7. Só então use a função criar_pedido
- Se cliente pedir para ver o cardápio visualmente ou receber o PDF, use a função enviar_arquivo com o arquivo correto da lista de ARQUIVOS DISPONÍVEIS
- Validade das marmitas: 6 meses no freezer
- Preparo: até 7 minutos no micro-ondas
- Site para pedidos online: saborosamente.vercel.app
- Seja simpático, use emojis moderadamente 🍱
- Respostas curtas e objetivas (máximo 3 parágrafos por mensagem)
- Se o cliente ficar insatisfeito ou pedir falar com humano: informe que vai transferir para nossa equipe`;

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

          // Calcula valor total real
          const subtotal = args.itens.reduce(
            (acc: number, item: any) => acc + item.preco_unitario * item.quantidade,
            0
          );
          args.valorTotal = subtotal;

          const pedidoId = await criarPedidoNoBanco(args);

          if (pedidoId) {
            const protocolo = pedidoId.slice(0, 8).toUpperCase();
            const itensTexto = args.itens
              .map((i: any) => `${i.quantidade}x ${i.nome}${i.peso ? ` (${i.peso})` : ""} — R$ ${(i.preco_unitario * i.quantidade).toFixed(2)}`)
              .join("\n");
            const total = (subtotal + (args.taxaEntrega ?? 0)).toFixed(2);

            const confirmacao = `✅ *Pedido confirmado!*

🔖 Protocolo: *#${protocolo}*

📦 *Itens:*
${itensTexto}

${args.metodoEntrega === "entrega" ? `📍 Entrega em: ${args.bairro}, ${args.cidade}\n💰 Taxa de entrega: R$ ${(args.taxaEntrega ?? 0).toFixed(2)}\n` : "🏪 Retirada na loja\n"}💳 Pagamento: ${args.pagamento}
💵 *Total: R$ ${total}*

Em breve nossa equipe confirma o horário de entrega. Obrigada por escolher a SaborosaMente! 🍱❤️`;

            await sendWhatsAppMessage(telefone, confirmacao);
            await salvarPedidoEmAndamento(conversa.id, null); // limpa pedido em andamento
            await appendMensagem(conversa.id, historico, { role: "assistant", content: confirmacao });
          } else {
            const erroMsg = "Ops! Tive um problema ao registrar seu pedido. 😔 Pode tentar novamente ou fazer o pedido pelo site: saborosamente.vercel.app";
            await sendWhatsAppMessage(telefone, erroMsg);
            await appendMensagem(conversa.id, historico, { role: "assistant", content: erroMsg });
          }
        }

        // ── Enviar arquivo (imagem, PDF, documento) ──────────────────────
        else if (resultado.nome === "enviar_arquivo") {
          const { url, tipo, nome, mensagem } = resultado.args;

          await sendWhatsAppMessage(telefone, mensagem);

          if (tipo === "imagem") {
            await sendWhatsAppImage(telefone, url);
          } else {
            const filename = nome ?? url.split("/").pop() ?? "arquivo";
            await sendWhatsAppDocument(telefone, url, filename);
          }

          await appendMensagem(conversa.id, historico, {
            role: "assistant",
            content: `[Arquivo enviado: ${nome ?? url}] ${mensagem}`,
          });
        }

        // ── Enviar imagem do cardápio (fallback de produtos em destaque) ──
          const { mensagem } = resultado.args;

          // Busca imagens dos produtos em destaque
          const { data: destaques } = await supabase
            .from("produtos")
            .select("imagem_url, nome")
            .eq("ativo", true)
            .eq("destaque", true)
            .not("imagem_url", "is", null)
            .limit(6);

          if (destaques?.length) {
            await sendWhatsAppMessage(telefone, mensagem);
            // Envia até 3 imagens de destaque
            for (const prod of destaques.slice(0, 3)) {
              if (prod.imagem_url) {
                await sendWhatsAppImage(telefone, prod.imagem_url, prod.nome);
              }
            }
          } else {
            // Fallback: manda link do site
            const resposta = `${mensagem}\n\n🌐 Veja nosso cardápio completo em: saborosamente.vercel.app`;
            await sendWhatsAppMessage(telefone, resposta);
          }

          await appendMensagem(conversa.id, historico, {
            role: "assistant",
            content: `[Cardápio enviado] ${mensagem}`,
          });
        }

      } else {
        // ── Resposta de texto normal ─────────────────────────────────────
        const resposta = resultado.conteudo;
        await sendWhatsAppMessage(telefone, resposta);
        await appendMensagem(conversa.id, historico, { role: "assistant", content: resposta });
      }

    } catch (err: any) {
      console.error("Erro no agente:", err.message ?? err);
    }

    return new Response("OK", { status: 200 });
  }

  return new Response("Method not allowed", { status: 405 });
});

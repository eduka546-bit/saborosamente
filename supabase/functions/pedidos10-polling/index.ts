/**
 * pedidos10-polling
 *
 * Edge function que faz polling no Open Delivery do Pedidos10.
 * Fluxo: autentica → busca eventos novos → pega detalhes do pedido →
 * cria pedido no banco (origem "pedidos10") → decrementa estoque →
 * envia push → confirma processamento (ack).
 *
 * Executar via CRON a cada 1-2 minutos (Supabase pg_cron ou invocação externa).
 * Também pode ser chamado manualmente: POST /functions/v1/pedidos10-polling
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OD_BASE_URL = Deno.env.get("PEDIDOS10_OD_BASE_URL")!;
const OD_CLIENT_ID = Deno.env.get("PEDIDOS10_OD_CLIENT_ID")!;
const OD_CLIENT_SECRET = Deno.env.get("PEDIDOS10_OD_CLIENT_SECRET")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// Autenticação OAuth2 (client_credentials)
// ─────────────────────────────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  // Tenta múltiplos paths de autenticação (cada plataforma usa um diferente)
  const tokenPaths = [
    "/oauth/token",
    "/api/oauth/token",
    "/v1/oauth/token",
  ];

  for (const path of tokenPaths) {
    const url = `${OD_BASE_URL}${path}`;

    // Tenta 2 formatos: body form-encoded e Basic Auth header
    const attempts = [
      // Formato 1: credenciais no body (mais comum)
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: OD_CLIENT_ID,
          client_secret: OD_CLIENT_SECRET,
        }),
      },
      // Formato 2: Basic Auth no header (client_id:client_secret em base64)
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${btoa(`${OD_CLIENT_ID}:${OD_CLIENT_SECRET}`)}`,
        },
        body: new URLSearchParams({ grant_type: "client_credentials" }),
      },
      // Formato 3: JSON body
      {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: OD_CLIENT_ID,
          client_secret: OD_CLIENT_SECRET,
        }),
      },
    ];

    for (const attempt of attempts) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: attempt.headers,
          body: attempt.body,
        });

        if (res.status === 404) break; // path errado, tenta próximo path
        if (res.status === 401) continue; // credenciais rejeitadas nesse formato, tenta próximo formato

        if (!res.ok) {
          const err = await res.text();
          console.error(`Auth ${path} (${res.status}): ${err}`);
          continue;
        }

        const data = await res.json();
        if (data.access_token) {
          console.log(`✅ Auth OK via ${path}`);
          cachedToken = {
            token: data.access_token,
            expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
          };
          return cachedToken.token;
        }
      } catch (e: any) {
        continue;
      }
    }
  }

  throw new Error(`Auth falhou: credenciais rejeitadas. Verifique com o Pedidos10 se a integração está ativa. URL: ${OD_BASE_URL}/oauth/token`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Polling de eventos
// ─────────────────────────────────────────────────────────────────────────────

async function pollEvents(token: string): Promise<any[]> {
  const res = await fetch(`${OD_BASE_URL}/opendelivery/v1/events:polling`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 204 || res.status === 304) return []; // sem eventos novos
    const err = await res.text();
    console.error(`Polling falhou (${res.status}):`, err);
    return [];
  }

  const data = await res.json();
  // O formato varia: pode ser array direto ou { events: [...] }
  return Array.isArray(data) ? data : (data.events ?? data.orders ?? [data]).filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// Detalhes do pedido
// ─────────────────────────────────────────────────────────────────────────────

async function getOrderDetails(token: string, orderId: string): Promise<any> {
  const res = await fetch(`${OD_BASE_URL}/opendelivery/v1/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    console.error(`Detalhes do pedido ${orderId} falhou (${res.status})`);
    return null;
  }

  return await res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Acknowledgment (confirma processamento)
// ─────────────────────────────────────────────────────────────────────────────

async function acknowledgeEvents(token: string, eventIds: string[]): Promise<void> {
  if (!eventIds.length) return;

  await fetch(`${OD_BASE_URL}/opendelivery/v1/events/acknowledgment`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventIds.map((id) => ({ id }))),
  }).catch((e) => console.error("Ack falhou:", e));
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirmação de pedido no Pedidos10 (aceita o pedido)
// ─────────────────────────────────────────────────────────────────────────────

async function confirmOrder(token: string, orderId: string): Promise<void> {
  await fetch(`${OD_BASE_URL}/opendelivery/v1/orders/${orderId}/confirm`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  }).catch((e) => console.error("Confirm falhou:", e));
}

// ─────────────────────────────────────────────────────────────────────────────
// Processa um pedido: cria no banco + decrementa estoque + push
// ─────────────────────────────────────────────────────────────────────────────

async function processarPedido(order: any): Promise<boolean> {
  try {
    const orderId = order.id ?? order.orderId ?? crypto.randomUUID();

    // Verifica duplicata (pedido já processado)
    const { data: existente } = await supabase
      .from("pedidos")
      .select("id")
      .eq("observacao", `pedidos10:${orderId}`)
      .maybeSingle();
    if (existente) {
      console.log(`Pedido ${orderId} já processado, pulando.`);
      return true;
    }

    // Mapeia dados do Open Delivery pro formato do banco
    const cliente = order.customer ?? {};
    const delivery = order.delivery ?? {};
    const endereco = delivery.deliveryAddress ?? {};
    const total = order.total ?? {};
    const pagamentos = order.payments ?? {};
    const isDelivery = order.type === "DELIVERY";

    const metodoEntrega = isDelivery ? "entrega" : "retirada";
    const metodoPagamento =
      pagamentos.methods?.[0]?.method ?? pagamentos.methods?.[0]?.type ?? "Não informado";

    // Cria pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        nome_cliente: cliente.name ?? "Pedidos10",
        telefone_cliente: cliente.phone?.number ?? null,
        email_cliente: cliente.email ?? null,
        metodo_entrega: metodoEntrega,
        metodo_pagamento: metodoPagamento,
        valor_total: total.orderAmount?.value ?? 0,
        taxa_entrega: 0,
        desconto_aplicado: total.discount?.value ?? 0,
        status: "preparando",
        origem: "pedidos10",
        observacao: `pedidos10:${orderId}`,
        ...(isDelivery && endereco.street
          ? {
              endereco_rua: endereco.street,
              endereco_numero: endereco.number,
              endereco_bairro: endereco.district,
              endereco_cidade: endereco.city,
              endereco_cep: endereco.postalCode,
            }
          : {}),
      })
      .select()
      .single();

    if (pedidoError) {
      console.error("Erro ao criar pedido:", pedidoError.message);
      return false;
    }

    // Itens do pedido
    const items = order.items ?? [];
    if (items.length > 0) {
      const itensInsert = items.map((item: any) => ({
        pedido_id: pedido.id,
        produto_id: null, // vamos tentar resolver pelo EAN/externalCode
        nome_item: item.name ?? "Item",
        quantidade: item.quantity ?? 1,
        preco_unitario: item.unitPrice?.value ?? item.totalPrice?.value ?? 0,
        observacao: [
          item.specialInstructions,
          item.ean ? `EAN: ${item.ean}` : null,
          item.externalCode ? `Cod: ${item.externalCode}` : null,
          ...(item.options ?? []).map(
            (opt: any) => `+ ${opt.name}${opt.quantity > 1 ? ` x${opt.quantity}` : ""}`,
          ),
        ]
          .filter(Boolean)
          .join(" | "),
      }));

      // Tenta resolver produto_id pelo EAN ou externalCode
      for (const itemInsert of itensInsert) {
        const obs = itemInsert.observacao ?? "";
        const eanMatch = obs.match(/EAN:\s*(\d+)/);
        const codMatch = obs.match(/Cod:\s*(\S+)/);
        const busca = eanMatch?.[1] || codMatch?.[1];

        if (busca) {
          const { data: prod } = await supabase
            .from("produtos")
            .select("id")
            .eq("codigo_integracao", busca)
            .maybeSingle();
          if (prod) itemInsert.produto_id = prod.id;
        }
      }

      await supabase.from("pedido_itens").insert(itensInsert);

      // Decrementa estoque dos itens que conseguimos identificar
      for (const itemInsert of itensInsert) {
        if (itemInsert.produto_id) {
          // Default 300g (EAN dos produtos é do 300g)
          await supabase.rpc("decrementar_estoque", {
            p_produto_id: itemInsert.produto_id,
            p_qtd: itemInsert.quantidade,
            p_tamanho: "300g",
          });
        }
      }
    }

    // Push de novo pedido pros admins
    try {
      const valor = Number(total.orderAmount?.value ?? 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      const proto = String(pedido.id).slice(0, 8).toUpperCase();
      await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          apikey: SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({
          title: "🛒 Pedido Pedidos10!",
          body: `${cliente.name || "Cliente"} — ${valor} · #${proto}`,
          url: "/admin/pedidos",
          tag: `pedido-${pedido.id}`,
        }),
      });
    } catch (e) {
      console.warn("Push falhou:", e);
    }

    console.log(`✅ Pedido ${orderId} processado → ${pedido.id}`);
    return true;
  } catch (e: any) {
    console.error("Erro processarPedido:", e.message);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler principal
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Autentica
    const token = await getToken();

    // 2. Busca eventos novos
    const events = await pollEvents(token);

    if (events.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: "Sem eventos novos", count: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`📥 ${events.length} evento(s) recebido(s) do Pedidos10.`);

    // Grava log bruto (pra debug/análise)
    await supabase.from("webhook_logs").insert({
      origem: "pedidos10-opendelivery",
      metodo: "POLLING",
      payload: events,
    });

    const eventIds: string[] = [];
    let processados = 0;

    for (const event of events) {
      // Pega o ID do evento (pra ack)
      const eventId = event.id ?? event.eventId;
      if (eventId) eventIds.push(eventId);

      // Se é evento de novo pedido, processa
      const tipo = (event.type ?? event.eventType ?? event.code ?? "").toUpperCase();
      const orderId = event.orderId ?? event.orderID ?? event.id;

      if (
        tipo.includes("CREATED") ||
        tipo.includes("PLACED") ||
        tipo.includes("NEW") ||
        tipo === "ORDER" ||
        orderId
      ) {
        // Busca detalhes completos do pedido
        let order = event.order ?? event;
        if (orderId && !order.items) {
          const details = await getOrderDetails(token, orderId);
          if (details) order = details;
        }

        const ok = await processarPedido(order);
        if (ok) {
          processados++;
          // Confirma o pedido no Pedidos10 (aceita)
          if (orderId) await confirmOrder(token, orderId);
        }
      }
    }

    // 3. Confirma processamento dos eventos
    await acknowledgeEvents(token, eventIds);

    return new Response(
      JSON.stringify({ ok: true, events: events.length, processados }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (e: any) {
    console.error("pedidos10-polling error:", e.message);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
});

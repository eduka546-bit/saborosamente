import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// estoque-alerta-diario
// Envia um resumo diário de estoque baixo/urgente por WhatsApp para o admin.
// Deve ser chamada 1x/dia por um cron (ver setup_cron_estoque_alerta.sql).
// Reaproveita as MESMAS regras de limiar da tela admin/relatorios/estoque.tsx:
//   marmita 200g: ⚠️ <=4, ❌ <=3
//   marmita 300g/400g: ⚠️ <=7, ❌ <=5
//   sopa (400g): ⚠️ <=7, ❌ <=5
//   complemento/bebida (200g): ⚠️ <=7, ❌ <=5
// A função tem verify_jwt = false; o cron autoriza via header x-cron-secret.
// ─────────────────────────────────────────────────────────────────────────────

function requireEnv(nome: string): string {
  const valor = Deno.env.get(nome);
  if (!valor) {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${nome}. ` +
        `Configure com: supabase secrets set ${nome}=...`,
    );
  }
  return valor;
}

const WHATSAPP_TOKEN = requireEnv("WHATSAPP_TOKEN");
const WHATSAPP_PHONE_NUMBER_ID = requireEnv("WHATSAPP_PHONE_NUMBER_ID");
const SUPABASE_URL = requireEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
// Número fallback (usado se a lista do banco estiver vazia).
const ADMIN_ALERT_PHONE_FALLBACK = Deno.env.get("ADMIN_ALERT_PHONE") ?? "5547997391514";
const WHATSAPP_API_VERSION = "v20.0";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

type Tipo = "marmita" | "sopa" | "complemento" | "bebida" | "combo";

// Retorna o nível de alerta de uma coluna de estoque conforme tipo/tamanho.
// "urgente" (❌), "baixo" (⚠️) ou "ok".
function nivel(tipo: Tipo, coluna: "200g" | "300g" | "400g", valor: number): "urgente" | "baixo" | "ok" {
  let limAlerta = 7;
  let limUrgente = 5;
  if (tipo === "marmita" && coluna === "200g") {
    limAlerta = 4;
    limUrgente = 3;
  }
  if (valor <= limUrgente) return "urgente";
  if (valor <= limAlerta) return "baixo";
  return "ok";
}

// Colunas relevantes por tipo de produto.
function colunasDoTipo(tipo: Tipo): ("200g" | "300g" | "400g")[] {
  if (tipo === "marmita") return ["200g", "300g", "400g"];
  if (tipo === "sopa") return ["400g"];
  if (tipo === "complemento" || tipo === "bebida") return ["200g"];
  return []; // combo não tem estoque próprio
}

async function sendWhatsApp(to: string, text: string) {
  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
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
    const err = await res.text();
    throw new Error(`WhatsApp API error: ${err}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Autorização do cron (função é pública; o segredo é a barreira real).
  if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { data: produtos, error } = await supabase
      .from("produtos")
      .select("nome, tipo_produto, estoque_200g, estoque_300g, estoque_400g, controle_estoque, ativo")
      .eq("controle_estoque", true)
      .eq("ativo", true)
      .order("nome");
    if (error) throw error;

    // Busca a lista de números destinatários do banco.
    // Fallback para o número padrão se a lista estiver vazia.
    const { data: settings } = await supabase
      .from("site_settings")
      .select("parametros_loja")
      .maybeSingle();
    const listaBanco: string[] = (settings?.parametros_loja as any)?.alerta_estoque_numeros ?? [];
    const destinatarios = listaBanco.length > 0 ? listaBanco : [ADMIN_ALERT_PHONE_FALLBACK];

    // Marcador ao lado do valor conforme o nível de alerta.
    const marca = (tipo: Tipo, col: "200g" | "300g" | "400g", valor: number): string => {
      const n = nivel(tipo, col, valor);
      if (n === "urgente") return `${valor} ❌`;
      if (n === "baixo") return `${valor} ⚠️`;
      return `${valor}`;
    };

    // Separa por seção (bebidas e combos ficam de fora).
    const marmitas: string[] = [];
    const sopas: string[] = [];
    const complementos: string[] = [];
    let totalUrgentes = 0;
    let totalBaixos = 0;

    for (const p of produtos ?? []) {
      const tipo = (p.tipo_produto ?? "marmita") as Tipo;
      if (tipo === "bebida" || tipo === "combo") continue;

      const e200 = Number(p.estoque_200g ?? 0);
      const e300 = Number(p.estoque_300g ?? 0);
      const e400 = Number(p.estoque_400g ?? 0);

      // Conta alertas (para o resumo do topo).
      for (const col of colunasDoTipo(tipo)) {
        const v = col === "200g" ? e200 : col === "400g" ? e400 : e300;
        const n = nivel(tipo, col, v);
        if (n === "urgente") totalUrgentes++;
        else if (n === "baixo") totalBaixos++;
      }

      if (tipo === "marmita") {
        marmitas.push(
          `• ${p.nome} - ${marca(tipo, "200g", e200)} / ${marca(tipo, "300g", e300)} / ${marca(tipo, "400g", e400)}`,
        );
      } else if (tipo === "sopa") {
        sopas.push(`• ${p.nome} - ${marca(tipo, "400g", e400)}`);
      } else if (tipo === "complemento") {
        complementos.push(`• ${p.nome} - ${marca(tipo, "200g", e200)}`);
      }
    }

    const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

    const partes: string[] = [
      `📦 *ESTOQUE LOJA* — ${hoje}`,
      `_(do lado o que tem de estoque)_`,
      `⚠️ - Sabor Precisando  ❌ - Super Urgente`,
    ];
    if (marmitas.length > 0) {
      partes.push(`\n*MARMITAS* _(200g / 300g / 400g)_\n${marmitas.join("\n")}`);
    }
    if (sopas.length > 0) {
      partes.push(`\n*SOPAS*\n${sopas.join("\n")}`);
    }
    if (complementos.length > 0) {
      partes.push(`\n*COMPLEMENTOS*\n${complementos.join("\n")}`);
    }
    if (totalUrgentes > 0 || totalBaixos > 0) {
      partes.push(`\n_Resumo: ${totalUrgentes} urgente(s) ❌ · ${totalBaixos} baixo(s) ⚠️_`);
    }

    // Envia para todos os destinatários em paralelo.
    await Promise.all(destinatarios.map((tel) => sendWhatsApp(tel, partes.join("\n"))));

    return new Response(
      JSON.stringify({
        ok: true,
        destinatarios: destinatarios.length,
        marmitas: marmitas.length,
        sopas: sopas.length,
        complementos: complementos.length,
        urgentes: totalUrgentes,
        baixos: totalBaixos,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (e: any) {
    console.error("estoque-alerta-diario erro:", e?.message);
    return new Response(JSON.stringify({ error: e?.message ?? "erro" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

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
// Número que recebe o alerta (formato E.164 sem "+", ex.: 5547997391514).
// Configurável via secret; fallback no número do admin.
const ADMIN_ALERT_PHONE = Deno.env.get("ADMIN_ALERT_PHONE") ?? "5547997391514";
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

interface Alerta {
  nome: string;
  tamanho: string;
  valor: number;
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

// Rótulo de tamanho para leitura humana (complemento/bebida contam em UN).
function rotuloTamanho(tipo: Tipo, coluna: string): string {
  if (tipo === "complemento" || tipo === "bebida") return "un";
  if (tipo === "sopa") return "un"; // sopa é tamanho único
  return coluna; // marmita mostra 200g/300g/400g
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

    const urgentes: Alerta[] = [];
    const baixos: Alerta[] = [];

    for (const p of produtos ?? []) {
      const tipo = (p.tipo_produto ?? "marmita") as Tipo;
      for (const col of colunasDoTipo(tipo)) {
        const valor =
          col === "200g"
            ? Number(p.estoque_200g ?? 0)
            : col === "400g"
              ? Number(p.estoque_400g ?? 0)
              : Number(p.estoque_300g ?? 0);
        const n = nivel(tipo, col, valor);
        if (n === "ok") continue;
        const alerta: Alerta = { nome: p.nome, tamanho: rotuloTamanho(tipo, col), valor };
        if (n === "urgente") urgentes.push(alerta);
        else baixos.push(alerta);
      }
    }

    const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });

    // Se não há nada em alerta, manda uma mensagem tranquilizadora curta.
    if (urgentes.length === 0 && baixos.length === 0) {
      await sendWhatsApp(
        ADMIN_ALERT_PHONE,
        `📦 *Estoque Saborosamente* — ${hoje}\n\n✅ Tudo certo! Nenhum item em nível de alerta hoje.`,
      );
      return new Response(JSON.stringify({ ok: true, urgentes: 0, baixos: 0 }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const linha = (a: Alerta) => `• ${a.nome} ${a.tamanho} (${a.valor}${a.tamanho === "un" ? "" : ""})`;

    const partes: string[] = [`📦 *Estoque Saborosamente* — ${hoje}`];
    if (urgentes.length > 0) {
      partes.push(`\n❌ *Super urgente* (${urgentes.length}):\n${urgentes.map(linha).join("\n")}`);
    }
    if (baixos.length > 0) {
      partes.push(`\n⚠️ *Precisando* (${baixos.length}):\n${baixos.map(linha).join("\n")}`);
    }
    partes.push(`\n_Reponha antes de acabar 😉_`);

    await sendWhatsApp(ADMIN_ALERT_PHONE, partes.join("\n"));

    return new Response(
      JSON.stringify({ ok: true, urgentes: urgentes.length, baixos: baixos.length }),
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

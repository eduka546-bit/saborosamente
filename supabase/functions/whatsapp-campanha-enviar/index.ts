import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const DELAY_MS = 2000;
const MAX_POR_MINUTO = 30;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enviarMensagem(
  to: string,
  mensagem: string,
  imagemUrl: string | null,
  videoUrl: string | null,
  template?: { name: string; language: string; variaveis: string[] } | null
): Promise<{ sucesso: boolean; erro?: string }> {
  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const headers = {
    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    "Content-Type": "application/json",
  };

  // Envio por template (alcança qualquer número)
  if (template) {
    const components = [];

    if (template.variaveis.length > 0) {
      components.push({
        type: "body",
        parameters: template.variaveis.map((v) => ({ type: "text", text: v })),
      });
    }

    const body = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template.name,
        language: { code: template.language },
        components: components.length > 0 ? components : undefined,
      },
    };

    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const resJson = await res.json().catch(() => ({})) as { error?: { message?: string }; messages?: { id: string }[] };
    console.log(`Template para ${to}:`, JSON.stringify(resJson));

    if (res.ok) return { sucesso: true };
    return { sucesso: false, erro: resJson.error?.message || "Erro ao enviar template" };
  }

  // Enviar vídeo com caption
  if (videoUrl) {
    const body = {
      messaging_product: "whatsapp",
      to,
      type: "video",
      video: { link: videoUrl, caption: mensagem },
    };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (res.ok) return { sucesso: true };

    // Fallback para documento
    const bodyDoc = {
      messaging_product: "whatsapp",
      to,
      type: "document",
      document: { link: videoUrl, caption: mensagem, filename: "video.mp4" },
    };
    const resDoc = await fetch(url, { method: "POST", headers, body: JSON.stringify(bodyDoc) });
    if (resDoc.ok) return { sucesso: true };

    const errDoc = await resDoc.json().catch(() => ({})) as { error?: { message?: string } };
    return { sucesso: false, erro: errDoc.error?.message || "Erro ao enviar vídeo" };
  }

  // Enviar imagem com caption
  if (imagemUrl) {
    const body = {
      messaging_product: "whatsapp",
      to,
      type: "image",
      image: { link: imagemUrl, caption: mensagem },
    };
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (res.ok) return { sucesso: true };

    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    return { sucesso: false, erro: err.error?.message || "Erro ao enviar imagem" };
  }

  // Só texto (janela 24h)
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: mensagem },
  };
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  const resJson = await res.json().catch(() => ({})) as { error?: { message?: string } };
  console.log(`Texto para ${to}:`, JSON.stringify(resJson));
  if (res.ok) return { sucesso: true };
  return { sucesso: false, erro: resJson.error?.message || "Erro ao enviar texto" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let campanha_id = "";

  try {
    const body = await req.json() as {
      campanha_id: string;
      contatos: string[];
      mensagem: string;
      imagem_url: string | null;
      video_url: string | null;
      midia_tipo: string;
      template?: { name: string; language: string; variaveis: string[] } | null;
    };

    campanha_id = body.campanha_id;
    const { contatos, mensagem, imagem_url, video_url, template } = body;

    if (!campanha_id || !contatos || !mensagem) {
      return new Response("Missing required fields", { status: 400, headers: CORS_HEADERS });
    }

    console.log(`Iniciando campanha ${campanha_id} para ${contatos.length} contatos${template ? ` (template: ${template.name})` : ""}`);

    await supabase
      .from("campanhas_whatsapp")
      .update({ status: "enviando" })
      .eq("id", campanha_id);

    await supabase.from("campanhas_whatsapp_envios").insert(
      contatos.map((tel: string) => ({ campanha_id, telefone: tel, status: "pendente" }))
    );

    let enviados = 0;
    let falhados = 0;
    const inicio = Date.now();
    let msgsEsteMinuto = 0;
    let inicioMinuto = Date.now();

    for (let i = 0; i < contatos.length; i++) {
      const telefone = contatos[i];

      if (Date.now() - inicioMinuto > 60000) {
        msgsEsteMinuto = 0;
        inicioMinuto = Date.now();
      }

      if (msgsEsteMinuto >= MAX_POR_MINUTO) {
        const espera = 60000 - (Date.now() - inicioMinuto);
        console.log(`Rate limit: aguardando ${espera}ms`);
        await sleep(espera + 500);
        msgsEsteMinuto = 0;
        inicioMinuto = Date.now();
      }

      if (i > 0) await sleep(DELAY_MS);

      const resultado = await enviarMensagem(telefone, mensagem, imagem_url, video_url, template);
      msgsEsteMinuto++;

      if (resultado.sucesso) {
        enviados++;
        await supabase
          .from("campanhas_whatsapp_envios")
          .update({ status: "enviado", enviado_em: new Date().toISOString() })
          .eq("campanha_id", campanha_id)
          .eq("telefone", telefone);
      } else {
        falhados++;
        await supabase
          .from("campanhas_whatsapp_envios")
          .update({ status: "falhou", erro_mensagem: resultado.erro })
          .eq("campanha_id", campanha_id)
          .eq("telefone", telefone);
        console.warn(`Falha para ${telefone}: ${resultado.erro}`);
      }
    }

    const tempoTotal = Math.round((Date.now() - inicio) / 1000);

    await supabase
      .from("campanhas_whatsapp")
      .update({
        status: "enviada",
        contatos_enviados: enviados,
        contatos_falhados: falhados,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campanha_id);

    console.log(`Campanha finalizada: ${enviados} enviados, ${falhados} falhas, ${tempoTotal}s`);

    return new Response(
      JSON.stringify({ success: true, enviados, falhados, total: contatos.length, tempoTotal }),
      { headers: { "Content-Type": "application/json", ...CORS_HEADERS }, status: 200 }
    );

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("Erro na campanha:", msg);

    if (campanha_id) {
      await supabase
        .from("campanhas_whatsapp")
        .update({ status: "erro", updated_at: new Date().toISOString() })
        .eq("id", campanha_id)
        .catch(() => {});
    }

    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { "Content-Type": "application/json", ...CORS_HEADERS }, status: 500 }
    );
  }
});

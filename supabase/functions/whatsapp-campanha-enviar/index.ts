import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN")!;
const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Envia mensagem de campanha com imagem/vídeo via WhatsApp
 * Suporta envio de texto simples, com imagem ou com vídeo
 */
async function enviarMensagemCampanha(
  to: string,
  imagemUrl: string | null,
  videoUrl: string | null,
  mensagem: string
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    let body: any;

    // Envia vídeo primeiro se existir
    if (videoUrl) {
      const resVid = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "video",
          video: {
            link: videoUrl,
          },
        }),
      });

      if (!resVid.ok) {
        const err = await resVid.json().catch(() => ({}));
        console.error(`Erro ao enviar vídeo para ${to}:`, err);
        return { sucesso: false, erro: "Erro ao enviar vídeo" };
      }
    }
    // Envia imagem se não houver vídeo
    else if (imagemUrl) {
      const resImg = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "image",
          image: {
            link: imagemUrl,
          },
        }),
      });

      if (!resImg.ok) {
        const err = await resImg.json().catch(() => ({}));
        console.error(`Erro ao enviar imagem para ${to}:`, err);
        return { sucesso: false, erro: "Erro ao enviar imagem" };
      }
    }

    // Depois envia a mensagem de texto
    body = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: mensagem },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error(`Erro ao enviar para ${to}:`, err);
      
      // Detectar tipo de erro
      let erroMsg = "Erro ao enviar";
      if (err.error?.message?.includes("rate limit")) {
        erroMsg = "Rate limit atingido";
      } else if (err.error?.message?.includes("invalid recipient")) {
        erroMsg = "Telefone inválido";
      } else if (err.error?.message?.includes("blocked")) {
        erroMsg = "Número bloqueado";
      }
      
      return { sucesso: false, erro: erroMsg };
    }

    return { sucesso: true };
  } catch (e) {
    console.error(`Erro ao enviar mensagem para ${to}:`, e);
    return { sucesso: false, erro: e instanceof Error ? e.message : "Erro desconhecido" };
  }
}

/**
 * Handler principal
 */
export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { campanha_id, contatos, mensagem, imagem_url, video_url, midia_tipo } = await req.json();

    if (!campanha_id || !contatos || !mensagem) {
      return new Response("Missing required fields", { status: 400 });
    }

    console.log(`Iniciando envio de campanha ${campanha_id} para ${contatos.length} contatos (tipo: ${midia_tipo})`);

    // Atualizar status inicial
    await supabase
      .from("campanhas_whatsapp")
      .update({ status: "enviando" })
      .eq("id", campanha_id);

    // Criar registros de envio
    const envios = contatos.map((tel: string) => ({
      campanha_id,
      telefone: tel,
      status: "pendente",
    }));

    const { error: insertError } = await supabase
      .from("campanhas_whatsapp_envios")
      .insert(envios);

    if (insertError) {
      console.error("Erro ao inserir envios:", insertError);
      throw insertError;
    }

    // Enviar mensagens (com delay para evitar rate limit)
    let enviados = 0;
    let falhados = 0;
    const erros: { telefone: string; erro: string }[] = [];

    for (let i = 0; i < contatos.length; i++) {
      const telefone = contatos[i];
      
      try {
        const resultado = await enviarMensagemCampanha(
          telefone,
          imagem_url,
          video_url,
          mensagem
        );

        if (resultado.sucesso) {
          enviados++;
          await supabase
            .from("campanhas_whatsapp_envios")
            .update({
              status: "enviado",
              enviado_em: new Date().toISOString(),
            })
            .eq("campanha_id", campanha_id)
            .eq("telefone", telefone);
        } else {
          falhados++;
          const statusErro = resultado.erro?.includes("bloqueado")
            ? "bloqueado"
            : "falhou";
          
          await supabase
            .from("campanhas_whatsapp_envios")
            .update({
              status: statusErro,
              erro_mensagem: resultado.erro || "Erro desconhecido",
            })
            .eq("campanha_id", campanha_id)
            .eq("telefone", telefone);

          erros.push({ telefone, erro: resultado.erro || "Desconhecido" });
        }

        // Rate limit - aguarda 50ms entre mensagens
        // WhatsApp permite ~80 mensagens/segundo, mas sendo conservador
        if (i < contatos.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      } catch (e) {
        console.error(`Erro ao processar ${telefone}:`, e);
        falhados++;
        erros.push({
          telefone,
          erro: e instanceof Error ? e.message : "Erro desconhecido",
        });
      }
    }

    // Atualizar status final da campanha
    const statusFinal = falhados === 0 ? "enviada" : "enviada"; // Marca como enviada mesmo com falhas
    const tempoTotal = Math.ceil(contatos.length * 50 / 1000); // Tempo aproximado em segundos

    await supabase
      .from("campanhas_whatsapp")
      .update({
        status: statusFinal,
        contatos_enviados: enviados,
        contatos_falhados: falhados,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campanha_id);

    console.log(
      `Campanha ${campanha_id} finalizada: ${enviados} enviados, ${falhados} falhados em ~${tempoTotal}s`
    );

    // Log dos erros principais
    if (erros.length > 0) {
      console.warn(`Erros encontrados (${erros.length}):`, erros.slice(0, 5));
    }

    return new Response(
      JSON.stringify({
        success: true,
        enviados,
        falhados,
        total: contatos.length,
        taxaSucesso: Math.round((enviados / contatos.length) * 100),
        errosPrincipais: erros.slice(0, 5),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (e) {
    console.error("Erro geral na campanha:", e);
    
    // Atualizar status para erro
    const req_body = await req.clone().json().catch(() => ({}));
    if (req_body.campanha_id) {
      await supabase
        .from("campanhas_whatsapp")
        .update({
          status: "erro",
          updated_at: new Date().toISOString(),
        })
        .eq("id", req_body.campanha_id)
        .catch(() => {});
    }

    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

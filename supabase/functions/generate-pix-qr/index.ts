/**
 * Gera QR Code de PIX estático via QR Server
 * POST /functions/v1/generate-pix-qr
 *
 * Body:
 * {
 *   "pix_dict": "sua-chave-pix@saborosamente",
 *   "valor": 123.45,
 *   "descricao": "Marmita - Pedido #ABC123"
 * }
 *
 * Response:
 * {
 *   "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=...",
 *   "pix_dict": "sua-chave-pix@saborosamente"
 * }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Gera dados de PIX cópia e cola (sem QR dinâmico - apenas estático)
 * Formato simplificado
 */
function generatePixCopiaCola(chavePix: string, valor: number, descricao: string): string {
  // Formato simplificado para PIX cópia e cola
  // Nota: Para PIX dinâmico real, seria necessário integrar com Banco Central
  // Este é um exemplo com dados estáticos

  const pixData =
    `00020126580014br.gov.bcb.pix` +
    `0136${chavePix}` +
    `5204000053039865802BR5913SABOROSAMENTE6009SAO BENTO` +
    `62410503***63041B5E`;

  return pixData;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Apenas POST é suportado" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { pix_dict, valor, descricao, pedido_id } = await req.json();

    if (!pix_dict || !valor) {
      return new Response(JSON.stringify({ error: "pix_dict e valor são obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Gera dados PIX (formato estático)
    const pixCopiaCola = generatePixCopiaCola(pix_dict, valor, descricao || "Pedido Saborosamente");

    // Gera QR Code via serviço externo (QR Server é gratuito e rápido)
    const qrServerUrl = "https://api.qrserver.com/v1/create-qr-code/";
    const qrParams = new URLSearchParams({
      size: "300x300",
      data: pixCopiaCola,
      format: "png",
    });

    const qrUrl = `${qrServerUrl}?${qrParams.toString()}`;

    console.log(`✅ QR Code gerado para pedido ${pedido_id} - R$ ${valor.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        ok: true,
        qr_code_url: qrUrl,
        pix_dict: pix_dict,
        valor: valor,
        descricao: descricao,
        copia_cola: pixCopiaCola,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (e: any) {
    console.error("generate-pix-qr error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

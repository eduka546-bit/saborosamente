// Montagem vetorial de folhas A3 a partir dos PDFs originais da cozinha.
// Cada modelo tem três páginas A3: 200g, 300g, 400g, com seis etiquetas por página.
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "etiquetas-pdf";
const ROW_HEIGHT = 184.252;
const TOP_MARGIN = 34;
const MAX_ETIQUETAS = 600;
const erro = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), {
    status, headers: { ...CORS, "Content-Type": "application/json" },
  });
const valido = (v: unknown) => Number.isInteger(v) && Number(v) >= 0 && Number(v) <= MAX_ETIQUETAS;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return erro("Método não permitido.", 405);

  try {
    const token = req.headers.get("Authorization");
    if (!token?.startsWith("Bearer ")) return erro("Acesso não autorizado.", 401);
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !anon) return erro("Configuração do serviço incompleta.", 500);

    const db = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: token } },
    });
    const { data: auth, error: authError } = await db.auth.getUser();
    if (authError || !auth.user) return erro("Sessão inválida.", 401);
    const { data: roles, error: rolesError } = await db
      .from("user_roles").select("role").eq("user_id", auth.user.id).in("role", ["admin", "cozinha"]).limit(1);
    if (rolesError || !roles?.length) return erro("Sem permissão para imprimir etiquetas.", 403);

    const body = await req.json();
    const produtoId = body?.produto_id;
    const dataISO = body?.data_fabricacao;
    const quantidades = body?.quantidades ?? {};
    if (typeof produtoId !== "string" || !/^[0-9a-f-]{36}$/i.test(produtoId)) return erro("Produto inválido.");
    if (typeof dataISO !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dataISO)) return erro("Data de fabricação inválida.");
    const [ano, mes, dia] = dataISO.split("-").map(Number);
    const d = new Date(Date.UTC(ano, mes - 1, dia));
    if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia)
      return erro("Data de fabricação inválida.");
    const unidades = [quantidades["200"], quantidades["300"], quantidades["400"]];
    if (!unidades.every(valido)) return erro("Informe quantidades inteiras e positivas.");
    const total = unidades.reduce((sum: number, q: number) => sum + q, 0);
    if (!total || total > MAX_ETIQUETAS) return erro("Selecione de 1 a 600 etiquetas.");

    const { data: modelo, error: modeloError } = await db
      .from("cozinha_etiqueta_pdf_modelos")
      .select("arquivo_path")
      .eq("produto_id", produtoId)
      .single();
    if (modeloError || !modelo?.arquivo_path) return erro("Cadastre o PDF original desse sabor antes de imprimir.", 404);
    const { data: arquivo, error: baixarError } = await db.storage
      .from(BUCKET).download(modelo.arquivo_path);
    if (baixarError || !arquivo) return erro("Não foi possível abrir o PDF cadastrado.", 404);

    const original = await PDFDocument.load(await arquivo.arrayBuffer());
    if (original.getPageCount() !== 3)
      return erro("O PDF deve conter exatamente 3 páginas: 200 g, 300 g e 400 g.", 422);
    const paginas = original.getPages();
    const W = paginas[0].getWidth(), H = paginas[0].getHeight();
    if (Math.abs(W - 841.89) > 4 || Math.abs(H - 1190.55) > 4 ||
        paginas.some((p) => Math.abs(p.getWidth() - W) > 2 || Math.abs(p.getHeight() - H) > 2))
      return erro("O modelo precisa ter páginas A3 verticais (297 × 420 mm).", 422);

    const impressao = await PDFDocument.create();
    const fonte = await impressao.embedFont(StandardFonts.HelveticaBold);
    // Recortar uma etiqueta do próprio PDF (vetorial, sem rasterizar).
    // Reusar o mesmo trecho mantém qualidade e evita PDFs gigantes em produções maiores.
    const corte = {
      left: 0,
      bottom: H - TOP_MARGIN - ROW_HEIGHT,
      right: W,
      top: H - TOP_MARGIN,
    };
    const trechos = await Promise.all(paginas.map((p) => impressao.embedPage(p, corte)));
    const sequencia: number[] = [];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < unidades[i]; j++) sequencia.push(i);
    }
    const dataBR = String(dia).padStart(2, "0") + "/" + String(mes).padStart(2, "0") + "/" + String(ano);
    const fundoVerde = rgb(167 / 255, 207 / 255, 69 / 255);
    const grafite = rgb(55 / 255, 52 / 255, 53 / 255);
    const textWidth = fonte.widthOfTextAtSize(dataBR, 10);

    for (let inicio = 0; inicio < sequencia.length; inicio += 6) {
      const pagina = impressao.addPage([W, H]);
      for (let lugar = 0; lugar < Math.min(6, sequencia.length - inicio); lugar++) {
        const idx = sequencia[inicio + lugar];
        pagina.drawPage(trechos[idx], {
          x: 0,
          y: H - TOP_MARGIN - (lugar + 1) * ROW_HEIGHT,
          width: W,
          height: ROW_HEIGHT,
        });
        // Alteração única: substituir a data antiga sobre o verde original.
        // Coordenadas calibradas a partir do modelo A3 oficial enviado.
        pagina.drawRectangle({
          x: 740, y: H - 219 - lugar * ROW_HEIGHT,
          width: 76, height: 17, color: fundoVerde,
        });
        pagina.drawText(dataBR, {
          x: 777.8 - textWidth / 2,
          y: H - 213.5 - lugar * ROW_HEIGHT,
          size: 10, font: fonte, color: grafite,
        });
      }
    }

    const resultado = await impressao.save({ useObjectStreams: true });
    return new Response(resultado, {
      headers: {
        ...CORS,
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "attachment; filename=etiquetas-a3-" + dataISO + ".pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("Impressão etiquetas PDF:", e instanceof Error ? e.message : e);
    return erro("Falha ao preparar o PDF de etiquetas. Confira o modelo cadastrado.", 500);
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { montarFatosIA, perguntaSemIdentificadores, INSTRUCOES_ASSISTENTE_IA } from "../../../src/lib/whatsapp-ia-facts.ts";
import { formatarTreinamentos } from "../../../src/lib/whatsapp-ia-training.ts";
import { validarSugestaoPedido } from "../../../src/lib/whatsapp-ia-order.ts";
import { catalogVariants } from "../../../src/lib/whatsapp-catalog.ts";
import { normalizarPrecosMarmita } from "../../../src/lib/combo-rules.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  try {
    const token = req.headers.get("Authorization")?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return json({ error: "Entre novamente no painel." }, 401);
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return json({ error: "Sessão inválida." }, 401);
    const { data: role, error: roleError } = await db.from("user_roles").select("role")
      .eq("user_id", auth.user.id).eq("role", "admin").maybeSingle();
    if (roleError || !role) return json({ error: "Acesso administrativo necessário." }, 403);
    const body = await req.json().catch(() => null);
    if (typeof body?.pergunta !== "string" || !body.pergunta.trim() || body.pergunta.length > 1500)
      return json({ error: "Escreva uma pergunta de até 1.500 caracteres." }, 400);
    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) return json({ error: "Chave da OpenAI não configurada." }, 503);
    const montarPedido = body?.modo === "pedido";
    const [produtos, taxas, loja, grupos, ingredientes, treinos] = await Promise.all([
      db.from("produtos").select("id,nome,descricao,ingredientes,tipo_produto,peso,categoria,preco,preco_300g,preco_400g,controle_estoque,estoque_200g,estoque_300g,estoque_400g,ativo,visivel_online,categorias(nome),tabela_nutricional_200g,tabela_nutricional_300g,tabela_nutricional_400g").eq("ativo", true).eq("visivel_online", true).order("nome"),
      db.from("delivery_rates").select("cidade,bairro,valor").eq("ativo", true).order("cidade").order("bairro"),
      db.from("site_settings").select("parametros_loja,endereco,horarios_funcionamento,payment_methods,meal_flags,card_flags,cashback_ativo,cashback_percentual,cashback_validade_dias,cashback_minimo_uso,cashback_limite_desconto_pct").single(),
      db.from("marmita_grupos").select("id,nome,ativo").eq("ativo", true),
      db.from("marmita_ingredientes").select("grupo_id,nome,modos_preparo,ativo").eq("ativo", true),
      db.from("agente_treinamentos").select("pergunta,resposta,status").eq("status", "aprovado").order("created_at", { ascending: false }).limit(20),
    ]);
    if ([produtos, taxas, loja, grupos, ingredientes].some(r => r.error) || !loja.data)
      return json({ error: "Não consegui consultar os dados atuais da loja. Tente novamente." }, 503);
    const fatos = montarFatosIA(produtos.data ?? [], taxas.data ?? [], loja.data, grupos.data ?? [], ingredientes.data ?? []);
    const precos = loja.data.parametros_loja?.precos_marmita;
    const catalogoPedido = (produtos.data ?? []).map((p: any) => ({
      productId: p.id, nome: p.nome, variantes: catalogVariants(p, normalizarPrecosMarmita(precos))
        .filter(v => v.orderable).map(v => ({ weight: v.weight, tamanho: v.label, estoque: v.stock,
          kcal: p["tabela_nutricional_"+v.weight]?.kcal ?? null, proteina: p["tabela_nutricional_"+v.weight]?.prot ?? null })),
    })).filter(p => p.variantes.length);
    const prompt = montarPedido
      ? "Você prepara apenas rascunhos de pedido para revisão humana. Retorne JSON com itens (array de {productId, weight, quantity}) e pendencias (array de textos). Utilize somente IDs e tamanhos disponíveis no catálogo. Não adivinhe sabores, quantidade ou tamanho que não estejam explícitos: sinalize pendência. Se o cliente pedir uma sugestão de sabores, sugira somente produtos disponíveis e respeite a quantidade e tamanho informados. Para sugestões mais leves use apenas calorias cadastradas na gramatura pedida; se faltarem dados sinalize pendência. Não faça promessas nutricionais ou médicas, não considere preços ditos pelo cliente, não trate combos prontos/personalizadas como produtos avulsos. Não execute ações. Se não for pedido, retorne itens vazios. Catálogo JSON: " + JSON.stringify(catalogoPedido)
      : INSTRUCOES_ASSISTENTE_IA + formatarTreinamentos(treinos.data ?? []) + "\nFATOS ATUAIS (JSON):\n" + JSON.stringify(fatos);
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: "gpt-4o-mini", temperature: 0.2, max_tokens: montarPedido ? 1500 : 450,
        ...(montarPedido ? { response_format: { type: "json_object" } } : {}),
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: perguntaSemIdentificadores(body.pergunta) },
        ],
      }),
    });
    if (!resp.ok) {
      const msg = resp.status === 401 || resp.status === 403 ? "Credencial da OpenAI inválida ou sem acesso ao modelo."
        : resp.status === 429 ? "Limite ou crédito da OpenAI atingido. Verifique a conta."
        : "OpenAI indisponível no momento. Tente novamente.";
      return json({ error: msg }, 503);
    }
    const result = await resp.json();
    const resposta = result.choices?.[0]?.message?.content?.trim();
    if (!resposta) return json({ error: "A IA não retornou uma resposta. Tente novamente." }, 503);
    if (montarPedido) {
      const raw = JSON.parse(resposta);
      return json({ pedido: validarSugestaoPedido(raw, produtos.data ?? [], precos), consultadoEm: fatos.atualizadoEm });
    }
    return json({ resposta, consultadoEm: fatos.atualizadoEm, produtos: fatos.catalogo.length, cidades: fatos.cidades.length });
  } catch {
    return json({ error: "Não foi possível gerar a sugestão. Verifique a conexão e tente novamente." }, 503);
  }
});

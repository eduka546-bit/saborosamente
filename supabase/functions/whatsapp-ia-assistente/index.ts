import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { montarFatosIA, perguntaSemIdentificadores, INSTRUCOES_ASSISTENTE_IA } from "../../../src/lib/whatsapp-ia-facts.ts";
import { formatarTreinamentos } from "../../../src/lib/whatsapp-ia-training.ts";
import { validarSugestaoPedido } from "../../../src/lib/whatsapp-ia-order.ts";
import { catalogVariants } from "../../../src/lib/whatsapp-catalog.ts";
import { normalizarPrecosMarmita } from "../../../src/lib/combo-rules.ts";
import { respostaComercialDeterministica } from "../../../src/lib/whatsapp-ia-commercial.ts";
import { normalizarEstadoVenda, validarTransicaoVenda, resumirVenda, sugestoesDeVenda, textoProximaFaixa } from "../../../src/lib/whatsapp-ia-sales.ts";
import { normalizarTelefoneBrasileiro } from "../../../src/lib/whatsapp-ia-privacy.ts";
import {
  criarMemoriaCliente, pedidosRelacionadosAoTelefone, querRepetirUltimoPedido,
  repeticaoSemAlteracoes, contextoDePreferenciasParaIA, verificarTrocasDaRecompra,
  type MemoriaCliente,
} from "../../../src/lib/whatsapp-ia-customer-memory.ts";

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
    const modoContexto = body?.modo === "contexto";
    if (!modoContexto && (typeof body?.pergunta !== "string" || !body.pergunta.trim() || body.pergunta.length > 1500))
      return json({ error: "Escreva uma pergunta de até 1.500 caracteres." }, 400);
    const modoVenda = body?.modo === "venda";
    const montarPedido = body?.modo === "pedido" || modoVenda;
    const estadoAnterior = modoVenda ? normalizarEstadoVenda(body?.estadoVenda) : null;
    // Nunca aceitar telefone fornecido pelo navegador: a conversa determina o
    // contato e a autorização sempre exige uma sessão administrativa válida.
    let telefoneConversa: string | null = null;
    if (body?.conversationId !== undefined || modoContexto) {
      const id = String(body?.conversationId ?? "");
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
        return json({ error: "Conversa inválida para consulta do histórico." }, 400);
      const {data:conversa,error:convErr} = await db.from("whatsapp_conversas")
        .select("telefone").eq("id",id).maybeSingle();
      telefoneConversa = convErr ? null : normalizarTelefoneBrasileiro(conversa?.telefone);
      if (!telefoneConversa) return json({ error: "Não foi possível verificar o número desta conversa." }, 404);
    }
    const key = Deno.env.get("OPENAI_API_KEY");
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
    // Memória por compra real: nenhum dado pessoal é enviado à OpenAI e
    // nenhum histórico de terceiros é recuperado apenas por um telefone digitado.
    let memoria: MemoriaCliente | null = null;
    if (telefoneConversa) {
      const ultimos4 = telefoneConversa.slice(-4);
      const {data:buscaPedidos,error:erroPedidos}=await db.from("pedidos")
        .select("id,created_at,status,telefone_cliente,cliente_telefone,endereco_cidade")
        .or("telefone_cliente.ilike.%" + ultimos4 + "%,cliente_telefone.ilike.%" + ultimos4 + "%")
        .order("created_at",{ascending:false}).limit(120);
      if (erroPedidos) return json({error:"Não foi possível consultar o histórico desta conversa."},503);
      const relacionados = pedidosRelacionadosAoTelefone(buscaPedidos ?? [],telefoneConversa).slice(0,30);
      let linhas: any[] = [];
      if(relacionados.length) {
        const {data:itensHistoricos,error:erroItens}=await db.from("pedido_itens")
          .select("pedido_id,produto_id,quantidade,observacao")
          .in("pedido_id", relacionados.map(p=>p.id)).limit(2000);
        if (erroItens) return json({error:"Não foi possível consultar os itens dos pedidos anteriores."},503);
        linhas = itensHistoricos ?? [];
      }
      memoria = criarMemoriaCliente(
        telefoneConversa,relacionados,linhas,produtos.data ?? [],loja.data.parametros_loja?.precos_marmita,
      );
    }
    if (modoContexto) {
      if (!memoria) return json({error:"Escolha uma conversa para consultar a memória."},400);
      return json({memoria, consultadoEm:fatos.atualizadoEm});
    }
    const pediuRepetir = montarPedido && typeof body.pergunta==="string" && querRepetirUltimoPedido(body.pergunta);
    const mesmoPedido = pediuRepetir && repeticaoSemAlteracoes(body.pergunta);
    if (mesmoPedido && !modoVenda) {
      const anterior=memoria?.ultimoPedido;
      if(!anterior?.itens.length) return json({
        pedido:{itens:[],pendencias:["Não encontrei um pedido entregue anterior com sabores e tamanhos identificáveis nesta conversa. Monte manualmente ou confirme os dados com o cliente."],subtotal:0},
        memoria,consultadoEm:fatos.atualizadoEm,
      });
      const bruto = {
        itens:anterior.itens.map(({productId,quantity,weight})=>({productId,quantity,weight})),
        pendencias:anterior.naoReconhecidos
          ? ["O pedido anterior possui "+anterior.naoReconhecidos+" item(ns) sem gramatura/produto reconhecido. Confira e inclua manualmente antes de finalizar."] : [],
      };
      return json({
        pedido:validarSugestaoPedido(bruto,produtos.data ?? [],loja.data.parametros_loja?.precos_marmita),
        memoria,consultadoEm:fatos.atualizadoEm,origem:"repeticao_verificada",
      });
    }
    if (!key) return json({error:"Chave da OpenAI não configurada."},503);

    if (!montarPedido) {
      const calculada = respostaComercialDeterministica(body.pergunta, fatos);
      if (calculada) return json({
        resposta: calculada,
        consultadoEm: fatos.atualizadoEm,
        produtos: fatos.catalogo.length,
        cidades: fatos.cidades.length,
        fonte: "regra_comercial_verificada",
      });
    }
    const precos = loja.data.parametros_loja?.precos_marmita;
    const catalogoPedido = (produtos.data ?? []).map((p: any) => ({
      productId: p.id, nome: p.nome, variantes: catalogVariants(p, normalizarPrecosMarmita(precos))
        .filter(v => v.orderable).map(v => ({ weight: v.weight, tamanho: v.label, estoque: v.stock,
          kcal: p["tabela_nutricional_"+v.weight]?.kcal ?? null, proteina: p["tabela_nutricional_"+v.weight]?.prot ?? null })),
    })).filter(p => p.variantes.length);
    const contextoMemoria = memoria ? contextoDePreferenciasParaIA(memoria) : "Sem histórico de compras confirmado para esta conversa.";
    const contextoVenda = modoVenda
      ? "\nCARRINHO ATUAL VALIDADO (cada resposta devolve o carrinho COMPLETO): " + JSON.stringify(estadoAnterior) +
        "\nRegra: alterações somam/removem apenas o solicitado. Não apague sabores anteriores ao adicionar um item. Nunca invente pedido, entrega, pagamento, frete, endereço ou consentimento. Se pedido incompleto, mantenha as escolhas anteriores e pergunte o dado que falta."
      : "";
    const prompt = montarPedido
      ? "Você prepara apenas rascunhos de pedido para revisão humana. Retorne JSON com itens (array de {productId, weight, quantity}) e pendencias (array de textos). Utilize somente IDs e tamanhos disponíveis no catálogo. Não adivinhe sabores, quantidade ou tamanho que não estejam explícitos: sinalize pendência. Se o cliente pedir uma sugestão de sabores, sugira somente produtos disponíveis e respeite a quantidade e tamanho informados. Para sugestões mais leves use apenas calorias cadastradas na gramatura pedida; se faltarem dados sinalize pendência. Não faça promessas nutricionais ou médicas, não considere preços ditos pelo cliente, não trate combos prontos/personalizadas como produtos avulsos. Não execute ações. Se não for pedido, retorne itens vazios. Se estiver em VENDA ASSISTIDA, responda JSON contendo sempre itens (carrinho COMPLETO de {productId,weight,quantity}), recebimento ({metodo:'entrega'|'retirada'|null,cidade,bairro,horario}) e pendencias (array); preserve o que já foi escolhido pelo cliente e só altere o que a nova mensagem pediu. Não declare data ou taxa de frete confirmada, apenas preferência. Nunca confunda sugestão com item escolhido: não acrescente sugestões sem o cliente pedir explicitamente. Se o cliente pedir para repetir ou ajustar seu último pedido, use os itens exatos do HISTÓRICO VERIFICADO; só proponha alterações explicitamente solicitadas e marque pendências se não estiver claro quais itens trocar. Não trate histórico como pedido confirmado, reserva ou pagamento. Se o histórico está ausente, nunca invente o último pedido. Não presuma endereço, alergia, condições médicas ou identidade. HISTÓRICO VERIFICADO (interno da equipe, não compartilhar dados de terceiros): " + contextoMemoria + " Catálogo JSON: " + JSON.stringify(catalogoPedido) + contextoVenda
      : INSTRUCOES_ASSISTENTE_IA + formatarTreinamentos(treinos.data ?? []) +
        "\nCONTEXTO DE COMPRAS (apenas da conversa; nunca divulgar sem solicitação e conferência pela equipe): " + contextoMemoria +
        "\nFATOS ATUAIS (JSON):\n" + JSON.stringify(fatos);
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
      const pedido=validarSugestaoPedido(raw,produtos.data ?? [],precos);
      if (modoVenda) {
        const proposto=normalizarEstadoVenda(raw);
        const anterior=estadoAnterior??normalizarEstadoVenda(null);
        const perdas=validarTransicaoVenda(anterior,proposto,body.pergunta);
        const apenasValidos=validarSugestaoPedido({itens:proposto.itens,pendencias:[]},produtos.data??[],precos);
        const errosDeCatalogo=apenasValidos.pendencias;
        if (perdas.length || errosDeCatalogo.length) {
          const anteriorRecalculado=resumirVenda(anterior,{
            itens:anterior.itens,pendencias:[...perdas,...errosDeCatalogo,
              "A proposta não foi aplicada ao carrinho. Corrija as informações e tente novamente."],
          },produtos.data??[],precos,fatos.cidades.map(c=>c.cidade));
          return json({
            pedido:anteriorRecalculado.pedido,estadoVenda:anterior,
            erroValidacao:true,
            resumo:{itensTotal:anteriorRecalculado.itensTotal,texto:anteriorRecalculado.resumo,
              pendencias:anteriorRecalculado.pendencias,perguntaSeguinte:anteriorRecalculado.perguntaSeguinte,
              aplicavelNoFormulario:false,proximaFaixa:null},
            consultadoEm:fatos.atualizadoEm,
          });
        }
        // Nunca encaminhar para o navegador IDs, quantidades ou preços não validados.
        const estadoSeguro={
          ...proposto,
          itens:apenasValidos.itens.map(i=>({productId:i.productId,
            weight:i.weight,quantity:i.quantity})),
        };
        const resumo=resumirVenda(estadoSeguro,{itens:estadoSeguro.itens,
          pendencias:Array.isArray(raw.pendencias)?raw.pendencias:[]},
          produtos.data??[],precos,fatos.cidades.map(c=>c.cidade));
        const favoritos=memoria?.favoritos.map(x=>x.productId)??[];
        const sugestoes=sugestoesDeVenda(resumo.pedido,produtos.data ?? [],precos,favoritos);
        return json({
          pedido:resumo.pedido,estadoVenda:estadoSeguro,
          resumo:{itensTotal:resumo.itensTotal,texto:resumo.resumo,pendencias:resumo.pendencias,
            perguntaSeguinte:resumo.perguntaSeguinte,aplicavelNoFormulario:resumo.aplicavelNoFormulario,
            proximaFaixa:textoProximaFaixa(resumo,precos)},
          sugestoes,consultadoEm:fatos.atualizadoEm,origem:"venda_assistida",
        });
      }
      if(pediuRepetir && memoria?.ultimoPedido?.itens.length) {
        pedido.pendencias.push(...verificarTrocasDaRecompra(
          body.pergunta,memoria.ultimoPedido.itens,pedido.itens,
        ));
      }
      if (pediuRepetir && (!memoria?.ultimoPedido?.itens.length || memoria.ultimoPedido.naoReconhecidos)) {
        pedido.pendencias.push("Pedido anterior incompleto ou não identificado. A equipe deve conferir os itens antes de aplicar o rascunho.");
      }
      return json({pedido,consultadoEm:fatos.atualizadoEm, memoria:memoria?{
        pedidosEntregues:memoria.pedidosEntregues,ultimoPedido:memoria.ultimoPedido?{
          data:memoria.ultimoPedido.data,naoReconhecidos:memoria.ultimoPedido.naoReconhecidos,
        }:null,
      }:null});
    }
    return json({ resposta, consultadoEm: fatos.atualizadoEm, produtos: fatos.catalogo.length, cidades: fatos.cidades.length });
  } catch {
    return json({ error: "Não foi possível gerar a sugestão. Verifique a conexão e tente novamente." }, 503);
  }
});

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient } from "@/integrations/supabase/server";
import {
  calcularFrete,
  isNoDiscount,
  normalizarPrecosMarmita,
  precoCheioMarmita,
  precoMarmitaPorFaixa,
  unidadesDoItem,
} from "@/lib/combo-rules";
import {
  limiteProteina,
  normalizarMarmitaConfig,
  tamanhoPorPeso,
} from "@/lib/marmita-personalizada-config";

const roundMoney = (value: number) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const orderItemSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().positive().max(200),
  weight: z.string().max(20).optional(),
  // Mantido por compatibilidade com o cliente, mas nunca é confiado pelo servidor.
  price: z.number().nonnegative(),
  opcoes: z
    .object({
      consumo: z.enum(["pronta", "congelada"]),
      garfoEFaca: z.boolean().optional(),
    })
    .optional(),
  comboPronto: z
    .object({
      totalUnits: z.number().int().positive().max(100),
      sabores: z
        .array(
          z.object({
            productId: z.string().uuid(),
            quantity: z.number().int().positive().max(100),
          }),
        )
        .min(1)
        .max(50),
    })
    .optional(),
  custom: z
    .object({
      label: z.string().max(120),
      tamanhoSigla: z.string().max(10),
      pesoTotal: z.number().positive().max(1000),
      itens: z
        .array(
          z.object({
            grupo: z.string().max(80),
            nome: z.string().max(120),
            modoPreparo: z.string().max(80).optional(),
            gramatura: z.number().min(0).max(1000),
          }),
        )
        .min(1)
        .max(30),
    })
    .optional(),
});

const createOrderSchema = z.object({
  nome: z.string().trim().min(3).max(80),
  email: z.string().trim().email().max(120),
  telefone: z.string().trim().min(10).max(20),
  metodoEntrega: z.enum(["entrega", "retirada"]),
  horarioEntrega: z.string().trim().min(3).max(120),
  cidade: z.string().trim().max(80).optional(),
  bairro: z.string().trim().max(120).optional(),
  endereco: z.string().trim().max(160).optional(),
  complemento: z.string().trim().max(80).optional(),
  cep: z.string().trim().max(20).optional(),
  pagamento: z.string().trim().min(2).max(50),
  observacoes: z.string().trim().max(300).optional(),
  // Valores abaixo chegam do navegador apenas para compatibilidade. O servidor recalcula tudo.
  valorTotal: z.number().nonnegative(),
  taxaEntrega: z.number().nonnegative(),
  desconto: z.number().nonnegative(),
  userId: z.string().uuid().optional(),
  accessToken: z.string().min(20),
  cashbackUsado: z.number().nonnegative().optional().default(0),
  cupom: z.string().trim().max(80).optional(),
  items: z.array(orderItemSchema).min(1).max(100),
  troco: z.string().trim().max(30).optional(),
  tipoCartao: z.string().trim().max(80).optional(),
});

interface PedidoInsert {
  user_id: string | null;
  nome_cliente: string;
  telefone_cliente: string;
  email_cliente: string;
  metodo_entrega: string;
  horario_recebimento: string;
  metodo_pagamento: string;
  observacao: string;
  valor_total: number;
  taxa_entrega: number;
  desconto_aplicado: number;
  cashback_usado: number;
  desconto_indicacao: number;
  cupom_codigo: string | null;
  troco: string | null;
  tipo_cartao: string | null;
  status: string;
  endereco_cidade?: string;
  endereco_bairro?: string;
  endereco_rua?: string;
  endereco_complemento?: string;
  endereco_cep?: string;
}

export const createOrder = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof createOrderSchema>) => createOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createServerClient();

    // Autenticação obrigatória e verificada no servidor.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(data.accessToken);
    if (authError || !user) throw new Error("Sua sessão expirou. Entre novamente para finalizar.");
    if (data.userId && data.userId !== user.id) throw new Error("Sessão inválida.");

    const { data: settings, error: settingsError } = await supabase
      .from("site_settings")
      .select("parametros_loja, payment_methods, cashback_ativo, cashback_minimo_uso, cashback_limite_desconto_pct")
      .maybeSingle();
    if (settingsError) throw new Error("Não foi possível carregar as configurações da loja.");

    const tabelaPrecos = normalizarPrecosMarmita((settings as any)?.parametros_loja?.precos_marmita);
    const personalizadaCfg = normalizarMarmitaConfig(
      (settings as any)?.parametros_loja?.marmita_personalizada,
    );
    const acrescimos = (settings as any)?.parametros_loja?.acrescimos ?? {};
    const adicionalPronta = Number(acrescimos?.pronta) || 1;
    const adicionalGarfo = Number(acrescimos?.garfoEFaca) || 1;

    // Confirma que a forma de pagamento escolhida está habilitada.
    const paymentMap: Record<string, string> = {
      PIX: "pix",
      "Cartão": "cartao",
      "Alimentação": "alimentacao",
      "Mercado Pago": "mercadopago",
      Dinheiro: "dinheiro",
    };
    const configuredPayments = Array.isArray((settings as any)?.payment_methods)
      ? (settings as any).payment_methods.filter((p: any) => p?.enabled !== false)
      : [];
    if (configuredPayments.length > 0) {
      const allowed = new Set(
        configuredPayments.map((p: any) => paymentMap[String(p?.label ?? "")]).filter(Boolean),
      );
      if (!allowed.has(data.pagamento)) throw new Error("Forma de pagamento indisponível.");
    }
    if ((data.pagamento === "cartao" || data.pagamento === "alimentacao") && !data.tipoCartao) {
      throw new Error("Selecione o cartão ou benefício utilizado.");
    }

    const productIds = [
      ...new Set(
        data.items
          .filter((item) => !item.custom && item.productId)
          .map((item) => item.productId as string),
      ),
    ];

    const { data: products, error: productsError } = productIds.length
      ? await supabase
          .from("produtos")
          .select(
            "id, nome, preco, preco_300g, preco_400g, tipo_produto, controle_estoque, estoque_200g, estoque_300g, estoque_400g, ativo, visivel_online, categorias(nome)",
          )
          .in("id", productIds)
          .eq("ativo", true)
          .eq("visivel_online", true)
      : { data: [], error: null };

    if (productsError) throw new Error("Não foi possível validar os produtos do pedido.");
    if ((products ?? []).length !== productIds.length) {
      throw new Error("Um ou mais produtos não estão mais disponíveis.");
    }

    const productMap = new Map((products ?? []).map((p: any) => [p.id, p]));

    const comboIds = [
      ...new Set(
        data.items
          .filter((item) => item.comboPronto && item.productId)
          .map((item) => item.productId as string),
      ),
    ];
    const comboFlavorIds = [
      ...new Set(
        data.items.flatMap((item) =>
          item.comboPronto?.sabores.map((s) => s.productId) ?? [],
        ),
      ),
    ];

    const { data: comboLinks, error: comboLinksError } = comboIds.length
      ? await supabase
          .from("combo_sabores")
          .select("combo_id, produto_id")
          .in("combo_id", comboIds)
          .eq("ativo", true)
      : { data: [], error: null };
    if (comboLinksError) throw new Error("Não foi possível validar os sabores do combo.");

    const { data: comboFlavorProducts, error: comboFlavorError } = comboFlavorIds.length
      ? await supabase
          .from("produtos")
          .select(
            "id, nome, tipo_produto, controle_estoque, estoque_200g, estoque_300g, estoque_400g, ativo, visivel_online",
          )
          .in("id", comboFlavorIds)
          .eq("ativo", true)
          .eq("visivel_online", true)
      : { data: [], error: null };
    if (comboFlavorError) throw new Error("Não foi possível validar o estoque dos sabores.");

    const comboAllowed = new Set(
      (comboLinks ?? []).map((row: any) => `${row.combo_id}:${row.produto_id}`),
    );
    const comboFlavorMap = new Map(
      (comboFlavorProducts ?? []).map((p: any) => [p.id, p]),
    );

    // Quantidade real usada nas faixas de preço e frete.
    const totalUnidades = data.items.reduce((acc, item) => {
      if (item.custom) return acc + item.quantity;
      const p: any = item.productId ? productMap.get(item.productId) : null;
      if (!p) return acc;
      const categoria = Array.isArray(p.categorias) ? p.categorias[0]?.nome : p.categorias?.nome;
      return acc + item.quantity * unidadesDoItem(p.nome, categoria);
    }, 0);

    const authoritativeItems = data.items.map((item) => {
      if (item.custom) {
        if (!personalizadaCfg.ativo) throw new Error("Marmitas personalizadas estão indisponíveis.");
        if (item.quantity < personalizadaCfg.minUnidades) {
          throw new Error(
            `Marmitas personalizadas exigem no mínimo ${personalizadaCfg.minUnidades} unidades por combinação.`,
          );
        }

        const itensComPeso = item.custom.itens.filter((i) => i.gramatura > 0);
        const pesoCalculado = itensComPeso.reduce((sum, i) => sum + i.gramatura, 0);
        if (pesoCalculado <= 0 || pesoCalculado > personalizadaCfg.pesoMaximo) {
          throw new Error("Gramatura inválida na marmita personalizada.");
        }

        const tamanho = tamanhoPorPeso(pesoCalculado, personalizadaCfg);
        if (!tamanho || tamanho.sigla !== item.custom.tamanhoSigla) {
          throw new Error("Tamanho inválido na marmita personalizada.");
        }

        const pesoProteina = itensComPeso
          .filter((i) => i.grupo.toLowerCase().includes("prote"))
          .reduce((sum, i) => sum + i.gramatura, 0);
        const excedente = Math.max(0, pesoProteina - limiteProteina(tamanho, personalizadaCfg));
        const unitPrice = roundMoney(
          tamanho.preco + excedente * personalizadaCfg.adicionalProteinaPorGrama,
        );

        return {
          item,
          product: null,
          fullUnitPrice: unitPrice,
          effectiveUnitPrice: unitPrice,
        };
      }

      if (!item.productId) throw new Error("Produto inválido no pedido.");
      const p: any = productMap.get(item.productId);
      if (!p) throw new Error("Produto não disponível.");

      const categoria = String(
        Array.isArray(p.categorias) ? p.categorias[0]?.nome ?? "" : p.categorias?.nome ?? "",
      );
      const tipo = String(p.tipo_produto ?? "marmita").toLowerCase();
      const isSopa = tipo === "sopa" || categoria.toLowerCase().includes("sopa");
      const precoCatalogo =
        item.weight === "300g" && p.preco_300g
          ? Number(p.preco_300g)
          : item.weight === "400g" && p.preco_400g
            ? Number(p.preco_400g)
            : Number(p.preco);

      if (item.comboPronto) {
        if (tipo !== "combo") throw new Error("Combo inválido.");
        if (!["200g", "300g", "400g"].includes(item.weight ?? "")) {
          throw new Error("Tamanho inválido para o combo.");
        }

        const esperado = unidadesDoItem(p.nome, categoria);
        if (esperado <= 1 || item.comboPronto.totalUnits !== esperado) {
          throw new Error("Quantidade do combo inválida.");
        }

        const agrupados = new Map<string, number>();
        for (const sabor of item.comboPronto.sabores) {
          agrupados.set(sabor.productId, (agrupados.get(sabor.productId) ?? 0) + sabor.quantity);
        }
        const totalSelecionado = [...agrupados.values()].reduce((sum, qty) => sum + qty, 0);
        if (totalSelecionado !== esperado) {
          throw new Error(`Escolha exatamente ${esperado} sabores para este combo.`);
        }

        const comboComponents = [...agrupados.entries()].map(([productId, quantity]) => {
          if (!comboAllowed.has(`${p.id}:${productId}`)) {
            throw new Error("Um dos sabores não pertence a este combo.");
          }
          const sabor: any = comboFlavorMap.get(productId);
          if (!sabor) throw new Error("Um dos sabores do combo não está disponível.");

          if (sabor.controle_estoque) {
            const available =
              item.weight === "400g"
                ? Number(sabor.estoque_400g ?? 0)
                : item.weight === "300g"
                  ? Number(sabor.estoque_300g ?? 0)
                  : Number(sabor.estoque_200g ?? 0);
            const necessario = quantity * item.quantity;
            if (available < necessario) {
              throw new Error(`Estoque insuficiente para ${sabor.nome} em ${item.weight}.`);
            }
          }

          return {
            productId,
            nome: sabor.nome,
            quantity,
          };
        });

        return {
          item,
          product: p,
          fullUnitPrice: roundMoney(precoCatalogo),
          effectiveUnitPrice: roundMoney(precoCatalogo),
          comboComponents,
        };
      }

      const fixedPrice = tipo !== "marmita" || isNoDiscount(categoria);
      const fullBase =
        tipo === "marmita" && !fixedPrice
          ? precoCheioMarmita(item.weight, tabelaPrecos) || precoCatalogo
          : precoCatalogo;
      const effectiveBase =
        tipo === "marmita" && !fixedPrice
          ? precoMarmitaPorFaixa(item.weight, totalUnidades, fullBase, tabelaPrecos)
          : fullBase;

      const optionExtra =
        tipo === "marmita"
          ? (item.opcoes?.consumo === "pronta" ? adicionalPronta : 0) +
            (item.opcoes?.consumo === "pronta" && item.opcoes?.garfoEFaca ? adicionalGarfo : 0)
          : 0;

      // Validação de estoque antes de gravar o pedido.
      if (p.controle_estoque && tipo !== "combo") {
        const available =
          tipo === "sopa"
            ? Number(p.estoque_400g ?? 0)
            : tipo === "complemento" || tipo === "bebida"
              ? Number(p.estoque_200g ?? 0)
              : item.weight === "400g"
                ? Number(p.estoque_400g ?? 0)
                : item.weight === "200g"
                  ? Number(p.estoque_200g ?? 0)
                  : Number(p.estoque_300g ?? 0);
        if (available < item.quantity) {
          throw new Error(`Estoque insuficiente para ${p.nome}.`);
        }
      }

      return {
        item,
        product: p,
        fullUnitPrice: roundMoney(fullBase + optionExtra),
        effectiveUnitPrice: roundMoney(effectiveBase + optionExtra),
      };
    });

    const subtotalCheio = roundMoney(
      authoritativeItems.reduce((sum, row) => sum + row.fullUnitPrice * row.item.quantity, 0),
    );
    const subtotalEfetivo = roundMoney(
      authoritativeItems.reduce((sum, row) => sum + row.effectiveUnitPrice * row.item.quantity, 0),
    );
    const descontoProgressivo = roundMoney(Math.max(0, subtotalCheio - subtotalEfetivo));

    // Indique e Ganhe: 5% para o amigo apenas na primeira compra, com vínculo
    // capturado no cadastro e válido por até 30 dias.
    let referralEligible = false;
    let referralCode: string | null = null;
    let referrer: any = null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, telefone, cpf, indicado_por, indicado_por_em")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.indicado_por && profile?.indicado_por_em) {
      const referralAgeMs = Date.now() - new Date(profile.indicado_por_em).getTime();
      const referralWithin30Days =
        referralAgeMs >= 0 && referralAgeMs <= 30 * 24 * 60 * 60 * 1000;

      if (referralWithin30Days) {
        const { count: previousOrders } = await supabase
          .from("pedidos")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .not("status", "in", '("cancelado","Cancelado")');

        const { data: refProfile } = await supabase
          .from("profiles")
          .select("id, telefone, codigo_indicacao")
          .eq("codigo_indicacao", String(profile.indicado_por).toUpperCase())
          .neq("id", user.id)
          .maybeSingle();

        let duplicatedIdentity = false;
        if (profile.cpf) {
          const { count } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("cpf", profile.cpf)
            .neq("id", user.id);
          duplicatedIdentity = duplicatedIdentity || (count ?? 0) > 0;
        }
        if (profile.telefone) {
          const { count } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("telefone", profile.telefone)
            .neq("id", user.id);
          duplicatedIdentity = duplicatedIdentity || (count ?? 0) > 0;
        }

        if ((previousOrders ?? 0) === 0 && refProfile && !duplicatedIdentity) {
          referralEligible = true;
          referralCode = String(profile.indicado_por).toUpperCase();
          referrer = refProfile;
        }
      }
    }

    const descontoIndicacao = referralEligible ? roundMoney(subtotalEfetivo * 0.05) : 0;

    let taxaEntrega = 0;
    if (data.metodoEntrega === "entrega") {
      if (!data.cidade || !data.bairro || !data.endereco) {
        throw new Error("Informe cidade, bairro e endereço para entrega.");
      }

      const { data: rateRows, error: rateError } = await supabase
        .from("delivery_rates")
        .select("valor")
        .eq("ativo", true)
        .eq("cidade", data.cidade)
        .eq("bairro", data.bairro)
        .limit(1);
      if (rateError || !rateRows?.length) {
        throw new Error("Não encontramos uma taxa de entrega válida para este bairro.");
      }

      const isSbs = data.cidade.toLowerCase().includes("são bento do sul");
      if (!isSbs && subtotalCheio < 70 && totalUnidades < 5) {
        throw new Error("Para esta cidade, o pedido mínimo é R$ 70,00 ou 5 unidades.");
      }

      taxaEntrega = roundMoney(
        calcularFrete({
          subtotal: subtotalCheio,
          totalUnidades,
          taxaBase: Number(rateRows[0].valor ?? 0),
          cidade: data.cidade,
          freteGratisAPartirDe: 999999,
          minQuantidadeSBS: 5,
          fretePromoSBS: 5,
        }),
      );
    }

    let cupomAplicado: string | null = null;
    let cupomTipo: string | null = null;
    let descontoCupom = 0;

    if (data.cupom) {
      const codigo = data.cupom.trim().toUpperCase();
      const { data: cupom, error: cupomError } = await supabase
        .from("cupons")
        .select("codigo, tipo, valor, ativo, validade, uso, max_uso, apenas_primeira_compra")
        .eq("codigo", codigo)
        .maybeSingle();

      if (cupomError) throw new Error("Erro ao validar o cupom.");
      if (!cupom || cupom.ativo === false) throw new Error("Cupom inválido ou inativo.");
      if (cupom.validade && new Date(`${cupom.validade}T23:59:59`) < new Date()) {
        throw new Error("Este cupom expirou.");
      }
      if (
        cupom.max_uso !== null &&
        cupom.max_uso !== undefined &&
        (cupom.uso ?? 0) >= cupom.max_uso
      ) {
        throw new Error("Este cupom já atingiu o limite de usos.");
      }

      if (cupom.apenas_primeira_compra) {
        const { count, error: countError } = await supabase
          .from("pedidos")
          .select("id", { count: "exact", head: true })
          .or(
            `user_id.eq.${user.id},email_cliente.eq.${data.email},telefone_cliente.eq.${data.telefone}`,
          )
          .neq("status", "cancelado")
          .neq("status", "Cancelado");
        if (countError) throw new Error("Não foi possível validar a regra do cupom.");
        if ((count ?? 0) > 0) throw new Error("Este cupom é exclusivo para a primeira compra.");
      }

      const tipoCupom = String(cupom.tipo ?? "");
      cupomTipo = tipoCupom;
      const valorCupom = Number(cupom.valor ?? 0);
      descontoCupom =
        tipoCupom === "Percentual"
          ? subtotalCheio * (valorCupom / 100)
          : tipoCupom === "Entrega Grátis"
            ? taxaEntrega
            : valorCupom;
      descontoCupom = roundMoney(
        Math.min(Math.max(0, descontoCupom), subtotalEfetivo + taxaEntrega),
      );
      cupomAplicado = cupom.codigo;
    }

    const descontoCupomProdutos =
      cupomTipo === "Entrega Grátis"
        ? 0
        : Math.min(descontoCupom, Math.max(0, subtotalEfetivo - descontoIndicacao));
    const produtosLiquidos = roundMoney(
      Math.max(0, subtotalEfetivo - descontoIndicacao - descontoCupomProdutos),
    );

    let cashbackUsado = roundMoney(Number(data.cashbackUsado ?? 0));
    if (cashbackUsado > 0) {
      if (!(settings as any)?.cashback_ativo) {
        throw new Error("Cashback indisponível no momento.");
      }

      const { data: saldoAtual, error: saldoError } = await supabase.rpc(
        "cashback_saldo_disponivel",
        { p_user_id: user.id },
      );
      if (saldoError) throw new Error("Não foi possível validar seu cashback.");

      const saldo = Number(saldoAtual ?? 0);
      const minimoUso = Number((settings as any)?.cashback_minimo_uso ?? 3);
      const limitePct = Number((settings as any)?.cashback_limite_desconto_pct ?? 15) / 100;
      if (saldo < minimoUso) {
        throw new Error(`O saldo mínimo para usar cashback é R$ ${minimoUso.toFixed(2)}.`);
      }

      const cashbackMaximo = roundMoney(Math.min(saldo, produtosLiquidos * limitePct));
      if (cashbackUsado > cashbackMaximo + 0.01) {
        throw new Error(
          `Você pode usar até R$ ${cashbackMaximo.toFixed(2)} de cashback neste pedido.`,
        );
      }
      cashbackUsado = Math.min(cashbackUsado, cashbackMaximo);
    }

    const valorTotal = roundMoney(
      Math.max(
        0,
        subtotalEfetivo + taxaEntrega - descontoCupom - descontoIndicacao - cashbackUsado,
      ),
    );
    const descontoTotal = roundMoney(
      descontoProgressivo + descontoCupom + descontoIndicacao + cashbackUsado,
    );

    const insertData: PedidoInsert = {
      user_id: user.id,
      nome_cliente: data.nome,
      telefone_cliente: data.telefone,
      email_cliente: data.email,
      metodo_entrega: data.metodoEntrega,
      horario_recebimento: data.horarioEntrega,
      metodo_pagamento: data.pagamento,
      observacao: [
        data.observacoes,
        data.troco ? `Troco para: ${data.troco}` : null,
        data.tipoCartao ? `Cartão: ${data.tipoCartao}` : null,
      ]
        .filter(Boolean)
        .join(" | "),
      valor_total: valorTotal,
      taxa_entrega: taxaEntrega,
      desconto_aplicado: descontoTotal,
      cashback_usado: cashbackUsado,
      desconto_indicacao: descontoIndicacao,
      cupom_codigo: cupomAplicado,
      troco: data.troco || null,
      tipo_cartao: data.tipoCartao || null,
      status: "pendente",
    };

    if (data.metodoEntrega === "entrega") {
      insertData.endereco_cidade = data.cidade!;
      insertData.endereco_bairro = data.bairro!;
      insertData.endereco_rua = data.endereco!;
      if (data.complemento) insertData.endereco_complemento = data.complemento;
      if (data.cep) insertData.endereco_cep = data.cep;
    }

    const { data: order, error: orderError } = await supabase
      .from("pedidos")
      .insert(insertData)
      .select()
      .single();
    if (orderError) throw new Error(orderError.message);

    if (referralEligible && referralCode && referrer?.id) {
      const { error: referralError } = await supabase.from("indicacoes").insert({
        indicador_user_id: referrer.id,
        indicador_telefone: referrer.telefone ?? null,
        indicado_user_id: user.id,
        indicado_telefone: data.telefone,
        indicado_email: data.email,
        codigo: referralCode,
        status: "pendente",
        pedido_indicado_id: order.id,
        cashback_gerado: 0,
      });

      if (referralError) {
        await supabase.from("pedidos").delete().eq("id", order.id);
        throw new Error("Não foi possível registrar o benefício da indicação.");
      }
    }

    const itemsToInsert = authoritativeItems.flatMap((row: any) => {
      const { item, effectiveUnitPrice, product, comboComponents } = row;

      if (item.comboPronto && comboComponents?.length) {
        const precoPorMarmita = roundMoney(
          effectiveUnitPrice / Math.max(1, item.comboPronto.totalUnits),
        );
        return comboComponents.map((component: any) => ({
          pedido_id: order.id,
          produto_id: component.productId,
          nome_item: null,
          quantidade: component.quantity * item.quantity,
          preco_unitario: precoPorMarmita,
          observacao: [
            item.weight ? `Peso: ${item.weight}` : null,
            product?.nome ? `Combo: ${product.nome}` : "Combo pronto",
          ]
            .filter(Boolean)
            .join(" | "),
        }));
      }

      const partes: string[] = [];
      if (item.weight) partes.push(`Peso: ${item.weight}`);
      if (item.opcoes) {
        partes.push(item.opcoes.consumo === "pronta" ? "Pronta p/ consumo" : "Congelada");
        if (item.opcoes.consumo === "pronta" && item.opcoes.garfoEFaca) {
          partes.push("Garfo e faca");
        }
      }
      if (item.custom) {
        const comp = item.custom.itens
          .map((i: any) => {
            const g = i.gramatura > 0 ? `${i.gramatura}g ` : "";
            return `${g}${i.nome}${i.modoPreparo ? ` (${i.modoPreparo})` : ""}`;
          })
          .join(" + ");
        partes.push(`PERSONALIZADA ${item.custom.tamanhoSigla} (${item.custom.pesoTotal}g)`);
        if (comp) partes.push(comp);
      }

      return [
        {
          pedido_id: order.id,
          produto_id: item.custom ? null : (item.productId ?? null),
          nome_item: item.custom ? item.custom.label : null,
          quantidade: item.quantity,
          preco_unitario: effectiveUnitPrice,
          observacao: partes.length > 0 ? partes.join(" | ") : null,
        },
      ];
    });

    const { error: itemsError } = await supabase.from("pedido_itens").insert(itemsToInsert);
    if (itemsError) {
      await supabase.from("indicacoes").delete().eq("pedido_indicado_id", order.id);
      await supabase.from("pedidos").delete().eq("id", order.id);
      throw new Error(itemsError.message);
    }

    if (cashbackUsado > 0) {
      const { error: cashbackError } = await supabase.rpc("cashback_usar_seguro", {
        p_user_id: user.id,
        p_pedido_id: order.id,
        p_valor: cashbackUsado,
      });
      if (cashbackError) {
        await supabase.from("pedido_itens").delete().eq("pedido_id", order.id);
        await supabase.from("indicacoes").delete().eq("pedido_indicado_id", order.id);
        await supabase.from("pedidos").delete().eq("id", order.id);
        throw new Error("Não foi possível aplicar o cashback. Tente novamente.");
      }
    }

    for (const row of authoritativeItems as any[]) {
      const item = row.item;
      const tamanho = item.weight || "300g";

      if (item.comboPronto && row.comboComponents?.length) {
        for (const component of row.comboComponents) {
          const { error: estoqueError } = await supabase.rpc("decrementar_estoque", {
            p_produto_id: component.productId,
            p_qtd: component.quantity * item.quantity,
            p_tamanho: tamanho,
          });
          if (estoqueError) console.error("Estoque de combo falhou:", estoqueError.message);
        }
        continue;
      }

      if (item.productId && !item.custom) {
        const { error: estoqueError } = await supabase.rpc("decrementar_estoque", {
          p_produto_id: item.productId,
          p_qtd: item.quantity,
          p_tamanho: tamanho,
        });
        if (estoqueError) console.error("Estoque decrement falhou:", estoqueError.message);
      }
    }

    if (cupomAplicado) {
      const { error: cupomUsoError } = await supabase.rpc("incrementar_uso_cupom", {
        p_codigo: cupomAplicado,
      });
      if (cupomUsoError) console.error("Falha ao incrementar uso do cupom:", cupomUsoError.message);
    }

    try {
      const supabaseUrl = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
      const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
      const protocolo = String(order.id).slice(0, 8).toUpperCase();
      const valor = Number(valorTotal).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      await fetch(`${supabaseUrl}/functions/v1/send-push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey ?? "",
        },
        body: JSON.stringify({
          title: "🛒 Novo pedido!",
          body: `${data.nome || "Cliente"} — ${valor} · #${protocolo}`,
          url: "/admin/pedidos",
          tag: `pedido-${order.id}`,
        }),
      });
    } catch (pushError) {
      console.error("Falha ao disparar push de novo pedido:", pushError);
    }

    return {
      ...order,
      valor_total: valorTotal,
      taxa_entrega: taxaEntrega,
      desconto_aplicado: descontoTotal,
      cashback_usado: cashbackUsado,
      desconto_indicacao: descontoIndicacao,
    };
  });

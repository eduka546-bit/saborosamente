import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient } from "@/integrations/supabase/server";
import { sendOrderReceivedEmail } from "@/lib/resend-email";

const itemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(200),
  weight: z.enum(["200g", "300g", "400g"]),
  unitPrice: z.number().min(0).max(10000),
  observacao: z.string().trim().max(200).optional(),
});

const schema = z.object({
  accessToken: z.string().min(20),
  nome: z.string().trim().min(2).max(120),
  telefone: z.string().trim().max(30).optional().default(""),
  email: z.string().trim().max(160).optional().default(""),
  linkedUserId: z.string().uuid().nullable().optional(),
  metodoEntrega: z.enum(["entrega", "retirada"]),
  horarioEntrega: z.string().trim().max(120).optional().default(""),
  pagamento: z.string().trim().min(2).max(80),
  tipoCartao: z.string().trim().max(80).optional().default(""),
  taxaEntrega: z.number().min(0).max(1000),
  descontoAplicado: z.number().finite().min(0).max(100000).optional().default(0),
  cashbackUsado: z.number().finite().min(0).max(100000).optional().default(0),
  cidade: z.string().trim().max(100).optional().default(""),
  bairro: z.string().trim().max(120).optional().default(""),
  rua: z.string().trim().max(180).optional().default(""),
  numero: z.string().trim().max(30).optional().default(""),
  complemento: z.string().trim().max(120).optional().default(""),
  cep: z.string().trim().max(20).optional().default(""),
  observacao: z.string().trim().max(500).optional().default(""),
  items: z.array(itemSchema).min(1).max(100),
});

export const createWhatsappAdminOrder = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof schema>) => schema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(data.accessToken);
    if (authError || !user) throw new Error("Sessão expirada.");

    const { data: roleRow, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError || !roleRow) throw new Error("Acesso administrativo necessário.");

    if (
      data.metodoEntrega === "entrega" &&
      (!data.rua.trim() || !data.bairro.trim() || !data.cidade.trim())
    ) {
      throw new Error("Informe rua, bairro e cidade para pedidos de entrega.");
    }

    const ids = [...new Set(data.items.map((item) => item.productId))];
    const { data: products, error: productsError } = await supabase
      .from("produtos")
      .select("id,nome,ativo")
      .in("id", ids);

    if (productsError || (products ?? []).length !== ids.length) {
      throw new Error("Um ou mais produtos do pedido não foram encontrados.");
    }
    if ((products ?? []).some((p: any) => p.ativo === false)) {
      throw new Error("Há produto inativo no pedido.");
    }

    // Uma conta escolhida explicitamente no admin prevalece. Nunca associa
    // um pedido a um usuário apenas por nome (nomes podem se repetir).
    let linkedUserId: string | null = null;
    if (data.linkedUserId) {
      const { data: selectedProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.linkedUserId)
        .maybeSingle();
      if (profileError || !selectedProfile) {
        throw new Error("A conta selecionada não existe mais. Selecione novamente o cliente.");
      }
      linkedUserId = selectedProfile.id;
    }

    // Pedidos de convidados nunca concedem acesso a uma conta só pela
    // coincidência de telefone: a conta deve ser selecionada pelo admin.

    // A conta de login é a fonte confiável do e-mail. O perfil público
    // não possui coluna email, portanto selecionar um cliente não preenche
    // automaticamente esse campo na tela do admin.
    let emailCliente = data.email.trim().toLowerCase();
    if (linkedUserId) {
      const { data: linkedAccount, error: accountError } = await supabase.auth.admin.getUserById(linkedUserId);
      if (accountError || !linkedAccount?.user) {
        throw new Error("Não foi possível conferir o e-mail da conta vinculada. Tente novamente.");
      }
      const registeredEmail = String(linkedAccount.user.email ?? "").trim().toLowerCase();
      if (registeredEmail.includes("@")) emailCliente = registeredEmail;
    }

    const pItems = data.items.map((item) => ({
      produto_id: item.productId,
      quantidade: item.quantity,
      preco_unitario: Math.round(item.unitPrice * 100) / 100,
      tamanho: item.weight,
      observacao: item.observacao || null,
    }));

    const { data: order, error } = await supabase.rpc("criar_pedido_whatsapp_admin", {
      p_order: {
        user_id: linkedUserId,
        nome_cliente: data.nome,
        telefone_cliente: data.telefone || null,
        email_cliente: emailCliente || null,
        metodo_entrega: data.metodoEntrega,
        horario_recebimento: data.horarioEntrega || null,
        metodo_pagamento: data.pagamento,
        tipo_cartao: data.tipoCartao || null,
        taxa_entrega: data.metodoEntrega === "entrega" ? data.taxaEntrega : 0,
        desconto_aplicado: data.descontoAplicado,
        cashback_usado: data.cashbackUsado,
        endereco_cidade: data.metodoEntrega === "entrega" ? data.cidade : null,
        endereco_bairro: data.metodoEntrega === "entrega" ? data.bairro : null,
        endereco_rua: data.metodoEntrega === "entrega" ? data.rua : null,
        endereco_numero: data.metodoEntrega === "entrega" ? data.numero : null,
        endereco_complemento: data.metodoEntrega === "entrega" ? data.complemento : null,
        endereco_cep: data.metodoEntrega === "entrega" ? data.cep : null,
        observacao: data.observacao || "",
      },
      p_items: pItems,
    });

    if (error || !order) {
      throw new Error(error?.message || "Não foi possível registrar o pedido do WhatsApp.");
    }

    // Falha no envio nunca desfaz o pedido que já foi salvo nem gera
    // uma segunda baixa de estoque. Informa ao atendente o resultado real.
    let emailStatus: "enviado" | "sem_email" | "falhou" = "sem_email";
    if (emailCliente.includes("@")) {
      try {
        const enviado = await sendOrderReceivedEmail({
          orderId: String((order as any).id),
          email: emailCliente,
          nome: data.nome,
          valorTotal: Number((order as any).valor_total),
          metodoEntrega: data.metodoEntrega,
          faixaHorario: data.horarioEntrega || undefined,
        });
        emailStatus = enviado.ok ? "enviado" : "falhou";
        if (!enviado.ok) console.error("E-mail não foi enviado no pedido manual:", {
          orderId: String((order as any).id),
          reason: "reason" in enviado ? enviado.reason : "service_error",
        });
      } catch (emailError) {
        emailStatus = "falhou";
        console.error("Falha ao disparar e-mail do pedido manual:", emailError);
      }
    }

    return {
      ...(order as any),
      linkedUserId,
      emailStatus,
    };
  });

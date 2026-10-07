import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient } from "@/integrations/supabase/server";
import { sendOrderStatusEmail } from "@/lib/resend-email";

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
  metodoEntrega: z.enum(["entrega", "retirada"]),
  horarioEntrega: z.string().trim().max(120).optional().default(""),
  pagamento: z.string().trim().min(2).max(80),
  tipoCartao: z.string().trim().max(80).optional().default(""),
  taxaEntrega: z.number().min(0).max(1000),
  cidade: z.string().trim().max(100).optional().default(""),
  bairro: z.string().trim().max(120).optional().default(""),
  rua: z.string().trim().max(180).optional().default(""),
  numero: z.string().trim().max(30).optional().default(""),
  complemento: z.string().trim().max(120).optional().default(""),
  cep: z.string().trim().max(20).optional().default(""),
  observacao: z.string().trim().max(500).optional().default(""),
  items: z.array(itemSchema).min(1).max(100),
});

function phoneCandidates(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const values = new Set<string>();
  if (!digits) return [];

  values.add(raw.trim());
  values.add(digits);

  if (digits.startsWith("55")) {
    values.add(`+${digits}`);
    values.add(digits.slice(2));
  } else if (digits.length === 10 || digits.length === 11) {
    values.add(`55${digits}`);
    values.add(`+55${digits}`);
  }

  return [...values].filter(Boolean);
}

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

    let linkedUserId: string | null = null;
    const candidates = phoneCandidates(data.telefone);
    if (candidates.length > 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id,telefone")
        .in("telefone", candidates)
        .limit(1)
        .maybeSingle();
      linkedUserId = profile?.id ?? null;
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
        email_cliente: data.email || null,
        metodo_entrega: data.metodoEntrega,
        horario_recebimento: data.horarioEntrega || null,
        metodo_pagamento: data.pagamento,
        tipo_cartao: data.tipoCartao || null,
        taxa_entrega: data.metodoEntrega === "entrega" ? data.taxaEntrega : 0,
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

    const emailCliente = data.email.trim().toLowerCase();
    if (emailCliente && emailCliente.includes("@")) {
      try {
        await sendOrderStatusEmail({
          orderId: String((order as any).id),
          email: emailCliente,
          nome: data.nome,
          status: "pendente",
          metodoEntrega: data.metodoEntrega,
        });
      } catch (emailError) {
        console.error("Falha ao disparar e-mail do pedido do WhatsApp:", emailError);
      }
    }

    return {
      ...(order as any),
      linkedUserId,
    };
  });

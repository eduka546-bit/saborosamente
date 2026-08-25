import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient } from "@/integrations/supabase/server";

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number(),
  weight: z.string().optional(),
  price: z.number(),
});

const createOrderSchema = z.object({
  nome: z.string(),
  email: z.string(),
  telefone: z.string(),
  metodoEntrega: z.enum(["entrega", "retirada"]),
  horarioEntrega: z.string(),
  cidade: z.string().optional(),
  bairro: z.string().optional(),
  endereco: z.string().optional(),
  complemento: z.string().optional(),
  cep: z.string().optional(),
  pagamento: z.string(),
  observacoes: z.string().optional(),
  valorTotal: z.number(),
  taxaEntrega: z.number(),
  userId: z.string().uuid().optional(),
  desconto: z.number(),
  cupom: z.string().optional(),
  items: z.array(orderItemSchema),
  troco: z.string().optional(),
  tipoCartao: z.string().optional(),
});

// Campos gravados na tabela `pedidos` ao criar um pedido.
// Os de endereço são opcionais (só preenchidos em entrega).
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

    // ── Validação de cupom no servidor (confiável; não dá para burlar pelo cliente) ──
    if (data.cupom) {
      const { data: cupom, error: cupomError } = await supabase
        .from("cupons")
        .select("codigo, ativo, validade, uso, max_uso, apenas_primeira_compra")
        .eq("codigo", data.cupom)
        .maybeSingle();

      if (cupomError) throw new Error("Erro ao validar o cupom.");
      if (!cupom || cupom.ativo === false) {
        throw new Error("Cupom inválido ou inativo.");
      }
      if (cupom.validade && new Date(cupom.validade) < new Date()) {
        throw new Error("Este cupom expirou.");
      }
      if (
        cupom.max_uso !== null &&
        cupom.max_uso !== undefined &&
        (cupom.uso ?? 0) >= cupom.max_uso
      ) {
        throw new Error("Este cupom já atingiu o limite de usos.");
      }

      // Regra "somente primeira compra": checa por user_id, e-mail e telefone.
      if (cupom.apenas_primeira_compra) {
        const query = supabase
          .from("pedidos")
          .select("id", { count: "exact", head: true })
          .neq("status", "Cancelado");

        // Monta o filtro: qualquer pedido anterior do mesmo user, e-mail ou telefone
        const ors: string[] = [];
        if (data.userId) ors.push(`user_id.eq.${data.userId}`);
        if (data.email) ors.push(`email_cliente.eq.${data.email}`);
        if (data.telefone) ors.push(`telefone_cliente.eq.${data.telefone}`);

        if (ors.length > 0) {
          const { count } = await query.or(ors.join(","));
          if ((count ?? 0) > 0) {
            throw new Error("Este cupom é exclusivo para a primeira compra.");
          }
        }
      }
    }

    const insertData: PedidoInsert = {
      user_id: data.userId ?? null,
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
      valor_total: data.valorTotal,
      taxa_entrega: data.taxaEntrega,
      desconto_aplicado: data.desconto ?? 0,
      cupom_codigo: data.cupom || null,
      troco: data.troco || null,
      tipo_cartao: data.tipoCartao || null,
      status: "rascunho",
    };

    // Só adiciona os campos de endereço se houver valor, para evitar erros em 'retirada'
    // e facilitar o debug de colunas faltando no banco
    if (data.metodoEntrega === "entrega") {
      if (data.cidade) insertData.endereco_cidade = data.cidade;
      if (data.bairro) insertData.endereco_bairro = data.bairro;
      if (data.endereco) insertData.endereco_rua = data.endereco;
      if (data.complemento) insertData.endereco_complemento = data.complemento;
      if (data.cep) insertData.endereco_cep = data.cep;
    }

    const { data: order, error: orderError } = await supabase
      .from("pedidos")
      .insert(insertData)
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    // 2. Criar os itens do pedido na tabela 'pedido_itens'
    const itemsToInsert = data.items.map((item) => ({
      pedido_id: order.id,
      produto_id: item.productId,
      quantidade: item.quantity,
      preco_unitario: item.price,
      observacao: item.weight ? `Peso: ${item.weight}` : null,
    }));

    const { error: itemsError } = await supabase.from("pedido_itens").insert(itemsToInsert);

    if (itemsError) throw new Error(itemsError.message);

    // 3. Incrementa o uso do cupom no servidor (após o pedido ser criado com sucesso),
    //    garantindo que o contador só sobe quando o pedido realmente existe.
    if (data.cupom) {
      const { error: cupomUsoError } = await supabase.rpc("incrementar_uso_cupom", {
        p_codigo: data.cupom,
      });
      if (cupomUsoError) {
        // Não falha o pedido por causa do contador; apenas registra.
        console.error("Falha ao incrementar uso do cupom:", cupomUsoError.message);
      }
    }

    return order;
  });

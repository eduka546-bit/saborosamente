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

export const createOrder = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof createOrderSchema>) => createOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createServerClient();
    const insertData: any = {
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
        data.tipoCartao ? `Cartão: ${data.tipoCartao}` : null
      ].filter(Boolean).join(" | "),
      valor_total: data.valorTotal,
      taxa_entrega: data.taxaEntrega,
      desconto_aplicado: data.desconto ?? 0,
      cupom_codigo: data.cupom || null,
      troco: data.troco || null,
      tipo_cartao: data.tipoCartao || null,
      status: "preparando",
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
      observacao: item.weight ? `Peso: ${item.weight}` : null
    }));

    const { error: itemsError } = await supabase
      .from("pedido_itens")
      .insert(itemsToInsert);

    if (itemsError) throw new Error(itemsError.message);

    return order;
  });

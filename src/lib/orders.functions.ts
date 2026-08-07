import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

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
  desconto: z.number(),
  items: z.array(orderItemSchema),
});

export const createOrder = createServerFn({ method: "POST" })
  .input(createOrderSchema)
  .handler(async ({ data }) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Criar o pedido
    const { data: order, error: orderError } = await supabase
      .from("pedidos")
      .insert({
        user_id: user?.id,
        nome_cliente: data.nome,
        telefone_cliente: data.telefone,
        email_cliente: data.email,
        metodo_entrega: data.metodoEntrega,
        horario_recebimento: data.horarioEntrega,
        endereco_cidade: data.cidade,
        endereco_bairro: data.bairro,
        endereco_rua: data.endereco,
        endereco_numero: "", // O campo endereco no checkout já contém numero as vezes
        endereco_complemento: data.complemento,
        metodo_pagamento: data.pagamento,
        observacao: data.observacoes,
        valor_total: data.valorTotal,
        taxa_entrega: data.taxaEntrega,
        desconto_aplicado: data.desconto,
        status: "Pendente",
      })
      .select()
      .single();

    if (orderError) throw new Error(orderError.message);

    // 2. Criar os itens do pedido
    const itemsToInsert = data.items.map(item => ({
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

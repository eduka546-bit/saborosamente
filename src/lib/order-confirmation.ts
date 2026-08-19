import { supabase } from "@/integrations/supabase/client";

/**
 * Confirmar um pedido de rascunho (muda status para 'pendente')
 * @param pedidoId - ID do pedido a confirmar
 */
export async function confirmarPedidoRascunho(pedidoId: string) {
  const { data, error } = await supabase.rpc("confirmar_pedido_rascunho", {
    p_pedido_id: pedidoId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.success) {
    return data;
  } else {
    throw new Error(data.error || "Erro ao confirmar pedido");
  }
}

/**
 * Rejeitar um pedido de rascunho (muda status para 'cancelado')
 * @param pedidoId - ID do pedido a rejeitar
 */
export async function rejeitarPedidoRascunho(pedidoId: string) {
  const { data, error } = await supabase.rpc("rejeitar_pedido_rascunho", {
    p_pedido_id: pedidoId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.success) {
    return data;
  } else {
    throw new Error(data.error || "Erro ao rejeitar pedido");
  }
}

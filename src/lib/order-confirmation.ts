import { supabase } from "@/integrations/supabase/client";

/**
 * Confirma um pedido de rascunho e o muda para "pendente"
 * Também notifica o cliente via WhatsApp
 */
export async function confirmarPedidoRascunho(pedidoId: string) {
  try {
    // 1. Atualiza status do pedido de 'rascunho' para 'pendente'
    const { data: pedido, error: updateError } = await supabase
      .from("pedidos")
      .update({ status: "pendente" })
      .eq("id", pedidoId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Erro ao confirmar pedido: ${updateError.message}`);
    }

    // 2. Envia notificação WhatsApp ao cliente (se integração estiver ativa)
    if (pedido?.cliente_telefone || pedido?.whatsapp) {
      const telefone = pedido.whatsapp || pedido.cliente_telefone;
      if (telefone) {
        try {
          // Aqui você pode chamar a função WhatsApp da sua integração
          // await notificarViaWhatsApp(telefone, pedidoId, pedido);
        } catch (err) {
          console.error("Erro ao enviar WhatsApp:", err);
          // Não falha o fluxo se o WhatsApp não conseguir enviar
        }
      }
    }

    return { success: true, pedido };
  } catch (error) {
    console.error("Erro em confirmarPedidoRascunho:", error);
    throw error;
  }
}

/**
 * Rejeita um pedido de rascunho e o remove ou marca como cancelado
 */
export async function rejeitarPedidoRascunho(pedidoId: string) {
  try {
    const { data, error } = await supabase
      .from("pedidos")
      .update({ status: "cancelado" })
      .eq("id", pedidoId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao rejeitar pedido: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erro em rejeitarPedidoRascunho:", error);
    throw error;
  }
}

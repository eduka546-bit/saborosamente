import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createServerClient } from "@/integrations/supabase/server";

/**
 * Troca de sabores confirmada com o cliente, restrita à administração.
 * A operação no banco é atômica: itens, estorno, nova baixa e auditoria.
 */
const schema = z.object({
  accessToken: z.string().min(20),
  pedidoId: z.string().uuid(),
  itemId: z.string().uuid(),
  novoProdutoId: z.string().uuid(),
  quantidade: z.number().int().min(1).max(500),
  confirmadoComCliente: z.literal(true),
});

export const trocarSaborPedidoAdmin = createServerFn({ method: "POST" })
  .validator((input: z.infer<typeof schema>) => schema.parse(input))
  .handler(async ({ data }) => {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(data.accessToken);
    if (authError || !user) throw new Error("Sessão expirada. Entre novamente.");
    const { data: roleRow, error: roleError } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (roleError || !roleRow) throw new Error("Acesso administrativo necessário.");

    const { data: result, error } = await supabase.rpc("trocar_sabor_pedido_confirmado", {
      p_pedido_id: data.pedidoId,
      p_item_id: data.itemId,
      p_novo_produto_id: data.novoProdutoId,
      p_quantidade: data.quantidade,
      p_confirmado: true,
      p_ator_id: user.id,
    });
    if (error) throw new Error(error.message || "Não foi possível trocar o sabor.");
    return result as {
      pedido_id: string;
      item_id: string;
      sabor_anterior: string;
      sabor_novo: string;
      quantidade: number;
      tamanho: string;
      preco_preservado: boolean;
      estoque_ajustado: boolean;
    };
  });

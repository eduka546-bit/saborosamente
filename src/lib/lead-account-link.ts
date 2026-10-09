import { supabase } from "@/integrations/supabase/client";
import { lerLeadPreCadastro, limparLeadPreCadastro } from "@/lib/lead-pre-cadastro";

/** Após autenticação, liga o lead à conta apenas se o telefone e a sessão
 * anônima forem os mesmos. Em nenhum momento cria uma conta automaticamente.
 */
export async function vincularLeadPreCadastroAutenticado(): Promise<boolean> {
  const lead = lerLeadPreCadastro();
  if (!lead) return false;
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) return false;
  const { data, error } = await supabase.rpc("vincular_lead_sorteio_a_conta", {
    p_session_id: lead.sessionId,
  });
  if (error) {
    console.warn("[Leads] Não foi possível vincular o pré-cadastro à conta.");
    return false;
  }
  // A conta autenticada é agora a fonte confiável dos dados pessoais.
  // Não preservar dados de visitantes em storage após login, mesmo que o
  // telefone cadastrado seja diferente do que foi digitado no pop-up.
  limparLeadPreCadastro();
  return data === true;
}

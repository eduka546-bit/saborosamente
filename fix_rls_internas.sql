-- ============================================================
-- ENDURECIMENTO DE TABELAS INTERNAS
-- Substitui políticas permissivas (USING(true) para public), que deixavam
-- qualquer um com a anon key ler/escrever, por acesso restrito a admin.
--
-- Seguro porque:
--  • As edge functions (whatsapp-agent, tick) usam service_role → ignoram RLS.
--  • O painel admin acessa com o usuário logado, que tem role=admin (has_role).
--  • Políticas de dono (ex: user_own_indicacoes) permanecem intactas.
-- ============================================================

BEGIN;

-- agente_modulos
DROP POLICY IF EXISTS "admin_all_modulos" ON public.agente_modulos;
CREATE POLICY "admin_all_modulos" ON public.agente_modulos
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- automacoes
DROP POLICY IF EXISTS "admin_all_automacoes" ON public.automacoes;
CREATE POLICY "admin_all_automacoes" ON public.automacoes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- automacao_execucoes
DROP POLICY IF EXISTS "admin_all_execucoes" ON public.automacao_execucoes;
CREATE POLICY "admin_all_execucoes" ON public.automacao_execucoes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- contato_tags
DROP POLICY IF EXISTS "admin_all_tags" ON public.contato_tags;
CREATE POLICY "admin_all_tags" ON public.contato_tags
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- indicacoes: a leitura do próprio usuário continua pela policy user_own_indicacoes.
-- Aqui só restringimos a policy administrativa que estava com USING(true).
DROP POLICY IF EXISTS "admin_all_indicacoes" ON public.indicacoes;
CREATE POLICY "admin_all_indicacoes" ON public.indicacoes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

COMMIT;

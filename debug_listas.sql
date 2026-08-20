-- Debug: Verificar se as tabelas existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('listas_contatos', 'contatos_lista');

-- Debug: Verificar dados em listas_contatos
SELECT id, nome, quantidade_contatos, created_by FROM public.listas_contatos;

-- Debug: Verificar dados em contatos_lista
SELECT id, lista_id, telefone, nome FROM public.contatos_lista LIMIT 10;

-- Debug: Verificar policies
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename IN ('listas_contatos', 'contatos_lista');

-- Debug: Ver seu user ID
SELECT auth.uid();

-- Debug: Verificar se você é admin
SELECT * FROM public.user_roles 
WHERE user_id = auth.uid() AND role = 'admin';

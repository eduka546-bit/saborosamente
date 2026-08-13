-- Garante que usuários autenticados podem inserir e atualizar o próprio perfil
GRANT INSERT ON public.profiles TO authenticated;

-- Política de INSERT (necessária para upsert funcionar)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Recria a política de UPDATE com permissão explícita
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Este script configura a role de admin para o usuário
-- Execute no Supabase SQL Editor

-- Opção 1: Se você sabe seu email, use isto:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'seu_email@aqui.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Opção 2: Se preferir, veja todos os usuários primeiro:
-- SELECT id, email FROM auth.users;

-- Depois copie o ID do usuário e use:
-- INSERT INTO public.user_roles (user_id, role) VALUES ('seu_user_id_aqui', 'admin');

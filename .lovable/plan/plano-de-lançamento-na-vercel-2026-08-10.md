# Plano de Lançamento na Vercel

Este plano detalha os passos necessários para configurar o ambiente e realizar o deploy do projeto "Saborosamente" na Vercel, garantindo que a estrutura do TanStack Start funcione corretamente.

## 1. Preparação do Código

- Remover textos de depuração inseridos no `src/routes/__root.tsx`.
- Garantir que a estrutura básica do `<body>` esteja limpa para evitar erros de hidratação.

## 2. Configuração da Vercel

O projeto usa TanStack Start v1, que é compatível com o preset da Vercel para frameworks modernos baseados em Vite.

- **Build Command:** `npm run build` (ou `bun run build`)
- **Output Directory:** `.output` (padrão do TanStack Start)
- **Framework Preset:** Selecionar "Other" ou deixar a Vercel detectar automaticamente.

## 3. Variáveis de Ambiente

As seguintes variáveis devem ser configuradas no painel da Vercel:

- `VITE_SUPABASE_URL`: URL do seu projeto Supabase.
- `VITE_SUPABASE_ANON_KEY`: Chave anônima do seu projeto Supabase.

## 4. Passos para o Usuário

1. Conectar o repositório GitHub à Vercel.
2. Adicionar as variáveis de ambiente mencionadas acima.
3. Executar o Deploy.

## 5. Limpeza de Interface

- Restaurar `src/routes/__root.tsx` para o estado original, removendo a linha "vamos lançar na vercel agora".

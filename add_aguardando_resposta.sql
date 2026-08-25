-- Coluna para pausar uma execução de automação num nó de menu que aguarda
-- a resposta do cliente. A próxima mensagem do cliente retoma o fluxo.
ALTER TABLE public.automacao_execucoes
  ADD COLUMN IF NOT EXISTS aguardando_resposta boolean DEFAULT false;

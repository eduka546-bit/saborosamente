SELECT nome, estoque_200g, estoque_300g, estoque_400g, estoque
FROM public.produtos
WHERE ativo = true
ORDER BY nome;

-- Atualiza o texto da dúvida de Descontos com a versão do dono do negócio.
UPDATE public.agente_respostas_fixas
SET conteudo = 'Você pode escolher quantas Marmitas/Sopas quiser, e o melhor: quanto mais comprar mais barato vai ficando! 🤩

• 5un ou + ganha 3% de desconto 🥉
• 10un ou + ganha 5% de desconto 🥈
• 20un ou + ganha 7% de desconto 🥇

Você pode escolher qualquer sabor e quantos quiser de cada tamanho, pode misturar tamanhos e sabores, como preferir. Por exemplo:

Pedindo 2un de 200g (P) + 2un de 300g (M) + 1 Sopa, os valores serão da tabela de 5un — com 3% de desconto em tudo! 💚

Ah, e também temos os combos prontos para deixar sua escolha ainda mais rápida! 😁',
    ativo = true,
    updated_at = now()
WHERE chave = 'duvida_descontos';

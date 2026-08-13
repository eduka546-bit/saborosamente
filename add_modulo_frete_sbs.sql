-- Adiciona módulo de frete promocional São Bento do Sul
INSERT INTO public.agente_modulos (nome, categoria, conteudo, ativo, ordem)
VALUES (
  'Frete promocional São Bento do Sul',
  'entregas',
  'REGRA ESPECIAL DE FRETE — SÃO BENTO DO SUL:

Quando o cliente de São Bento do Sul pedir 5 ou mais unidades (qualquer combinação de marmitas, sopas, combos ou outros produtos), o frete é de apenas **R$ 5,00**.

Exemplos que ativam o frete R$ 5,00:
- 5 marmitas → frete R$ 5,00
- 3 marmitas + 2 sopas → frete R$ 5,00
- 1 combo de 5 unidades → frete R$ 5,00
- 4 marmitas + 1 sopa → frete R$ 5,00

Esta regra vale SOMENTE para São Bento do Sul. Para outras cidades, use sempre a taxa normal da tabela de entregas.

Quando o cliente de SBS pedir menos de 5 unidades, informe o frete normal do bairro dele.

Quando atingir 5 unidades, comunique proativamente:
"Ótima notícia! 🎉 Como você está levando 5 ou mais unidades, o frete para São Bento do Sul fica por apenas R$ 5,00!"',
  true,
  23
);

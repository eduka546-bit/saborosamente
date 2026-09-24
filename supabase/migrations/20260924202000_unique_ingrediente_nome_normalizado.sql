-- Evita ingredientes duplicados por diferenças de maiúsculas, acentos e espaços.
-- Ex.: "Brócolis", "brocolis" e "  Brócolis  " passam a representar o mesmo cadastro.

create unique index if not exists cozinha_ingredientes_nome_norm_unique
on public.cozinha_ingredientes (
  lower(
    regexp_replace(
      trim(
        translate(
          nome,
          'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç',
          'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'
        )
      ),
      '\s+',
      ' ',
      'g'
    )
  )
);

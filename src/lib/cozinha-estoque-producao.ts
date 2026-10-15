/** Saldo de marmitas PRONTAS antes de programar nova produção.
 * Combina estoque da loja e estoque da cozinha SEM incluir produções planejadas.
 * Complementos de 150 g não têm coluna própria na estrutura atual.
 */
type Saldo = {
  estoque_200g?: number | null;
  estoque_300g?: number | null;
  estoque_400g?: number | null;
} | null | undefined;

const numeroEstoque = (valor: number | null | undefined): number => {
  const numero = Number(valor ?? 0);
  return Number.isFinite(numero) ? numero : 0;
};

export function consultarEstoquePronto(
  loja: Saldo,
  cozinha: Saldo,
  tamanho: string,
): { loja: number; cozinha: number; total: number } | null {
  if (tamanho !== "200" && tamanho !== "300" && tamanho !== "400") return null;
  const coluna = `estoque_${tamanho}g` as "estoque_200g" | "estoque_300g" | "estoque_400g";
  const quantidadeLoja = numeroEstoque(loja?.[coluna]);
  const quantidadeCozinha = numeroEstoque(cozinha?.[coluna]);
  return {
    loja: quantidadeLoja,
    cozinha: quantidadeCozinha,
    total: quantidadeLoja + quantidadeCozinha,
  };
}

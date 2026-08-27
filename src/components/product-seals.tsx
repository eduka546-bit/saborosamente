// Selos de restrição exibidos nos cantos da foto do produto.
// Renderiza os PNGs em public/ quando os campos sem_gluten / sem_lactose
// estiverem ativos no produto.
// Layout: "Sem Glúten" no canto superior direito, "Sem Lactose" no canto
// inferior direito. Quando só um está ativo, ele fica no seu canto próprio.

interface ProductSealsProps {
  product: { sem_gluten?: boolean; sem_lactose?: boolean } | null | undefined;
  /** Tamanho do selo em px (largura/altura). Padrão 40. */
  size?: number;
}

export function ProductSeals({ product, size = 40 }: ProductSealsProps) {
  if (!product?.sem_gluten && !product?.sem_lactose) return null;

  const selo = (src: string, alt: string) => (
    <img
      src={src}
      alt={alt}
      title={alt}
      width={size}
      height={size}
      className="drop-shadow-md"
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );

  return (
    <>
      {product.sem_gluten && (
        <div className="pointer-events-none absolute right-3 top-3 z-10">
          {selo("/selo-sem-gluten.png", "Sem Glúten")}
        </div>
      )}
      {product.sem_lactose && (
        <div className="pointer-events-none absolute bottom-3 right-3 z-10">
          {selo("/selo-sem-lactose.png", "Sem Lactose")}
        </div>
      )}
    </>
  );
}

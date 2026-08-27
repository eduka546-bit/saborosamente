// Selos de restrição exibidos no canto da foto do produto.
// Renderiza os PNGs em public/ quando os campos sem_gluten / sem_lactose
// estiverem ativos no produto.

interface ProductSealsProps {
  product: { sem_gluten?: boolean; sem_lactose?: boolean } | null | undefined;
  /** Tamanho do selo em px (largura/altura). Padrão 40. */
  size?: number;
  /** Classe extra no container (posicionamento). */
  className?: string;
}

export function ProductSeals({ product, size = 40, className = "" }: ProductSealsProps) {
  if (!product?.sem_gluten && !product?.sem_lactose) return null;

  return (
    <div
      className={`pointer-events-none absolute bottom-3 right-3 z-10 flex gap-1.5 ${className}`}
    >
      {product.sem_gluten && (
        <img
          src="/selo-sem-gluten.png"
          alt="Sem Glúten"
          title="Sem Glúten"
          width={size}
          height={size}
          className="drop-shadow-md"
          style={{ width: size, height: size, objectFit: "contain" }}
        />
      )}
      {product.sem_lactose && (
        <img
          src="/selo-sem-lactose.png"
          alt="Sem Lactose"
          title="Sem Lactose"
          width={size}
          height={size}
          className="drop-shadow-md"
          style={{ width: size, height: size, objectFit: "contain" }}
        />
      )}
    </div>
  );
}

import { isMarmita, isNoDiscount, precoCheioMarmita, type TabelaPrecosMarmita } from "./combo-rules";

export type CatalogProduct = {
  id: string; nome: string; tipo_produto?: string | null; peso?: string | null;
  categoria?: string; categorias?: { nome?: string }; preco?: number | string | null;
  preco_300g?: number | string | null; preco_400g?: number | string | null;
  imagem_url?: string | null; imagem_200g?: string | null; imagem_300g?: string | null;
  imagem_400g?: string | null; controle_estoque?: boolean;
  estoque_200g?: number | null; estoque_300g?: number | null; estoque_400g?: number | null;
};
export type CatalogOrderItem = { productId: string; quantity: number; weight: "200g" | "300g" | "400g"; unitPrice: number };
export type CatalogVariant = { label: string; weight: CatalogOrderItem["weight"]; price: number; stock: number | null; image: string; orderable: boolean };

export const catalogMoney = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const catalogSearch = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function catalogVariants(product: CatalogProduct, tabela: TabelaPrecosMarmita): CatalogVariant[] {
  const tipo = String(product.tipo_produto ?? "").toLowerCase();
  const categoria = product.categorias?.nome || product.categoria || "";
  const combo = tipo === "combo" || /combo/i.test(categoria);
  const marmita = !combo && !["sopa", "complemento", "bebida"].includes(tipo) && isMarmita(product.nome, categoria) && !isNoDiscount(categoria);
  const variant = (label: string, weight: CatalogOrderItem["weight"], rawPrice: unknown): CatalogVariant | null => {
    const price = marmita ? precoCheioMarmita(weight, tabela) || Number(rawPrice) : Number(rawPrice);
    if (!Number.isFinite(price) || price <= 0) return null;
    const stock = product[`estoque_${weight}`];
    return { label, weight, price, stock: product.controle_estoque === false || combo || stock == null ? null : Number(stock),
      image: product[`imagem_${weight}`] || product.imagem_url || "", orderable: !combo };
  };
  let variants: (CatalogVariant | null)[];
  if (tipo === "sopa") variants = [variant("400g", "400g", 18)];
  else if (tipo === "complemento") variants = [variant("150g", "200g", product.preco)];
  else if (tipo === "bebida") variants = [variant(product.peso || "Unidade", "200g", product.preco)];
  else variants = [variant(combo && !product.preco_300g && !product.preco_400g ? (product.peso || "Combo") : "200g", "200g", product.preco),
    ...(Number(product.preco_300g) > 0 ? [variant("300g", "300g", product.preco_300g)] : []),
    ...(Number(product.preco_400g) > 0 ? [variant("400g", "400g", product.preco_400g)] : [])];
  return variants.filter((item): item is CatalogVariant => item !== null);
}

export function catalogMessage(product: CatalogProduct, variant: CatalogVariant): string {
  return `🍽️ *${product.nome}*\n📦 ${variant.label}\n💰 ${variant.orderable ? `${catalogMoney(variant.price)} por unidade` : `A partir de ${catalogMoney(variant.price)}`}\n${variant.stock !== null && variant.stock <= 0 ? "⚠️ Consulte disponibilidade\n" : ""}🛒 Confira no site: https://saborosamente.com/produto/${encodeURIComponent(product.id)}`;
}

/** Meta accepts JPEG/PNG for image messages; catalog photos may be WebP. */
export async function catalogImageFile(url: string): Promise<File> {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Foto indisponível");
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) throw new Error("Foto inválida");
  const image = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível preparar a foto");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!jpeg || jpeg.size > 5 * 1024 * 1024) throw new Error("Foto excede o limite de envio");
    return new File([jpeg], "produto-saborosamente.jpg", { type: "image/jpeg" });
  } finally { image.close(); }
}

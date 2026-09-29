/**
 * Normaliza URLs de imagem.
 *
 * O proxy /img da Vercel foi desativado porque, no adapter atual do TanStack,
 * a rewrite externa não é aplicada de forma confiável em produção e pode
 * transformar imagens válidas do Supabase em 404.
 *
 * As URLs públicas do Supabase Storage já são servidas por CDN e devem ser
 * usadas diretamente.
 */

export function imgUrl(url: string | undefined | null): string {
  return url || "";
}

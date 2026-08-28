/**
 * Converte URLs de imagem do Supabase Storage para usar o proxy da Vercel.
 * Isso reduz o egress do Supabase (as imagens passam pela Vercel que cacheia).
 *
 * URL original: https://lxcgbrovdmpjatywweiv.supabase.co/storage/v1/object/public/produtos/foto.jpg
 * URL proxy:    /img/produtos/foto.jpg
 *
 * URLs que não são do Supabase Storage passam inalteradas.
 */

const SUPABASE_STORAGE_PREFIX =
  "https://lxcgbrovdmpjatywweiv.supabase.co/storage/v1/object/public/";

export function imgUrl(url: string | undefined | null): string {
  if (!url) return "";
  if (url.startsWith(SUPABASE_STORAGE_PREFIX)) {
    return "/img/" + url.slice(SUPABASE_STORAGE_PREFIX.length);
  }
  // Fallback: se a URL já for relativa ou de outro domínio, retorna como está.
  return url;
}

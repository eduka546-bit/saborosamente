/**
 * Utilitário para otimizar URLs de imagens com suporte a WebP, lazy loading e srcset
 * Trabalha com Supabase Storage e CDN
 */

export interface OptimizedImageProps {
  src: string;
  alt: string;
  sizes?: string;
  srcSet?: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
}

/**
 * Gera URL de imagem otimizada com suporte a resize e formato
 * @param url - URL original da imagem
 * @param width - Largura desejada (opcional)
 * @param format - Formato desejado: webp, jpeg, png (padrão: webp)
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  format: 'webp' | 'jpeg' | 'png' = 'webp'
): string {
  if (!url) return '';

  // Se já é uma URL com query params de otimização, retorna como está
  if (url.includes('?')) return url;

  // Supabase storage URLs
  if (url.includes('supabase.co')) {
    // Para Supabase, adicionar transformações de imagem se disponível
    // https://supabase.com/docs/guides/storage/serving/image-transformations
    const params = new URLSearchParams();
    if (width) {
      params.set('width', width.toString());
    }
    params.set('format', format);
    return `${url}?${params.toString()}`;
  }

  return url;
}

/**
 * Gera srcset responsivo para imagem
 * @param url - URL da imagem
 * @param sizes - Tamanhos para gerar (ex: [320, 640, 1280])
 */
export function generateSrcSet(
  url: string,
  sizes: number[] = [320, 640, 1024, 1280]
): string {
  return sizes
    .map((size) => `${getOptimizedImageUrl(url, size, 'webp')} ${size}w`)
    .join(', ');
}

/**
 * Gera sizes attribute para imagem responsiva
 * Padrão: mobile first com breakpoints típicos
 */
export function generateSizes(
  customSizes?: string
): string {
  if (customSizes) return customSizes;

  // Padrão responsivo
  return '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 1280px) 80vw, 1024px';
}

/**
 * Gera picture element com fallback para WebP
 * Retorna objeto com props para usar em componentes
 */
export function getResponsiveImageProps(
  url: string,
  alt: string,
  options?: {
    widths?: number[];
    loading?: 'lazy' | 'eager';
    sizes?: string;
    width?: number;
    height?: number;
  }
): OptimizedImageProps {
  const {
    widths = [320, 640, 1024],
    loading = 'lazy',
    sizes: customSizes,
    width,
    height,
  } = options || {};

  return {
    src: url,
    alt,
    loading,
    sizes: generateSizes(customSizes),
    srcSet: generateSrcSet(url, widths),
    width,
    height,
  };
}

/**
 * Gera URL WebP com fallback JPEG
 * Útil para navegadores que não suportam WebP
 */
export function getWebPUrl(url: string): {
  webp: string;
  fallback: string;
} {
  return {
    webp: getOptimizedImageUrl(url, undefined, 'webp'),
    fallback: getOptimizedImageUrl(url, undefined, 'jpeg'),
  };
}

/**
 * Hook para usar imagens otimizadas em componentes React
 * Exemplo:
 * const { src, srcSet, sizes } = useOptimizedImage(imageUrl, 'alt text')
 */
export function useOptimizedImage(
  url: string,
  alt: string,
  options?: Parameters<typeof getResponsiveImageProps>[2]
): OptimizedImageProps {
  return getResponsiveImageProps(url, alt, options);
}

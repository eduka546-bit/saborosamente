import { ImgHTMLAttributes } from "react";
import { getOptimizedImageUrl, generateSrcSet, generateSizes } from "@/lib/image-optimizer";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  widths?: number[];
  priority?: boolean;
}

/**
 * Componente de imagem otimizada com:
 * - Lazy loading por padrão
 * - Srcset responsivo
 * - Suporte a WebP com fallback JPEG
 * - Sizes atributo para melhor performance
 */
export function OptimizedImage({
  src,
  alt,
  widths = [320, 640, 1024],
  priority = false,
  loading = priority ? 'eager' : 'lazy',
  sizes,
  className,
  ...props
}: OptimizedImageProps) {
  if (!src) return null;

  const webpUrl = getOptimizedImageUrl(src, undefined, 'webp');
  const jpegUrl = getOptimizedImageUrl(src, undefined, 'jpeg');
  const srcSet = generateSrcSet(src, widths);
  const calculatedSizes = sizes || generateSizes();

  return (
    <picture>
      {/* WebP para navegadores modernos */}
      <source
        srcSet={srcSet}
        sizes={calculatedSizes}
        type="image/webp"
      />
      {/* Fallback JPEG */}
      <source
        srcSet={srcSet}
        sizes={calculatedSizes}
        type="image/jpeg"
      />
      {/* Fallback para navegadores antigos */}
      <img
        src={jpegUrl}
        alt={alt}
        loading={loading}
        sizes={calculatedSizes}
        className={className}
        width={props.width}
        height={props.height}
        {...props}
      />
    </picture>
  );
}

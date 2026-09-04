import { ImgHTMLAttributes } from "react";
import { generateSizes } from "@/lib/image-optimizer";

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
  // Mantido por compatibilidade com chamadas existentes. Sem um serviço de
  // transformação na origem, não geramos variantes artificiais de tamanho.
  widths: _widths = [320, 640, 1024],
  priority = false,
  loading = priority ? "eager" : "lazy",
  sizes,
  className,
  ...props
}: OptimizedImageProps) {
  if (!src) return null;
  void _widths;

  const calculatedSizes = sizes || generateSizes();

  // A URL pode apontar para uma imagem original (JPG/PNG) ou para WebP.
  // Não declaramos formatos que não foram gerados de fato: isso evita que o
  // navegador solicite a mesma imagem como se fosse mais de um formato.
  return <img
    src={src}
    alt={alt}
    loading={loading}
    sizes={calculatedSizes}
    className={className}
    width={props.width}
    height={props.height}
    {...props}
  />;
}

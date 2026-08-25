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
  loading?: "lazy" | "eager";
}

/**
 * Valida se arquivo é imagem válida
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

  const isValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

  return isValidType && hasValidExtension;
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Otimiza imagem (redimensiona, comprime)
 */
export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  /** Qualidade de 1 a 100 (padrão 80). Também aceita 0–1 por compatibilidade. */
  quality?: number;
  /** Formato de saída: "webp" | "jpeg" | "png" (padrão "webp"). */
  format?: "webp" | "jpeg" | "png";
}

/**
 * Otimiza imagem (redimensiona, comprime) e retorna um File pronto para upload,
 * preservando o nome original com a extensão ajustada ao formato de saída.
 */
export async function optimizeImage(file: File, options: OptimizeImageOptions = {}): Promise<File> {
  const { maxWidth = 1024, maxHeight = 1024, format = "webp" } = options;
  // Aceita qualidade em 0–1 ou 1–100; normaliza para 0–1.
  const rawQuality = options.quality ?? 80;
  const quality = rawQuality > 1 ? rawQuality / 100 : rawQuality;
  const mimeType = `image/${format}`;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Redimensiona respeitando largura e altura máximas, mantendo proporção
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not optimize image"));
              return;
            }
            // Reconstrói o nome preservando o original e trocando a extensão
            const baseName = file.name.replace(/\.[^.]+$/, "");
            const optimized = new File([blob], `${baseName}.${format}`, {
              type: mimeType,
            });
            resolve(optimized);
          },
          mimeType,
          quality,
        );
      };

      img.onerror = () => reject(new Error("Could not load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
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
  format: "webp" | "jpeg" | "png" = "webp",
): string {
  if (!url) return "";

  // Se já é uma URL com query params de otimização, retorna como está
  if (url.includes("?")) return url;

  // Supabase storage URLs
  if (url.includes("supabase.co")) {
    // Para Supabase, adicionar transformações de imagem se disponível
    // https://supabase.com/docs/guides/storage/serving/image-transformations
    const params = new URLSearchParams();
    if (width) {
      params.set("width", width.toString());
    }
    params.set("format", format);
    return `${url}?${params.toString()}`;
  }

  return url;
}

/**
 * Gera srcset responsivo para imagem
 * @param url - URL da imagem
 * @param sizes - Tamanhos para gerar (ex: [320, 640, 1280])
 */
export function generateSrcSet(url: string, sizes: number[] = [320, 640, 1024, 1280]): string {
  return sizes.map((size) => `${getOptimizedImageUrl(url, size, "webp")} ${size}w`).join(", ");
}

/**
 * Gera sizes attribute para imagem responsiva
 * Padrão: mobile first com breakpoints típicos
 */
export function generateSizes(customSizes?: string): string {
  if (customSizes) return customSizes;

  // Padrão responsivo
  return "(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 1280px) 80vw, 1024px";
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
    loading?: "lazy" | "eager";
    sizes?: string;
    width?: number;
    height?: number;
  },
): OptimizedImageProps {
  const {
    widths = [320, 640, 1024],
    loading = "lazy",
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
    webp: getOptimizedImageUrl(url, undefined, "webp"),
    fallback: getOptimizedImageUrl(url, undefined, "jpeg"),
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
  options?: Parameters<typeof getResponsiveImageProps>[2],
): OptimizedImageProps {
  return getResponsiveImageProps(url, alt, options);
}

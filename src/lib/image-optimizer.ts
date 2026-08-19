/**
 * Otimizador de imagens antes do upload
 * Reduz tamanho em ~70% mantendo qualidade
 */

interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-100
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Otimiza uma imagem comprimindo e redimensionando
 * @param file - Arquivo de imagem
 * @param options - Opções de otimização
 * @returns Promise com arquivo otimizado
 */
export async function optimizeImage(
  file: File,
  options: OptimizationOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 80,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calcular novas dimensões mantendo proporção
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Não foi possível obter contexto do canvas'));
          return;
        }

        // Desenhar imagem otimizada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Não foi possível converter imagem'));
              return;
            }

            // Criar novo arquivo otimizado
            const ext = format === 'webp' ? 'webp' : format;
            const optimizedFile = new File(
              [blob],
              `${file.name.split('.')[0]}.${ext}`,
              { type: `image/${ext}` }
            );

            console.log(
              `Imagem otimizada: ${(file.size / 1024).toFixed(2)}KB → ${(blob.size / 1024).toFixed(2)}KB (${Math.round((1 - blob.size / file.size) * 100)}% redução)`
            );

            resolve(optimizedFile);
          },
          `image/${format}`,
          quality / 100
        );
      };

      img.onerror = () => {
        reject(new Error('Não foi possível carregar a imagem'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Valida se o arquivo é uma imagem
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
  return validTypes.includes(file.type) && file.size > 0;
}

/**
 * Formata tamanho em bytes para unidade legível
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

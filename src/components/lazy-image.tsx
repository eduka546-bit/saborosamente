import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface LazyImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  onLoad?: () => void;
}

export function LazyImage({
  src,
  alt,
  fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23f3f4f6' width='400' height='400'/%3E%3C/svg%3E",
  onLoad,
  className,
  ...props
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(fallback);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!imageRef) return;

    // Usa Intersection Observer para lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Elemento ficou visível, carrega a imagem
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "50px", // Começa a carregar 50px antes de ficar visível
      }
    );

    observer.observe(imageRef);

    return () => {
      if (imageRef) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      onLoad={handleLoad}
      className={cn(
        "transition-opacity duration-300",
        isLoaded ? "opacity-100" : "opacity-75",
        className
      )}
      {...props}
    />
  );
}

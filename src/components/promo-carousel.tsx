import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromoBanner {
  image_url?: string;
  alt?: string;
  link?: string;
}

interface PromoCarouselProps {
  banners: PromoBanner[];
}

export function PromoCarousel({ banners }: PromoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const filteredBanners = banners.filter((b) => b?.image_url);

  // Auto-play carousel
  useEffect(() => {
    if (!autoPlay || filteredBanners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredBanners.length);
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(interval);
  }, [autoPlay, filteredBanners.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? filteredBanners.length - 1 : prev - 1));
    setAutoPlay(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredBanners.length);
    setAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setAutoPlay(false);
  };

  if (filteredBanners.length === 0) return null;

  const currentBanner = filteredBanners[currentIndex];

  const content = (
    <div className="relative w-full h-full overflow-hidden rounded-xl group">
      <img
        src={currentBanner.image_url}
        alt={currentBanner.alt || "Banner promocional"}
        loading="eager"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Overlay gradient no hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

      {/* Controles - Setas */}
      {filteredBanners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            onMouseEnter={() => setAutoPlay(false)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
            aria-label="Banner anterior"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg backdrop-blur-sm hover:bg-white">
              <ChevronLeft size={20} />
            </div>
          </button>

          <button
            onClick={goToNext}
            onMouseEnter={() => setAutoPlay(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95"
            aria-label="Próximo banner"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg backdrop-blur-sm hover:bg-white">
              <ChevronRight size={20} />
            </div>
          </button>
        </>
      )}

      {/* Indicadores de ponto */}
      {filteredBanners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {filteredBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "transition-all duration-300 rounded-full",
                currentIndex === index
                  ? "w-6 h-2 bg-white shadow-lg"
                  : "w-2 h-2 bg-white/40 hover:bg-white/60",
              )}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Badge do número de slides */}
      {filteredBanners.length > 1 && (
        <div className="absolute top-4 right-4 z-20 bg-black/40 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[11px] font-bold">
          {currentIndex + 1} / {filteredBanners.length}
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto">
      {currentBanner.link ? (
        <a
          href={currentBanner.link}
          className="block rounded-xl overflow-hidden shadow-soft border border-border/30 bg-card h-[180px] md:h-[220px]"
        >
          {content}
        </a>
      ) : (
        <div className="block rounded-xl overflow-hidden shadow-soft border border-border/30 bg-card h-[180px] md:h-[220px]">
          {content}
        </div>
      )}
    </div>
  );
}

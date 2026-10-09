import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { imgUrl } from "@/lib/image-proxy";

interface PromoBanner {
  image_url?: string;
  alt?: string;
  link?: string;
}
interface PromoCarouselProps {
  banners: PromoBanner[];
  className?: string;
  fill?: boolean;
}

const AUTOPLAY_MS = 5000;
const PAUSA_INTERACAO_MS = 7000;

export function PromoCarousel({ banners, className, fill = false }: PromoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [pausadoAte, setPausadoAte] = useState(0);
  const pausaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filteredBanners = banners.filter(b => b?.image_url);
  const total = filteredBanners.length;

  const interromperPorPoucoTempo = useCallback(() => {
    if (pausaTimer.current) clearTimeout(pausaTimer.current);
    setPausadoAte(Date.now() + PAUSA_INTERACAO_MS);
    pausaTimer.current = setTimeout(() => setPausadoAte(0), PAUSA_INTERACAO_MS);
  }, []);

  useEffect(() => () => {
    if (pausaTimer.current) clearTimeout(pausaTimer.current);
  }, []);

  useEffect(() => {
    const sincronizar = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", sincronizar);
    window.addEventListener("pageshow", sincronizar);
    window.addEventListener("focus", sincronizar);
    return () => {
      document.removeEventListener("visibilitychange", sincronizar);
      window.removeEventListener("pageshow", sincronizar);
      window.removeEventListener("focus", sincronizar);
    };
  }, []);

  useEffect(() => {
    if (total <= 1 || !isVisible || pausadoAte > Date.now()) return;
    const timer = setInterval(() => setCurrentIndex(i => (i + 1) % total), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [total, isVisible, pausadoAte]);

  const navegar = (direcao: -1 | 1) => {
    setCurrentIndex(i => (i + direcao + total) % total);
    interromperPorPoucoTempo();
  };
  const irPara = (indice: number) => {
    setCurrentIndex(indice);
    interromperPorPoucoTempo();
  };

  if (!total) return null;
  const currentBanner = filteredBanners[currentIndex % total];
  const tamanho = fill
    ? "h-full rounded-none border-0 shadow-none"
    : "h-[180px] rounded-xl border border-border/30 shadow-soft md:h-[220px]";

  return (
    <div className={cn("w-full max-w-3xl mx-auto", className)}>
      <div className={cn("relative overflow-hidden bg-card group", tamanho)}>
        <img
          src={imgUrl(currentBanner.image_url)}
          alt={currentBanner.alt || "Banner promocional"}
          loading="eager"
          className={cn("absolute inset-0 w-full h-full object-center", fill ? "object-contain" : "object-cover")}
        />

        {/* Somente a parte central abre o destino. Laterais pertencem à navegação. */}
        {currentBanner.link && (
          <a
            href={currentBanner.link}
            aria-label={`Abrir: ${currentBanner.alt || "promoção"}`}
            className="absolute inset-y-0 left-[17%] right-[17%] z-10 block focus-visible:outline-4 focus-visible:outline-primary"
          >
            <span className="sr-only">Abrir promoção</span>
            <span className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-[#075d3a]/90 px-3 py-1.5 text-xs font-semibold text-white shadow-sm opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-sm:opacity-90">
              <ExternalLink size={13}/> Saiba mais
            </span>
          </a>
        )}

        {total > 1 && (
          <>
            {/* Zonas laterais amplas no celular, como stories, sem sobrepor o link central. */}
            <button type="button" aria-label="Banner anterior" onClick={() => navegar(-1)}
              className="absolute inset-y-0 left-0 w-[17%] z-20 flex items-center justify-start pl-1 sm:pl-4 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg transition-transform hover:scale-105 active:scale-95">
                <ChevronLeft size={20}/>
              </span>
            </button>
            <button type="button" aria-label="Próximo banner" onClick={() => navegar(1)}
              className="absolute inset-y-0 right-0 w-[17%] z-20 flex items-center justify-end pr-1 sm:pr-4 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg transition-transform hover:scale-105 active:scale-95">
                <ChevronRight size={20}/>
              </span>
            </button>
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
              {filteredBanners.map((_, index) => (
                <button type="button" key={index} onClick={() => irPara(index)}
                  className={cn("h-2 rounded-full transition-all", currentIndex % total === index
                    ? "w-6 bg-white shadow-lg" : "w-2 bg-white/50 hover:bg-white/80")}
                  aria-label={`Ir para banner ${index + 1}`} aria-current={currentIndex % total === index ? "true" : undefined}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute top-3 right-[19%] z-20 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white">
              {currentIndex % total + 1} / {total}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { createPortal } from "react-dom";
import { Gift, X } from "lucide-react";
import { ProductCard } from "@/components/product-card";

interface CombosProntosModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  allProducts: any[];
}

export function CombosProntosModal({
  isOpen,
  onClose,
  products,
  allProducts,
}: CombosProntosModalProps) {
  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[9000] flex items-end justify-center md:items-center md:p-5">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative flex max-h-[100dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-[2rem] bg-[#fbfaf5] shadow-2xl md:max-h-[92vh] md:rounded-[2rem]">
        <div className="flex shrink-0 items-start justify-between gap-4 bg-[#086e45] px-5 py-4 text-white md:px-7 md:py-5">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/75">
              <Gift size={16} />
              Combinações prontas
            </div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              Combos Prontos
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/80">
              Escolha o combo, selecione o tamanho e depois monte as unidades com os sabores disponíveis.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            aria-label="Fechar combos prontos"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 md:px-7 md:py-7">
          {products.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#edf5e6] text-[#086e45]">
                <Gift size={22} />
              </div>
              <p className="mt-4 text-sm font-semibold text-[#315440]">
                Nenhum combo pronto disponível no momento.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  allProducts={allProducts}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}

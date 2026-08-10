import { useEffect, useState } from "react";
import { X, Tag, ShoppingBag, ArrowRight, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/products";

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: string;
  cartTotal: number;
  cartCount: number;
  discountPercent: number;
  onApplyCoupon: (coupon: string) => void;
}

export function ExitIntentModal({
  isOpen,
  onClose,
  coupon,
  cartTotal,
  cartCount,
  discountPercent,
  onApplyCoupon,
}: ExitIntentModalProps) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  // Animação de entrada
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setVisible(true), 30);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApplyCoupon(coupon);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center px-4 transition-all duration-300",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className={cn(
          "relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transition-all duration-300",
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        )}
      >
        {/* Faixa verde no topo */}
        <div className="bg-[#086e45] px-6 pt-8 pb-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>

          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/10 mb-4">
            <ShoppingBag size={32} className="text-white" />
          </div>

          <h2 className="text-2xl font-black leading-tight mb-1">
            Espera! Não vá embora.
          </h2>
          <p className="text-sm text-white/80 leading-relaxed">
            Você tem{" "}
            <strong className="text-white">
              {cartCount} {cartCount === 1 ? "item" : "itens"}
            </strong>{" "}
            ({formatBRL(cartTotal)}) esperando no seu carrinho.
          </p>
        </div>

        {/* Corpo */}
        <div className="bg-white px-6 py-6 space-y-5">
          {/* Oferta */}
          <div className="rounded-2xl bg-[#086e45]/5 border border-[#086e45]/10 p-4 text-center space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-[#086e45]/60">
              Oferta exclusiva para você
            </p>
            <p className="text-lg font-black text-gray-900">
              10% de desconto na sua compra
            </p>
            <p className="text-xs text-gray-500">
              Use o cupom abaixo antes de finalizar o pedido
            </p>
          </div>

          {/* Cupom */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-3 rounded-xl border-2 border-dashed border-[#086e45]/40 bg-[#086e45]/5 px-4 py-3">
              <Tag size={16} className="text-[#086e45] shrink-0" />
              <span className="font-black text-lg tracking-widest text-[#086e45]">
                {coupon}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center transition-all shrink-0",
                copied
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
              title="Copiar cupom"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          {/* CTA principal */}
          <button
            onClick={handleApply}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#086e45] px-6 py-4 text-sm font-bold text-white hover:bg-[#065a38] transition-colors"
          >
            Aplicar desconto e finalizar
            <ArrowRight size={16} />
          </button>

          {/* Link secundário */}
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
          >
            Não, obrigado. Vou sair sem o desconto.
          </button>
        </div>
      </div>
    </div>
  );
}

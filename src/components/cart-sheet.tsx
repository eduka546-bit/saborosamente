import { Minus, Plus, Trash2, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatBRL } from "@/lib/products";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DiscountProgressWidget } from "./discount-progress-widget";

export function CartSheet({ children }: { children: React.ReactNode }) {
  const {
    lines,
    subtotal,
    discount,
    shipping,
    total,
    setQuantity,
    remove,
    clear,
  } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 rounded-l-[2rem] border-l-0 shadow-2xl">
        <SheetHeader className="p-6 border-b bg-white rounded-tl-[2rem]">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-black text-primary flex items-center gap-2">
              <ShoppingCart size={20} />
              Seu Carrinho
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {lines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="size-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                <ShoppingCart size={40} />
              </div>
              <p className="text-gray-500 font-medium">Seu carrinho está vazio</p>
              <SheetClose asChild>
                <Button variant="outline" className="rounded-full">Continuar comprando</Button>
              </SheetClose>
            </div>
          ) : (
            <>
              <ul className="space-y-4">
                {lines.map(({ product, quantity, weight, subtotal: lineTotal }) => (
                  <li
                    key={`${product.id}-${weight}`}
                    className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <img
                      src={product.imagem}
                      alt={product.nome}
                      className="size-16 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-primary-dark truncate">{product.nome}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                        {weight || product.peso}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 p-1">
                          <button
                            onClick={() => setQuantity(product.id, quantity - 1, weight)}
                            className="size-6 rounded-full hover:bg-white flex items-center justify-center transition-colors"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="text-[11px] font-bold min-w-[12px] text-center">{quantity}</span>
                          <button
                            onClick={() => setQuantity(product.id, quantity + 1, weight)}
                            className="size-6 rounded-full hover:bg-white flex items-center justify-center transition-colors"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <span className="text-xs font-black text-primary">{formatBRL(lineTotal)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => remove(product.id, weight)}
                      className="text-gray-300 hover:text-red-500 transition-colors self-start"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>

              <DiscountProgressWidget className="bg-white" />
              
              <button
                onClick={clear}
                className="text-[10px] font-bold text-gray-400 uppercase hover:text-red-500 transition-colors text-center w-full"
              >
                Limpar carrinho
              </button>
            </>
          )}
        </div>

        {lines.length > 0 && (
          <SheetFooter className="p-6 bg-white border-t border-gray-100 flex-col sm:flex-col gap-4">
            <div className="space-y-2 w-full">
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                <span>Subtotal</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs font-bold text-primary uppercase">
                  <span>Desconto Progressivo</span>
                  <span>-{formatBRL(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black text-primary-dark border-t border-gray-50 pt-2">
                <span>Total</span>
                <span>{formatBRL(subtotal - discount)}</span>
              </div>
              <p className="text-[9px] text-gray-400 font-medium italic text-center">
                * Entrega calculada no checkout
              </p>
            </div>
            <Button asChild className="w-full h-14 rounded-2xl text-base font-black uppercase shadow-lg shadow-primary/20">
              <Link to="/checkout">Finalizar Pedido</Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

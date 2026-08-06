import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";

const links = [
  { to: "/", label: "Início" },
  { to: "/catalogo", label: "Catálogo" },
  { to: "/checkout", label: "Checkout" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-primary bg-background/85 backdrop-blur text-white">
      <div className="bg-primary py-2 px-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] sm:text-xs">
        Peça para entrega ou venha escolher pessoalmente em nossa loja em São Bento do Sul!
      </div>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="grid size-9 place-items-center rounded-full bg-gradient-brand text-primary-foreground">
            <span className="font-script text-lg leading-none">S</span>
          </span>
          <span className="text-lg font-semibold tracking-tight">Saborosamente</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/carrinho"
            aria-label={`Abrir carrinho (${count} itens)`}
            className="relative inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Carrinho</span>
            {count > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-sun px-1.5 text-xs font-black text-sun-foreground">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-full border border-white/20 text-white md:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className={cn("border-t border-white/10 bg-primary md:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="py-3 text-sm font-bold uppercase tracking-wider text-white/80 hover:text-white"
              activeProps={{ className: "text-primary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
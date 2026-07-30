import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-gradient-brand text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-3">
        <div>
          <p className="font-script text-3xl">Saborosamente</p>
          <p className="mt-3 max-w-xs text-sm opacity-85">
            Marmitas congeladas feitas com comida de verdade, congeladas no ponto e entregues
            prontas para o seu dia.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest opacity-80">Navegação</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/" className="opacity-85 hover:opacity-100">
                Início
              </Link>
            </li>
            <li>
              <Link to="/catalogo" className="opacity-85 hover:opacity-100">
                Catálogo
              </Link>
            </li>
            <li>
              <Link to="/carrinho" className="opacity-85 hover:opacity-100">
                Carrinho
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest opacity-80">Contato</h2>
          <ul className="mt-4 space-y-3 text-sm opacity-90">
            <li className="flex items-center gap-2">
              <Phone className="size-4" aria-hidden="true" /> (11) 90000-0000
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4" aria-hidden="true" /> contato@saborosamente.com
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="size-4" aria-hidden="true" /> @saborosamente
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4" aria-hidden="true" /> Entregas em toda a região
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/20 py-5 text-center text-xs opacity-75">
        © {new Date().getFullYear()} Saborosamente. Todos os direitos reservados.
      </div>
    </footer>
  );
}
import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function SiteFooter() {
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").maybeSingle();
      return data;
    }
  });

  const footerBg = settings?.announcement_bg_color || "#086e45";
  const footerText = settings?.announcement_text_color || "#ffffff";

  return (
    <footer style={{ backgroundColor: footerBg, color: footerText }} className="mt-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 md:grid-cols-4">
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
          <h2 className="text-xs font-bold uppercase tracking-widest opacity-80">Atendimento</h2>
          <ul className="mt-4 space-y-3 text-sm opacity-90">
            <li className="flex items-center gap-2 font-bold">
              <Phone className="size-4" aria-hidden="true" /> (47) 99150-7757
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="size-4" aria-hidden="true" /> @saborosamente
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest opacity-80">Localização</h2>
          <p className="mt-4 text-xs leading-relaxed opacity-90">
            Rua Augusto Wunderwald, 7, SaborosaMente Alimentação Saudável São Bento do Sul - Progresso, (Em frente ao Topa Tudo)<br/>
            CEP 89281-060. São Bento do Sul - SC
          </p>
        </div>

        <div className="md:col-span-4">
          <h2 className="text-xs font-bold uppercase tracking-widest opacity-80">Formas de Pagamento</h2>
          <div className="mt-4 flex flex-wrap gap-2">
             {['PIX', 'Cartão', 'Dinheiro', 'VR', 'Alelo'].map(p => (
               <span key={p} className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold">{p}</span>
             ))}
          </div>
        </div>

      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs opacity-75">
        © {new Date().getFullYear()} Saborosamente. Todos os direitos reservados.
      </div>
    </footer>
  );
}

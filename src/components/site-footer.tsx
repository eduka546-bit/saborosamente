import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/saborosamente-logo.png.asset.json";

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
    <footer style={{ backgroundColor: footerBg, color: footerText }} className="mt-24 relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-4">
          <Link to="/" aria-label="Voltar para o início" className="inline-block transition-transform hover:scale-[1.03]">
            <img
              src={logoAsset.url}
              alt="Saborosamente - alimentação saudável"
              className="h-24 w-auto"
              style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.45))" }}
            />
          </Link>
          <p className="max-w-xs text-sm opacity-85 leading-relaxed">
            Marmitas congeladas feitas com comida de verdade, congeladas no ponto e entregues
            prontas para o seu dia.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-6">Navegação</h2>
          <ul className="space-y-3 text-sm font-medium">
            <li>
              <Link to="/" className="opacity-85 hover:opacity-100 transition-opacity">
                Início
              </Link>
            </li>
            <li>
              <a 
                href="#cardapio" 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="opacity-85 hover:opacity-100 transition-opacity"
              >
                Catálogo
              </a>
            </li>
            <li>
              <Link to="/carrinho" className="opacity-85 hover:opacity-100 transition-opacity">
                Carrinho
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-6">Atendimento</h2>
          <ul className="space-y-4 text-sm">
            <li>
              <a 
                href="https://wa.me/5547991507757?text=Olá! Gostaria de fazer um pedido." 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 font-bold hover:translate-x-1 transition-transform"
              >
                <div className="bg-white/10 p-2 rounded-lg">
                  <Phone className="size-4" />
                </div>
                (47) 99150-7757
              </a>
            </li>
            <li>
              <a 
                href="https://instagram.com/saborosamente" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 opacity-85 hover:opacity-100 hover:translate-x-1 transition-all"
              >
                <div className="bg-white/10 p-2 rounded-lg">
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="size-4"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </div>
                @saborosamente
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] opacity-60 mb-6">Localização</h2>
          <div className="space-y-4">
            <a 
              href="https://maps.app.goo.gl/YourActualGoogleMapsLink" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="flex gap-3 text-xs leading-relaxed opacity-85 group-hover:opacity-100 transition-opacity">
                <MapPin className="size-4 shrink-0 mt-0.5" />
                <p>
                  Rua Augusto Wunderwald, 7<br/>
                  Progresso, São Bento do Sul - SC<br/>
                  CEP 89281-060
                </p>
              </div>
            </a>
            
            {/* Mini Map Preview */}
            <div className="w-full h-32 rounded-2xl overflow-hidden border border-white/10 shadow-inner grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3587.234674720619!2d-49.389274!3d-26.221568!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94de1d1b3b3b3b3b%3A0x3b3b3b3b3b3b3b3b!2sRua%20Augusto%20Wunderwald%2C%207%20-%20Progresso%2C%20S%C3%A3o%20Bento%20do%20Sul%20-%20SC!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-4 pt-10 border-t border-white/5">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-6 text-center">Formas de Pagamento</h2>
          <div className="flex flex-wrap justify-center gap-3">
             {['PIX', 'Cartão', 'Dinheiro', 'VR', 'Alelo'].map(p => (
               <span key={p} className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-colors">
                 {p}
               </span>
             ))}
          </div>
        </div>

      </div>
      <div className="border-t border-white/5 py-8 text-center text-[10px] font-bold uppercase tracking-widest opacity-40">
        © {new Date().getFullYear()} Saborosamente. Feito com amor por Lovable.
      </div>
    </footer>
  );
}

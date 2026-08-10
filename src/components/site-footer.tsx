import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logoAsset from "@/assets/saborosamente-logo.png.asset.json";
import {
  defaultCardFlags,
  defaultMealFlags,
  defaultPaymentMethods,
  enabledOrDefault,
} from "@/lib/payment-options";

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

  const methods = enabledOrDefault((settings as any)?.payment_methods, defaultPaymentMethods);
  const cardFlags = enabledOrDefault((settings as any)?.card_flags, defaultCardFlags);
  const mealFlags = enabledOrDefault((settings as any)?.meal_flags, defaultMealFlags);

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

        <div className="md:col-span-4 pt-10 border-t border-white/5 space-y-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-center">Formas de Pagamento</h2>

          {/* Mercado Pago — link */}
          {(() => {
            const mp = methods.find((m) => (m.label || m.name || "").toLowerCase().includes("mercado"));
            if (!mp) return null;
            return (
              <div className="text-center space-y-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-40">Link de Pagamento</p>
                <a
                  href="https://mpago.la/1234"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white px-5 py-2.5 shadow-sm transition-transform hover:scale-105"
                  title="Pagar via Mercado Pago"
                >
                  {mp.icon || (mp as any).logo ? (
                    <img
                      src={mp.icon || (mp as any).logo}
                      alt="Mercado Pago"
                      className="h-7 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-xs font-bold text-neutral-700">Mercado Pago</span>
                  )}
                  <span className="text-xs font-bold text-[#009ee3]">Pagar via link →</span>
                </a>
              </div>
            );
          })()}

          {/* Cartões de Crédito/Débito */}
          {cardFlags.length > 0 && (
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-40 text-center">Cartão de Crédito / Débito</p>
              <div className="flex flex-wrap justify-center gap-3">
                {cardFlags.map((flag) => (
                  <div key={flag.name} className="flex w-20 flex-col items-center gap-1.5">
                    <div
                      title={flag.name}
                      className="flex h-12 w-20 items-center justify-center rounded-xl border border-white/10 bg-white p-2 shadow-sm transition-transform hover:scale-105"
                    >
                      {flag.logo ? (
                        <img src={flag.logo} alt={flag.name} loading="lazy" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-700 text-center leading-tight">{flag.name}</span>
                      )}
                    </div>
                    <span className="w-full text-center text-[9px] font-semibold uppercase leading-tight tracking-wide opacity-60">{flag.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cartões Alimentação / Refeição */}
          {mealFlags.length > 0 && (
            <div className="space-y-3">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-40 text-center">Alimentação / Refeição</p>
              <div className="flex flex-wrap justify-center gap-3">
                {mealFlags.map((flag) => (
                  <div key={flag.name} className="flex w-20 flex-col items-center gap-1.5">
                    <div
                      title={flag.name}
                      className="flex h-12 w-20 items-center justify-center rounded-xl border border-white/10 bg-white p-2 shadow-sm transition-transform hover:scale-105"
                    >
                      {flag.logo ? (
                        <img src={flag.logo} alt={flag.name} loading="lazy" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-700 text-center leading-tight">{flag.name}</span>
                      )}
                    </div>
                    <span className="w-full text-center text-[9px] font-semibold uppercase leading-tight tracking-wide opacity-60">{flag.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
      <div className="border-t border-white/5 py-8 text-center text-[10px] font-bold uppercase tracking-widest opacity-40">
        © 2022 Saborosamente. Feito com amor por{" "}
        <a
          href="https://instagram.com/emf.digital"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:underline hover:opacity-100"
        >
          @emf.digital
        </a>
      </div>
    </footer>
  );
}

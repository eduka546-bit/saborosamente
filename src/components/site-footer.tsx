import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Clock, Leaf, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  defaultCardFlags,
  defaultMealFlags,
  defaultPaymentMethods,
  enabledOrDefault,
} from "@/lib/payment-options";

// URL pública do CDN da Lovable para a logo
const LOGO_URL =
  "https://assets.lovable.dev/a/v1/2243a82c-49d6-4af9-887d-485d4661259d/fd470ffb-641c-4979-acb2-e05ec52a30be/saborosamente-logo.png";

// Link real do Google Maps
const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Rua+Augusto+Wunderwald,+7,+Progresso,+São+Bento+do+Sul,+SC";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function LogoCard({ logo, name }: { logo?: string; name: string }) {
  return (
    <div title={name} className="group flex flex-col items-center gap-1.5">
      <div className="flex h-11 w-[4.5rem] items-center justify-center rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5 transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
        {logo ? (
          <img src={logo} alt={name} loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <span className="text-[8px] font-black uppercase tracking-wide text-neutral-600 text-center leading-tight">
            {name}
          </span>
        )}
      </div>
      <span className="text-[8px] font-semibold uppercase tracking-wide opacity-50 text-center leading-tight max-w-[4.5rem]">
        {name}
      </span>
    </div>
  );
}

export function SiteFooter() {
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const bg = settings?.announcement_bg_color || "#086e45";
  const text = settings?.announcement_text_color || "#ffffff";
  const logoUrl = (settings as any)?.footer_logo_url
    || (settings as any)?.profile_image_url
    || LOGO_URL;
  const whatsapp = (settings as any)?.footer_whatsapp || "5547991507757";
  const instagram = (settings as any)?.footer_instagram || "saborosamente.sbs";
  const addressLine1 = (settings as any)?.footer_address_line1 || "Rua Augusto Wunderwald, 7";
  const addressLine2 = (settings as any)?.footer_address_line2 || "Progresso — São Bento do Sul/SC";
  const addressCep = (settings as any)?.footer_address_cep || "CEP 89281-060";
  const mapsUrl = (settings as any)?.footer_maps_url || MAPS_URL;
  const description = (settings as any)?.footer_description || "Comida de verdade, congelada no ponto certo e entregue na sua porta.";
  const credit = (settings as any)?.footer_credit || "@emf.digital";

  const methods = enabledOrDefault((settings as any)?.payment_methods, defaultPaymentMethods);
  const cardFlags = enabledOrDefault((settings as any)?.card_flags, defaultCardFlags);
  const mealFlags = enabledOrDefault((settings as any)?.meal_flags, defaultMealFlags);

  const mercadoPago = methods.find((m) =>
    (m.label || (m as any).name || "").toLowerCase().includes("mercado")
  );

  return (
    <footer style={{ backgroundColor: bg, color: text }} className="relative mt-24 overflow-hidden">
      {/* faixa decorativa no topo */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* ── corpo principal ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">

          {/* coluna 1 — marca */}
          <div className="space-y-5 lg:col-span-1">
            <Link to="/" aria-label="Início" className="inline-block">
              <img
                src={logoUrl}
                alt="Saborosamente"
                className="h-20 w-auto transition-transform duration-300 hover:scale-[1.03]"
                style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.4))" }}
              />
            </Link>
            <p className="text-sm leading-relaxed opacity-80 max-w-[240px]">
              {description}
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs opacity-70">
                <Leaf size={13} className="shrink-0" />
                <span>Sem conservantes industrializados</span>
              </div>
              <div className="flex items-center gap-2 text-xs opacity-70">
                <ShieldCheck size={13} className="shrink-0" />
                <span>6 meses de validade</span>
              </div>
              <div className="flex items-center gap-2 text-xs opacity-70">
                <Clock size={13} className="shrink-0" />
                <span>Pronto em até 7 minutos</span>
              </div>
            </div>
          </div>

          {/* coluna 2 — navegação */}
          <div className="space-y-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] opacity-50">Navegação</h3>
            <nav>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Início", to: "/" },
                  { label: "Catálogo", to: "/", hash: "cardapio" },
                  { label: "Meu perfil", to: "/perfil" },
                  { label: "Carrinho", to: "/carrinho" },
                  { label: "Checkout", to: "/checkout" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to as any}
                      hash={(item as any).hash}
                      className="group flex items-center gap-2 opacity-75 transition-all hover:opacity-100"
                    >
                      <span className="h-px w-3 bg-current opacity-0 transition-all group-hover:w-5 group-hover:opacity-60" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* coluna 3 — atendimento */}
          <div className="space-y-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] opacity-50">Atendimento</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <a
                  href={`https://wa.me/${whatsapp}?text=Olá! Gostaria de fazer um pedido.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 font-semibold opacity-90 transition-all hover:opacity-100 hover:translate-x-1"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-colors group-hover:bg-white/20">
                    <WhatsAppIcon className="size-4" />
                  </span>
                  <span>(+55) {whatsapp.replace(/^55/, "").replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}</span>
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/saborosamente.sbs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 opacity-80 transition-all hover:opacity-100 hover:translate-x-1"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-colors group-hover:bg-white/20">
                    <InstagramIcon className="size-4" />
                  </span>
                  <span>@saborosamente.sbs</span>
                </a>
              </li>
              <li className="pt-2">
                <div className="flex items-start gap-3 opacity-75 text-xs leading-relaxed">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <Clock size={14} />
                  </span>
                  <div>
                    <p className="font-semibold text-sm mb-0.5">Horário de atendimento</p>
                    <p>Encomendas em tempo integral</p>
                    <p>Entregas: consulte disponibilidade</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* coluna 4 — localização */}
          <div className="space-y-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] opacity-50">Localização</h3>
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 text-xs leading-relaxed opacity-80 transition-opacity hover:opacity-100"
            >
              <MapPin size={15} className="shrink-0 mt-0.5" />
              <address className="not-italic">
                Rua Augusto Wunderwald, 7<br />
                Progresso — São Bento do Sul/SC<br />
                CEP 89281-060
              </address>
            </a>
            <div className="w-full h-36 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3587.234674720619!2d-49.389274!3d-26.221568!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94de1d1b3b3b3b3b%3A0x3b3b3b3b3b3b3b3b!2sRua%20Augusto%20Wunderwald%2C%207%20-%20Progresso%2C%20S%C3%A3o%20Bento%20do%20Sul%20-%20SC!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização Saborosamente"
              />
            </div>
          </div>
        </div>

        {/* ── formas de pagamento ─────────────────────────────────────────── */}
        <div className="mt-16 border-t border-white/10 pt-12 space-y-10">

          {/* dois módulos lado a lado em desktop */}
          <div className="grid gap-10 md:grid-cols-2">

            {/* cartão de crédito/débito + mercado pago */}
            {(cardFlags.length > 0 || mercadoPago) && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 whitespace-nowrap">
                    Cartão de Crédito / Débito
                  </p>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {cardFlags.map((flag) => (
                    <LogoCard key={flag.name} logo={flag.logo} name={flag.name ?? ""} />
                  ))}
                  {mercadoPago && (
                    <div title="Mercado Pago" className="group flex flex-col items-center gap-1.5">
                      <div className="flex h-11 w-[4.5rem] items-center justify-center rounded-xl bg-white p-2 shadow-sm ring-1 ring-black/5 transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
                        {(mercadoPago.icon || (mercadoPago as any).logo) ? (
                          <img src={mercadoPago.icon || (mercadoPago as any).logo} alt="Mercado Pago" loading="lazy" className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-[8px] font-black uppercase tracking-wide text-neutral-600 text-center leading-tight">MP</span>
                        )}
                      </div>
                      <span className="text-[8px] font-semibold uppercase tracking-wide opacity-50 text-center leading-tight max-w-[4.5rem]">
                        Mercado Pago
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* alimentação / refeição */}
            {mealFlags.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-white/10" />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 whitespace-nowrap">
                    Alimentação / Refeição
                  </p>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {mealFlags.map((flag) => (
                    <LogoCard key={flag.name} logo={flag.logo} name={flag.name ?? ""} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── barra inferior ──────────────────────────────────────────────────── */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 sm:flex-row">
          <p className="text-[10px] font-semibold uppercase tracking-widest opacity-40">
            © {new Date().getFullYear()} Saborosamente — Todos os direitos reservados
          </p>
          <a
            href="https://instagram.com/emf.digital"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-semibold uppercase tracking-widest opacity-40 transition-opacity hover:opacity-80"
          >
            Desenvolvido por @emf.digital
          </a>
        </div>
      </div>
    </footer>
  );
}

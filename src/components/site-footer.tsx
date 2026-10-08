import { Link } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { imgUrl } from "@/lib/image-proxy";
import {
  defaultCardFlags,
  defaultMealFlags,
  defaultPaymentMethods,
  enabledOrDefault,
} from "@/lib/payment-options";

const LOGO_URL =
  "https://assets.lovable.dev/a/v1/2243a82c-49d6-4af9-887d-485d4661259d/fd470ffb-641c-4979-acb2-e05ec52a30be/saborosamente-logo.png";

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Rua+Augusto+Wunderwald,+7,+Progresso,+São+Bento+do+Sul,+SC";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function PaymentLogo({ logo, name }: { logo?: string; name: string }) {
  return (
    <div
      title={name}
      className="flex h-9 w-[3.8rem] items-center justify-center rounded-lg bg-white px-2 py-1.5 shadow-sm ring-1 ring-black/5"
    >
      {logo ? (
        <img src={imgUrl(logo)} alt={name} loading="lazy" className="h-full w-full object-contain" />
      ) : (
        <span className="text-sm font-bold leading-tight text-neutral-600">{name}</span>
      )}
    </div>
  );
}

export function SiteFooter() {
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getPublicSiteSettings,
    staleTime: 1000 * 60 * 5,
  });

  const bg = settings?.announcement_bg_color || "#086e45";
  const text = settings?.announcement_text_color || "#ffffff";
  const logoUrl =
    (settings as any)?.footer_logo_url || (settings as any)?.profile_image_url || LOGO_URL;
  const whatsapp = (settings as any)?.footer_whatsapp || "5547991607757";
  const instagram = (settings as any)?.footer_instagram || "saborosamente.sbs";
  const addressLine1 = (settings as any)?.footer_address_line1 || "Rua Augusto Wunderwald, 7";
  const addressLine2 = (settings as any)?.footer_address_line2 || "Progresso — São Bento do Sul/SC";
  const addressCep = (settings as any)?.footer_address_cep || "CEP 89281-060";
  const mapsUrl = (settings as any)?.footer_maps_url || MAPS_URL;
  const description =
    (settings as any)?.footer_description ||
    "Comida de verdade, prática e saborosa para facilitar sua rotina.";
  const credit = (settings as any)?.footer_credit || "@emf.digital";

  const methods = enabledOrDefault((settings as any)?.payment_methods, defaultPaymentMethods);
  const cardFlags = enabledOrDefault((settings as any)?.card_flags, defaultCardFlags);
  const mealFlags = enabledOrDefault((settings as any)?.meal_flags, defaultMealFlags);
  const mercadoPago = methods.find((m) =>
    (m.label || (m as any).name || "").toLowerCase().includes("mercado"),
  );

  const allPaymentLogos = [
    ...cardFlags.map((flag) => ({
      name: flag.name ?? "",
      logo: flag.logo,
    })),
    ...(mercadoPago
      ? [
          {
            name: "Mercado Pago",
            logo: mercadoPago.icon || (mercadoPago as any).logo,
          },
        ]
      : []),
    ...mealFlags.map((flag) => ({
      name: flag.name ?? "",
      logo: flag.logo,
    })),
  ];

  return (
    <footer style={{ backgroundColor: bg, color: text }} className="relative mt-16 overflow-hidden">
      <div className="mx-auto max-w-6xl px-5 py-8 md:px-6 md:py-10">
        <div className="grid gap-8 md:grid-cols-[1.15fr_.8fr_1.25fr] md:gap-10">
          <div className="text-center md:text-left">
            <Link to="/" aria-label="Início" className="inline-block">
              <img
                src={imgUrl(logoUrl)}
                alt="Saborosamente"
                className="mx-auto h-16 w-auto md:mx-0 md:h-[4.5rem]"
                style={{ filter: "drop-shadow(0 3px 10px rgba(0,0,0,0.28))" }}
              />
            </Link>
            <p className="mx-auto mt-3 max-w-[290px] text-sm leading-relaxed opacity-80 md:mx-0">
              {description}
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2 md:hidden">
              <a
                href={`https://wa.me/${whatsapp}?text=Olá! Gostaria de fazer um pedido.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-2 text-sm font-bold"
              >
                <WhatsAppIcon className="size-4" />
                WhatsApp
              </a>
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-2 text-sm font-bold"
              >
                <InstagramIcon className="size-4" />
                Instagram
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-2 text-sm font-bold"
              >
                <MapPin size={15} />
                Como chegar
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <h3 className="text-lg font-semibold opacity-100">Navegação</h3>
            <nav className="mt-4">
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/" hash="cardapio" className="opacity-85 hover:opacity-100">
                    Cardápio
                  </Link>
                </li>
                <li>
                  <Link to="/perfil" className="opacity-85 hover:opacity-100">
                    Meu perfil
                  </Link>
                </li>
                <li>
                  <Link to="/privacidade" className="opacity-85 hover:opacity-100">
                    Privacidade
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="hidden md:block">
            <h3 className="text-lg font-semibold opacity-100">Atendimento</h3>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/${whatsapp}?text=Olá! Gostaria de fazer um pedido.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 font-semibold hover:bg-white/15"
                >
                  <WhatsAppIcon className="size-4" />
                  WhatsApp
                </a>
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 hover:bg-white/15"
                >
                  <InstagramIcon className="size-4" />
                  @{instagram}
                </a>
              </div>

              <div className="flex items-start gap-2 text-sm leading-relaxed opacity-80">
                <Clock size={14} className="mt-0.5 shrink-0" />
                <span>Encomendas em tempo integral · Entregas conforme disponibilidade</span>
              </div>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm leading-relaxed opacity-80 hover:opacity-100"
              >
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span>
                  {addressLine1} · {addressLine2} · {addressCep}
                </span>
              </a>
            </div>
          </div>
        </div>

        <details className="group mt-6 border-t border-white/10 pt-4 md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold">
            <span>Formas de pagamento aceitas</span>
            <span className="text-lg leading-none transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="mt-4 flex flex-wrap gap-2">
            {allPaymentLogos.map((item, index) => (
              <PaymentLogo key={`${item.name}-${index}`} logo={item.logo} name={item.name} />
            ))}
          </div>
        </details>

        <div className="mt-7 hidden border-t border-white/10 pt-5 md:block">
          <div className="grid gap-5 lg:grid-cols-2">
            {(cardFlags.length > 0 || mercadoPago) && (
              <div>
                <p className="mb-3 text-lg font-semibold opacity-100">Crédito / Débito</p>
                <div className="flex flex-wrap gap-2">
                  {cardFlags.map((flag) => (
                    <PaymentLogo key={flag.name} logo={flag.logo} name={flag.name ?? ""} />
                  ))}
                  {mercadoPago && (
                    <PaymentLogo
                      name="Mercado Pago"
                      logo={mercadoPago.icon || (mercadoPago as any).logo}
                    />
                  )}
                </div>
              </div>
            )}

            {mealFlags.length > 0 && (
              <div>
                <p className="mb-3 text-lg font-semibold opacity-100">Alimentação / Refeição</p>
                <div className="flex flex-wrap gap-2">
                  {mealFlags.map((flag) => (
                    <PaymentLogo key={flag.name} logo={flag.logo} name={flag.name ?? ""} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-4 text-center text-sm font-semibold opacity-80 sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} SaborosaMente</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-end">
            <Link to="/privacidade" className="hover:opacity-100">
              Privacidade
            </Link>
            <a
              href={`https://instagram.com/${credit.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-100"
            >
              Desenvolvido por {credit}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

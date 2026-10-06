import { useState } from "react";
import {
  BadgeDollarSign,
  Clock3,
  House,
  MapPin,
  PackageCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type HomeInfoModalKind = "delivery" | "store" | "discount";

type HomeInfoModalProps = {
  kind: HomeInfoModalKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const deliveryCities = [
  {
    name: "São Bento do Sul",
    state: "SC",
    lat: -26.25,
    lon: -49.38,
    labelX: 330,
    labelY: 218,
    labelW: 112,
  },
  {
    name: "Rio Negrinho",
    state: "SC",
    lat: -26.254,
    lon: -49.518,
    labelX: 329,
    labelY: 188,
    labelW: 92,
  },
  {
    name: "Campo Alegre",
    state: "SC",
    lat: -26.213333,
    lon: -49.253333,
    labelX: 327,
    labelY: 246,
    labelW: 96,
  },
  {
    name: "Corupá",
    state: "SC",
    lat: -26.429167,
    lon: -49.263333,
    labelX: 326,
    labelY: 278,
    labelW: 62,
  },
  {
    name: "Mafra",
    state: "SC",
    lat: -26.111389,
    lon: -49.805278,
    labelX: 167,
    labelY: 174,
    labelW: 56,
  },
  {
    name: "Rio Negro",
    state: "PR",
    lat: -26.108,
    lon: -49.798,
    labelX: 151,
    labelY: 204,
    labelW: 76,
  },
  {
    name: "Piên",
    state: "PR",
    lat: -26.1,
    lon: -49.43,
    labelX: 309,
    labelY: 159,
    labelW: 52,
  },
] as const;

const cities = deliveryCities.map((city) => city.name);

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Rua+Augusto+Wunderwald,+7,+Progresso,+São+Bento+do+Sul,+SC";

// Contornos estaduais em projeção comum, derivados de malhas geográficas de PR e SC.
const PR_PATH =
  "M344.5 159.0 L338.8 166.6 L333.6 167.9 L335.5 169.1 L334.4 171.8 L327.9 175.5 L321.2 186.3 L319.9 192.2 L290.8 193.3 L284.5 198.9 L276.6 201.4 L272.0 205.1 L263.4 201.8 L258.2 195.9 L252.7 193.7 L251.2 196.2 L251.0 194.0 L249.3 194.0 L249.5 195.6 L245.6 194.4 L243.8 196.4 L241.3 194.5 L240.8 197.2 L237.3 194.8 L233.3 197.4 L233.7 200.0 L227.7 195.0 L222.6 195.3 L221.4 193.4 L220.4 195.4 L222.4 196.0 L218.4 196.5 L213.4 203.4 L214.1 205.5 L210.4 204.6 L208.1 206.8 L206.5 205.3 L205.0 207.7 L203.3 204.9 L202.8 207.3 L200.1 204.7 L196.1 204.6 L194.8 207.0 L188.0 209.4 L185.1 214.1 L187.4 216.3 L186.4 218.0 L189.3 221.6 L188.6 223.9 L180.6 226.3 L179.6 229.0 L174.9 222.2 L166.9 221.3 L156.6 223.1 L149.8 221.5 L141.1 215.4 L120.3 213.9 L113.6 210.3 L101.1 210.5 L96.1 212.7 L86.5 205.5 L73.2 207.9 L68.7 205.9 L68.2 203.0 L63.7 199.2 L64.1 195.5 L59.0 191.9 L59.6 183.0 L56.3 174.6 L53.4 174.0 L53.0 175.7 L50.3 171.8 L47.0 171.3 L45.8 174.3 L45.4 168.2 L40.6 170.4 L42.1 172.6 L39.3 171.6 L38.4 173.3 L36.5 171.2 L31.6 173.3 L29.3 178.2 L26.2 174.2 L21.3 173.0 L20.0 166.1 L29.4 151.5 L27.9 148.3 L28.8 141.0 L34.6 126.8 L34.5 117.2 L37.9 112.0 L33.8 100.3 L45.8 91.4 L51.8 66.8 L63.7 60.8 L68.9 50.3 L70.4 41.6 L101.9 22.7 L115.1 25.6 L121.2 22.5 L125.3 25.9 L137.8 24.9 L139.2 27.9 L142.5 26.4 L142.9 21.6 L144.9 20.0 L153.3 22.5 L156.8 25.7 L163.5 25.4 L164.3 27.6 L168.8 27.1 L172.2 29.0 L177.8 26.8 L186.9 27.5 L192.6 31.9 L205.6 33.9 L210.4 38.8 L209.8 41.4 L213.2 42.2 L216.9 38.9 L224.6 41.3 L230.9 39.4 L233.1 41.6 L238.0 41.8 L251.0 39.3 L251.3 42.3 L254.8 44.2 L254.2 46.6 L262.7 49.0 L265.8 52.3 L268.4 58.1 L267.9 61.6 L270.2 63.1 L268.7 63.8 L271.4 65.3 L268.2 69.5 L269.7 70.7 L268.8 75.9 L272.2 79.1 L271.6 84.7 L269.2 86.4 L274.1 90.1 L278.2 98.2 L282.8 100.7 L281.8 104.5 L285.4 109.1 L289.5 110.9 L283.8 121.4 L284.4 127.3 L296.3 127.9 L299.3 125.3 L301.6 127.9 L308.1 126.4 L310.6 128.5 L315.5 127.2 L316.4 129.0 L320.3 127.2 L324.5 130.6 L321.2 135.3 L320.3 146.1 L323.8 148.1 L328.8 142.5 L333.2 146.2 L336.9 142.4 L341.6 150.7 L340.1 153.8 L343.6 156.0 L348.0 154.5 L344.5 159.0 Z";

const SC_PATH =
  "M317.8 191.9 L319.7 192.1 L320.4 201.5 L323.1 201.5 L324.8 204.2 L315.1 227.5 L315.9 231.2 L320.2 232.2 L317.3 238.1 L318.4 243.0 L321.1 243.4 L319.3 249.2 L322.0 250.9 L324.1 248.6 L326.2 250.2 L325.1 253.5 L323.6 254.0 L322.9 252.0 L319.0 254.3 L319.7 258.8 L322.4 257.9 L323.2 259.6 L321.8 264.6 L319.0 264.5 L320.2 265.6 L325.3 261.9 L328.6 262.0 L331.4 265.3 L324.4 278.6 L325.3 282.0 L319.4 286.1 L320.8 287.3 L317.9 292.5 L319.5 294.3 L316.3 301.8 L317.2 304.4 L311.5 314.9 L311.6 319.5 L309.0 322.9 L285.1 336.7 L264.2 358.7 L252.1 352.4 L244.1 355.4 L248.0 360.0 L241.1 354.9 L242.9 352.1 L245.2 353.1 L244.2 354.5 L245.6 353.9 L244.9 350.7 L249.1 351.6 L249.1 348.9 L251.7 348.4 L252.8 345.4 L249.5 346.1 L253.8 341.4 L251.3 338.8 L253.0 329.0 L254.5 328.0 L256.0 329.8 L260.3 323.3 L265.1 323.9 L261.5 315.7 L257.8 317.5 L257.0 314.9 L252.6 316.8 L251.2 314.6 L244.9 316.9 L243.5 314.1 L242.0 317.5 L237.5 314.1 L232.6 315.8 L232.1 313.7 L231.0 315.0 L218.7 312.2 L210.6 302.6 L210.5 299.7 L206.3 299.3 L204.9 297.1 L206.3 294.8 L203.6 291.2 L199.1 290.6 L195.7 284.4 L188.0 281.6 L181.1 274.1 L178.5 275.6 L175.7 270.9 L171.8 272.1 L171.1 269.0 L168.9 270.1 L168.6 267.3 L167.7 268.9 L166.0 266.9 L164.0 268.6 L160.3 267.5 L160.4 269.4 L157.8 269.2 L156.9 266.7 L155.8 268.9 L155.3 266.1 L152.2 266.4 L153.4 264.3 L149.9 263.0 L152.8 262.0 L149.8 261.5 L149.4 259.5 L145.5 260.4 L144.4 258.1 L142.0 258.5 L142.0 256.6 L139.9 259.5 L136.5 257.8 L137.7 255.8 L135.3 256.0 L135.4 258.9 L131.6 258.2 L131.3 255.8 L130.6 257.6 L128.4 256.1 L128.4 253.8 L126.1 256.3 L117.1 254.9 L115.9 257.2 L114.8 254.8 L112.8 255.9 L112.1 253.4 L108.5 253.4 L107.6 251.4 L104.3 253.1 L102.6 251.2 L101.7 254.0 L100.9 249.9 L98.4 250.3 L99.1 247.0 L96.8 248.2 L97.0 250.9 L93.9 251.9 L92.7 249.9 L91.2 252.6 L88.5 251.5 L85.1 253.9 L86.0 249.7 L82.0 247.5 L79.7 250.2 L75.6 249.7 L76.0 253.2 L72.5 251.7 L68.6 254.0 L67.4 251.1 L63.8 252.6 L62.0 250.4 L59.1 251.5 L60.9 250.2 L60.0 247.9 L62.0 248.1 L60.7 245.0 L62.9 246.1 L61.6 244.3 L63.4 244.6 L65.4 239.7 L67.2 240.2 L66.0 236.0 L67.7 235.9 L65.2 233.7 L65.8 231.5 L63.6 231.2 L65.0 230.5 L62.9 229.1 L65.0 227.2 L62.8 225.2 L65.4 221.1 L63.7 220.4 L66.0 217.7 L65.3 212.6 L68.6 205.9 L75.8 208.3 L81.9 205.3 L86.5 205.5 L96.1 212.7 L101.2 210.5 L113.6 210.3 L120.3 213.9 L141.1 215.4 L149.8 221.5 L156.6 223.1 L167.0 221.4 L175.2 222.4 L179.6 229.0 L180.6 226.3 L188.6 223.9 L189.3 221.6 L185.2 214.1 L188.0 209.4 L194.9 207.0 L196.1 204.6 L200.1 204.7 L202.8 207.3 L203.3 204.9 L205.0 207.7 L206.5 205.3 L208.1 206.8 L210.4 204.6 L214.1 205.5 L213.4 203.4 L218.6 196.4 L222.4 196.0 L220.4 195.4 L221.3 193.4 L222.6 195.3 L227.7 195.0 L233.7 200.0 L233.3 197.4 L237.3 194.8 L240.8 197.2 L241.3 194.5 L243.8 196.5 L245.6 194.4 L249.5 195.6 L249.2 194.0 L251.0 194.0 L251.2 196.2 L252.7 193.7 L258.2 195.9 L263.4 201.8 L272.0 205.1 L276.7 201.4 L281.1 201.0 L290.8 193.4 L296.8 194.3 L301.5 192.3 L317.8 191.9 Z";

const MAP_BOUNDS = {
  minLon: -54.61979617422125,
  minLat: -29.351365292808357,
  scale: 49.746966572094486,
  width: 560,
  height: 380,
  padding: 20,
};

function projectCity(lon: number, lat: number) {
  return {
    x: MAP_BOUNDS.padding + (lon - MAP_BOUNDS.minLon) * MAP_BOUNDS.scale,
    y:
      MAP_BOUNDS.height -
      MAP_BOUNDS.padding -
      (lat - MAP_BOUNDS.minLat) * MAP_BOUNDS.scale,
  };
}

function BrazilDeliveryMap({
  selectedCity,
  zoomed,
  onSelect,
  onShowRegion,
}: {
  selectedCity: string;
  zoomed: boolean;
  onSelect: (city: string) => void;
  onShowRegion: () => void;
}) {
  const selected = deliveryCities.find((city) => city.name === selectedCity);
  const selectedPoint = selected ? projectCity(selected.lon, selected.lat) : null;

  const zoomWidth = 150;
  const zoomHeight = 104;
  const zoomX = selectedPoint
    ? Math.max(20, Math.min(MAP_BOUNDS.width - zoomWidth - 20, selectedPoint.x - zoomWidth / 2))
    : 0;
  const zoomY = selectedPoint
    ? Math.max(20, Math.min(MAP_BOUNDS.height - zoomHeight - 20, selectedPoint.y - zoomHeight / 2))
    : 0;

  return (
    <div className="overflow-hidden rounded-[1.65rem] border border-[#dfe7d6] bg-[#f4f7ed] p-3 sm:p-4">
      <div className="grid items-center gap-4 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="relative hidden min-h-[310px] lg:block">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 rounded-[2rem] bg-[#eaf2e2]" />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/1/1d/Brazilian_States.PNG"
              alt="Mapa do Brasil por estados"
              className="relative z-10 w-[245px] opacity-75 mix-blend-multiply"
              style={{
                filter:
                  "sepia(1) saturate(1.9) hue-rotate(72deg) brightness(.72) contrast(.9)",
              }}
            />
            <div className="absolute bottom-[52px] right-[35px] size-10 rounded-full bg-[#075636]/15 ring-2 ring-[#075636]/30" />
            <div className="absolute bottom-[61px] right-[44px] size-5 rounded-full bg-[#075636] shadow-md ring-4 ring-white/90" />
          </div>

          <div className="absolute bottom-4 left-3 space-y-2 text-[11px] font-semibold text-[#496557]">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#cbdcc2]" />
              Demais estados
            </div>
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-[#075636]" />
              Paraná + Santa Catarina
            </div>
          </div>
        </div>

        <div className="relative mx-auto aspect-[1.15/1] w-full max-w-[620px] overflow-hidden rounded-[2rem] border border-[#cbdcc2] bg-gradient-to-br from-[#eaf2e2] to-[#dbe9d1] lg:rounded-full">
          <svg
            viewBox="0 0 560 380"
            className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${zoomed ? "opacity-20" : "opacity-100"}`}
            role="img"
            aria-label="Mapa de Paraná e Santa Catarina com as cidades atendidas"
          >
            <path d={PR_PATH} fill="#0b6447" stroke="#f6f8f2" strokeWidth="2.2" />
            <path d={SC_PATH} fill="#075636" stroke="#f6f8f2" strokeWidth="2.2" />

            <text x="130" y="116" fill="rgba(255,255,255,.38)" fontSize="36" fontWeight="800">
              PR
            </text>
            <text x="214" y="307" fill="rgba(255,255,255,.36)" fontSize="36" fontWeight="800">
              SC
            </text>

            {deliveryCities.map((city) => {
              const p = projectCity(city.lon, city.lat);
              const active = city.name === selectedCity;
              const labelCenterX = city.labelX + city.labelW / 2;
              const labelCenterY = city.labelY + 12;

              return (
                <g
                  key={city.name}
                  role="button"
                  tabIndex={0}
                  aria-label={`Selecionar ${city.name}`}
                  onClick={() => onSelect(city.name)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(city.name);
                    }
                  }}
                  className="cursor-pointer outline-none"
                >
                  <line
                    x1={p.x}
                    y1={p.y}
                    x2={labelCenterX}
                    y2={labelCenterY}
                    stroke={active ? "#f6d83d" : "rgba(255,255,255,.62)"}
                    strokeWidth={active ? 2 : 1.25}
                    strokeDasharray={active ? "0" : "3 3"}
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={active ? 9 : 6.5}
                    fill="#f6d83d"
                    stroke="#ffffff"
                    strokeWidth={active ? 3 : 2}
                  />
                  <circle cx={p.x} cy={p.y} r={2.2} fill="#075636" />
                  <rect
                    x={city.labelX}
                    y={city.labelY}
                    width={city.labelW}
                    height="24"
                    rx="12"
                    fill={active ? "#f6d83d" : "#fffef9"}
                    stroke={active ? "#dcbf1f" : "rgba(7,86,54,.12)"}
                    strokeWidth={active ? 1.5 : 1}
                  />
                  <text
                    x={city.labelX + city.labelW / 2}
                    y={city.labelY + 15.5}
                    textAnchor="middle"
                    fill="#173a2d"
                    fontSize={city.name === "São Bento do Sul" ? "8.8" : "9.2"}
                    fontWeight="800"
                  >
                    {city.name}
                  </text>
                </g>
              );
            })}

            {(() => {
              const sbs = deliveryCities[0];
              const p = projectCity(sbs.lon, sbs.lat);
              return (
                <g transform={`translate(${p.x - 15} ${p.y + 17})`}>
                  <circle cx="0" cy="0" r="10" fill="#fffef9" stroke="#075636" strokeWidth="1.5" />
                  <path
                    d="M-5 0 L0 -4.5 L5 0 V5 H1.5 V1.5 H-1.5 V5 H-5 Z"
                    fill="none"
                    stroke="#075636"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })()}
          </svg>

          {zoomed && selected && selectedPoint && (
            <div
              key={selected.name}
              className="absolute inset-3 z-20 animate-in overflow-hidden rounded-[1.7rem] border border-white/70 bg-[#e5efdc] shadow-lg fade-in zoom-in-95 duration-500 lg:rounded-full"
            >
              <svg
                viewBox={`${zoomX} ${zoomY} ${zoomWidth} ${zoomHeight}`}
                className="h-full w-full"
                role="img"
                aria-label={`Visão aproximada de ${selected.name}`}
              >
                <path d={PR_PATH} fill="#0b6447" stroke="#f6f8f2" strokeWidth="0.9" />
                <path d={SC_PATH} fill="#075636" stroke="#f6f8f2" strokeWidth="0.9" />

                {deliveryCities.map((city) => {
                  const p = projectCity(city.lon, city.lat);
                  const active = city.name === selected.name;
                  return (
                    <g key={`zoom-${city.name}`}>
                      {active && (
                        <circle cx={p.x} cy={p.y} r="9" fill="#f6d83d" opacity="0.2">
                          <animate attributeName="r" values="6;13;9" dur="0.65s" repeatCount="1" />
                        </circle>
                      )}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={active ? 3.6 : 1.7}
                        fill="#f6d83d"
                        stroke="#fffef9"
                        strokeWidth={active ? 1.6 : 0.7}
                        opacity={active ? 1 : 0.75}
                      />
                    </g>
                  );
                })}
              </svg>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-4 whitespace-nowrap rounded-full bg-[#f6d83d] px-3 py-1.5 text-[11px] font-extrabold text-[#174229] shadow-md ring-2 ring-white">
                <MapPin className="mr-1 inline-block" size={13} strokeWidth={2.4} />
                {selected.name}
              </div>

              <div className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold text-[#365c49] shadow-sm">
                VISÃO APROXIMADA
              </div>

              <button
                type="button"
                onClick={onShowRegion}
                className="absolute bottom-3 right-3 rounded-full border border-white/70 bg-white/95 px-3 py-1.5 text-[10px] font-extrabold text-[#075636] shadow-sm transition hover:bg-white"
              >
                Ver região inteira
              </button>
            </div>
          )}

          {!zoomed && (
            <div className="absolute right-3 top-3 z-30 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold text-[#365c49] shadow-sm">
              SC + PR
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] font-semibold leading-relaxed text-[#648072]">
        Clique em uma cidade para aproximar a região e conferir a localização.
      </p>
    </div>
  );
}

function formatDeliveryRate(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function DeliveryContent() {
  const {
    selectedCity,
    setSelectedCity,
    selectedBairro,
    setSelectedBairro,
    taxas,
  } = useCart();
  const [mapZoomed, setMapZoomed] = useState(false);

  const cityRates = taxas
    .filter((item: any) => item.ativo !== false && item.cidade === selectedCity)
    .sort((a: any, b: any) =>
      String(a.bairro || "").localeCompare(String(b.bairro || ""), "pt-BR"),
    );

  const selectCity = (city: string) => {
    if (city !== selectedCity) {
      setSelectedBairro("");
    }
    setSelectedCity(city);
    setMapZoomed(true);
  };

  return (
    <>
      <DialogHeader className="pr-8">
        <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-[#e8f1dd] text-[#075636]">
          <Truck size={22} />
        </div>
        <DialogTitle className="font-display text-2xl font-bold text-[#075636]">
          Áreas de Entrega
        </DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-[#587064]">
          Atendemos cidades selecionadas de Santa Catarina e Paraná.
        </DialogDescription>
      </DialogHeader>

      <BrazilDeliveryMap
        selectedCity={selectedCity}
        zoomed={mapZoomed}
        onSelect={selectCity}
        onShowRegion={() => setMapZoomed(false)}
      />

      <div className="flex flex-wrap gap-2">
        {cities.map((city) => {
          const active = selectedCity === city;
          return (
            <button
              key={city}
              type="button"
              onClick={() => selectCity(city)}
              aria-pressed={active}
              className={
                active
                  ? "cursor-pointer rounded-full border border-[#f6d83d] bg-[#f6d83d] px-3 py-2 text-xs font-bold text-[#174229] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  : "cursor-pointer rounded-full border border-[#d6e2cd] bg-[#f7f9f3] px-3 py-2 text-xs font-bold text-[#416150] transition hover:-translate-y-0.5 hover:border-[#9fbd91] hover:bg-white hover:shadow-sm"
              }
            >
              {city}
            </button>
          );
        })}
      </div>

      <div className="rounded-[1.45rem] border border-[#dfe8d7] bg-[#f5f8f1] p-4">
        {!selectedCity ? (
          <div className="flex items-center gap-3 text-sm font-semibold text-[#587064]">
            <MapPin size={18} className="text-[#075636]" />
            Escolha uma cidade acima para ver os bairros atendidos e as taxas.
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#7a8b82]">
                  Bairros e taxas
                </p>
                <h3 className="mt-0.5 text-base font-extrabold text-[#173a2d]">
                  {selectedCity}
                </h3>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#587064] shadow-sm">
                {cityRates.length} {cityRates.length === 1 ? "bairro" : "bairros"}
              </span>
            </div>

            <div className="max-h-52 overflow-y-auto pr-1">
              <div className="grid gap-2 sm:grid-cols-2">
                {cityRates.map((item: any) => {
                  const active = selectedBairro === item.bairro;
                  return (
                    <button
                      key={`${item.cidade}-${item.bairro}`}
                      type="button"
                      onClick={() => setSelectedBairro(item.bairro)}
                      className={
                        active
                          ? "flex items-center justify-between gap-3 rounded-xl border border-[#e7c81d] bg-[#fff8c9] px-3 py-2.5 text-left shadow-sm"
                          : "flex items-center justify-between gap-3 rounded-xl border border-[#dfe8d7] bg-white px-3 py-2.5 text-left transition hover:border-[#a9c39b] hover:shadow-sm"
                      }
                    >
                      <span className="min-w-0 truncate text-xs font-bold text-[#355546]">
                        {item.bairro}
                      </span>
                      <span
                        className={
                          active
                            ? "shrink-0 rounded-full bg-[#f6d83d] px-2 py-1 text-[10px] font-extrabold text-[#174229]"
                            : "shrink-0 rounded-full bg-[#edf4e7] px-2 py-1 text-[10px] font-extrabold text-[#075636]"
                        }
                      >
                        {formatDeliveryRate(Number(item.taxa || 0))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {cityRates.length === 0 && (
              <p className="text-xs leading-relaxed text-[#607168]">
                Nenhum bairro ativo foi encontrado para esta cidade.
              </p>
            )}

            <p className="mt-3 text-[10px] leading-relaxed text-[#708077]">
              Toque no bairro para deixá-lo selecionado. O valor final do frete considera as regras e promoções aplicáveis ao pedido.
            </p>
          </>
        )}
      </div>
    </>
  );
}

function StoreContent() {
  return (
    <>
      <DialogHeader className="pr-8">
        <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-[#e8f1dd] text-[#075636]">
          <Store size={22} />
        </div>
        <DialogTitle className="font-display text-2xl font-bold text-[#075636]">
          Retire em nossa loja
        </DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-[#587064]">
          Faça seu pedido e retire diretamente na SaborosaMente em São Bento do Sul.
        </DialogDescription>
      </DialogHeader>

      <div className="overflow-hidden rounded-[1.5rem] border border-[#e5e1d4] bg-[#f7f5ed]">
        <img
          src="/loja-saborosamente.jpg"
          alt="Loja física SaborosaMente em São Bento do Sul"
          className="h-52 w-full object-cover sm:h-60"
        />
      </div>

      <div className="grid gap-2.5">
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-3 rounded-2xl border border-[#dde6d7] bg-white px-4 py-3 transition hover:bg-[#f8faf5]"
        >
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf4e7] text-[#075636]">
            <MapPin size={17} />
          </span>
          <span>
            <strong className="block text-sm text-[#173a2d]">Rua Augusto Wunderwald, 7</strong>
            <span className="mt-0.5 block text-xs leading-relaxed text-[#607168]">
              Progresso — São Bento do Sul/SC · CEP 89281-060
            </span>
          </span>
        </a>

        <div className="flex items-start gap-3 rounded-2xl border border-[#dde6d7] bg-white px-4 py-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf4e7] text-[#075636]">
            <Clock3 size={17} />
          </span>
          <span>
            <strong className="block text-sm text-[#173a2d]">Horário da loja</strong>
            <span className="mt-0.5 block text-xs leading-relaxed text-[#607168]">
              Seg–Sex 9h30–19h · Sáb 9h30–13h
            </span>
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-[#075636] px-4 py-3 text-white">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10">
            <PackageCheck size={17} />
          </span>
          <span className="text-sm font-bold">Encomendas em tempo integral</span>
        </div>
      </div>
    </>
  );
}

function DiscountContent() {
  const tiers = [
    { qty: "5+", title: "Primeira faixa", text: "Já começa a economizar" },
    { qty: "10+", title: "Mais economia", text: "Melhor valor por unidade" },
    { qty: "20+", title: "Melhor faixa", text: "Maior benefício do combo" },
  ];

  return (
    <>
      <DialogHeader className="pr-8">
        <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-[#fff4bf] text-[#6e5c00]">
          <BadgeDollarSign size={22} />
        </div>
        <DialogTitle className="font-display text-2xl font-bold text-[#075636]">
          Como ganhar desconto
        </DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-[#587064]">
          Quanto mais marmitas você colocar no pedido, melhor fica a faixa de preço.
        </DialogDescription>
      </DialogHeader>

      <div className="relative grid grid-cols-3 gap-2">
        <div className="absolute left-[16%] right-[16%] top-5 h-1 rounded-full bg-[#e2ead9]" />
        {tiers.map((tier, index) => (
          <div key={tier.qty} className="relative z-10 text-center">
            <div
              className={
                index === 2
                  ? "mx-auto grid size-11 place-items-center rounded-full bg-[#075636] text-sm font-extrabold text-white shadow-sm"
                  : index === 1
                    ? "mx-auto grid size-11 place-items-center rounded-full bg-[#91b93a] text-sm font-extrabold text-white shadow-sm"
                    : "mx-auto grid size-11 place-items-center rounded-full bg-[#f6d83d] text-sm font-extrabold text-[#174229] shadow-sm"
              }
            >
              {tier.qty}
            </div>
            <p className="mt-2 text-xs font-extrabold text-[#173a2d]">{tier.title}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-[#6b7a72]">{tier.text}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.4rem] border border-[#dfe8d7] bg-[#f5f8f1] p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f1dd] text-[#075636]">
            <ShoppingBag size={18} />
          </span>
          <div>
            <p className="text-sm font-extrabold text-[#173a2d]">Desconto progressivo automático</p>
            <p className="mt-1 text-xs leading-relaxed text-[#607168]">
              Não precisa de código: ao aumentar a quantidade do pedido, o site aplica a faixa correspondente automaticamente.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.4rem] bg-[#075636] p-4 text-white">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10">
            <House size={18} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-white/70">São Bento do Sul</p>
            <p className="mt-1 text-sm font-extrabold leading-relaxed">
              Frete R$ 5,00 para pedidos acima de 5 marmitas ou R$ 100,00.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export function HomeInfoModal({ kind, open, onOpenChange }: HomeInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[92vh] w-[calc(100%-1.25rem)] gap-4 overflow-y-auto rounded-[1.9rem] border-[#e1e6db] bg-[#fffef9] p-5 shadow-2xl sm:p-6 ${kind === "delivery" ? "max-w-4xl" : "max-w-xl"}`}>
        {kind === "delivery" ? (
          <DeliveryContent />
        ) : kind === "store" ? (
          <StoreContent />
        ) : (
          <DiscountContent />
        )}
      </DialogContent>
    </Dialog>
  );
}

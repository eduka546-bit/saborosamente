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

const cities = [
  "São Bento do Sul",
  "Rio Negrinho",
  "Campo Alegre",
  "Corupá",
  "Mafra",
  "Rio Negro",
  "Piên",
];

const MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Rua+Augusto+Wunderwald,+7,+Progresso,+São+Bento+do+Sul,+SC";

const cityMapPositions: Record<string, { left: string; top: string }> = {
  "São Bento do Sul": { left: "62.5%", top: "76.8%" },
  "Rio Negrinho": { left: "61.7%", top: "76.9%" },
  "Campo Alegre": { left: "63.2%", top: "76.2%" },
  "Corupá": { left: "63.7%", top: "77.7%" },
  "Mafra": { left: "60.6%", top: "76.0%" },
  "Rio Negro": { left: "60.7%", top: "75.3%" },
  "Piên": { left: "61.8%", top: "75.5%" },
};

function BrazilDeliveryMap({ selectedCity }: { selectedCity: string }) {
  const position = cityMapPositions[selectedCity] ?? cityMapPositions["São Bento do Sul"];

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-[#dfe7d6] bg-[#f4f7ed] px-4 py-3">
      <div className="relative mx-auto aspect-square w-full max-w-[360px]">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/1/1d/Brazilian_States.PNG"
          alt="Mapa do Brasil dividido por estados"
          className="h-full w-full object-contain opacity-80"
        />

        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-full transition-all duration-300"
          style={{ left: position.left, top: position.top }}
        >
          <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f6d83d] px-2.5 py-1.5 text-[10px] font-extrabold text-[#174229] shadow-md ring-2 ring-white">
            <MapPin size={13} strokeWidth={2.4} />
            {selectedCity}
          </div>
          <div className="mx-auto h-0 w-0 border-x-[5px] border-t-[7px] border-x-transparent border-t-[#f6d83d]" />
        </div>

        <div
          className="absolute z-10 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#075636] shadow-sm transition-all duration-300"
          style={{ left: position.left, top: position.top }}
          aria-hidden="true"
        />
      </div>

      <div className="absolute right-3 top-3 rounded-full border border-[#d4dfc9] bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#527164] shadow-sm">
        SC + PR
      </div>
    </div>
  );
}

function DeliveryContent() {
  const { selectedCity, setSelectedCity } = useCart();

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

      <BrazilDeliveryMap selectedCity={selectedCity} />

      <div className="flex flex-wrap gap-2">
        {cities.map((city) => {
          const active = selectedCity === city;
          return (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
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

      <div className="rounded-2xl bg-[#eef5e8] px-4 py-3 text-xs leading-relaxed text-[#476457]">
        Você confirma bairro, taxa e disponibilidade no checkout.
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
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.25rem)] max-w-xl gap-4 overflow-y-auto rounded-[1.9rem] border-[#e1e6db] bg-[#fffef9] p-5 shadow-2xl sm:p-6">
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

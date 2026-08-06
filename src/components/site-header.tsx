import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, User, MapPin, Sparkles, MessageSquare, X } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const links = [
  { to: "/catalogo", label: "Cardápio", icon: Menu, type: "link" },
  { to: "#", label: "Áreas de entrega", icon: MapPin, type: "modal" },
  { to: "/", label: "Cashback", icon: Sparkles, type: "link" },
  { to: "/", label: "Fale conosco", icon: MessageSquare, type: "link" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const queryClient = useQueryClient();
  const [openDeliveryModal, setOpenDeliveryModal] = useState(false);

  const { data: areas, isLoading } = useQuery({
    queryKey: ["delivery-areas"],
    queryFn: async () => {
      // Prioridade 1: Buscar do Supabase se houver tabela
      const { data, error } = await supabase
        .from("delivery_rates")
        .select("*")
        .order("city", { ascending: true })
        .order("neighborhood", { ascending: true });
      
      if (!error && data && data.length > 0) return data;

      // Prioridade 2: Fallback para dados mockados (mesmos do cart.tsx) para garantir que sempre mostre algo
      // Importar os dados ou defini-los aqui
      return [
        { id: 1, neighborhood: "Centro (SBS)", rate: 8.90, city: "São Bento do Sul" },
        { id: 2, neighborhood: "Progresso (SBS)", rate: 8.90, city: "São Bento do Sul" },
        { id: 3, neighborhood: "25 de Julho (SBS)", rate: 10.50, city: "São Bento do Sul" },
        { id: 13, neighborhood: "Oxford (SBS)", rate: 11.00, city: "São Bento do Sul" },
        { id: 18, neighborhood: "Serra Alta (SBS)", rate: 13.00, city: "São Bento do Sul" },
        { id: 37, neighborhood: "Centro (RN)", rate: 10.00, city: "Rio Negrinho" },
        { id: 60, neighborhood: "Centro (CA)", rate: 10.00, city: "Campo Alegre" },
      ];
    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").maybeSingle();
      return data;
    }
  });

  const navBg = settings?.nav_bg_color || "#ffffff";
  const navText = settings?.nav_text_color || "#086e45";
  const announceBg = settings?.announcement_bg_color || "#086e45";
  const announceText = settings?.announcement_text_color || "#ffffff";

  return (
    <header className="relative z-50 transition-all duration-300">
      {/* Announcement Bar */}
      <div 
        style={{ backgroundColor: announceBg, color: announceText }}
        className="relative py-2 px-8 text-center text-[10px] font-bold uppercase tracking-wider sm:text-xs z-[60]"
      >
        {settings?.announcement_text || "Peça para entrega ou venha escolher pessoalmente em nossa loja em São Bento do Sul!"}
        <button className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100">✕</button>
      </div>

      {/* Main Navigation Bar (White in the print) */}
      <div 
        style={{ backgroundColor: navBg }}
        className="mx-auto flex h-20 items-center justify-between px-6 lg:px-12 border-b"
      >
        <Link to="/" className="flex items-center gap-2">
           {/* Removido o texto "Saborosamente" conforme solicitado */}
        </Link>

        {/* Navigation Links - Centered options */}
        <nav className="flex-1 flex items-center justify-center gap-4 sm:gap-6 lg:gap-10">
          {links.map((l) => (
            l.type === "modal" ? (
              <button
                key={l.label}
                onClick={() => setOpenDeliveryModal(true)}
                style={{ color: navText }}
                className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-[13px] font-semibold transition-opacity hover:opacity-70 whitespace-nowrap"
              >
                <l.icon size={16} className="opacity-80 hidden sm:block" />
                {l.label}
              </button>
            ) : (
              <Link
                key={l.label}
                to={l.to as any}
                style={{ color: navText }}
                className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-[13px] font-semibold transition-opacity hover:opacity-70 whitespace-nowrap"
              >
                <l.icon size={16} className="opacity-80 hidden sm:block" />
                {l.label}
              </Link>
            )
          ))}
        </nav>

        {/* Right side - User and Cart */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/admin" style={{ color: navText }} className="hover:opacity-70 hidden sm:block">
            <User size={20} />
          </Link>

          <Link
            to="/carrinho"
            className="relative flex items-center justify-center size-10 rounded-full hover:bg-black/5 transition-colors"
            style={{ color: navText }}
          >
            <ShoppingBag size={22} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid min-size-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white shadow-sm">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Hero / Cover Section */}
      <div className="relative w-full overflow-hidden bg-[#086e45]" style={{ backgroundColor: settings?.hero_bg_color || "#086e45" }}>
        {settings?.hero_image_url ? (
          <div className="relative aspect-[21/9] w-full">
            <img 
              src={settings.hero_image_url} 
              alt="Site Banner" 
              className="w-full h-full object-cover opacity-90"
            />
            
            {/* Overlay for features matching the image style */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full max-w-7xl px-6 flex items-center justify-between gap-4">
                {/* Left side text from print could be here, but we focus on badges */}
                <div className="hidden lg:flex items-center gap-12 ml-auto">
                    {settings.hero_features?.map((feature: any, i: number) => (
                      <div key={i} className="flex flex-col items-center text-center text-white">
                        <span className="text-[10px] font-bold opacity-80 uppercase leading-tight">{feature.label}</span>
                        <span className="text-xl font-black">{feature.value}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center text-white px-6">
            <h1 className="text-4xl font-black uppercase tracking-tighter">PRÁTICO & SAUDÁVEL & SABOROSO</h1>
          </div>
        )}
        
        {/* Centralized PFP/Logo that overlaps the next section */}
        {settings?.profile_image_url && (
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-20">
            <div className="size-32 md:size-48 rounded-full border-[8px] border-white bg-white shadow-2xl overflow-hidden ring-4 ring-black/5">
              <img src={settings.profile_image_url} className="w-full h-full object-cover" alt="Profile" />
            </div>
          </div>
        )}
      </div>

      <DeliveryAreasModal 
        open={openDeliveryModal} 
        onOpenChange={setOpenDeliveryModal}
        areas={areas}
        isLoading={isLoading}
      />
    </header>
  );
}

function DeliveryAreasModal({ 
  open, 
  onOpenChange, 
  areas, 
  isLoading 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  areas: any[] | undefined,
  isLoading: boolean
}) {

  const groupedAreas = useMemo(() => {
    if (!areas) return null;
    return (areas as any[]).reduce((acc: any, curr: any) => {
      if (!acc[curr.city]) acc[curr.city] = [];
      acc[curr.city].push(curr);
      return acc;
    }, {});
  }, [areas]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0 overflow-hidden bg-white border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0 flex flex-row items-center justify-between border-b bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <MapPin className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-primary uppercase tracking-tight">Onde entregamos</DialogTitle>
              <p className="text-xs text-muted-foreground font-medium">Confira os bairros atendidos e taxas</p>
            </div>
          </div>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            {groupedAreas && Object.entries(groupedAreas).map(([city, neighborhoods]: [string, any]) => (
              <div key={city} className="space-y-3">
                <h3 className="text-sm font-black text-primary/80 uppercase tracking-widest flex items-center gap-2 border-b pb-1">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {city}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {neighborhoods.map((area: any) => (
                    <div 
                      key={area.id} 
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all group"
                    >
                      <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">{area.neighborhood}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {area.rate === 0 ? "Grátis" : `R$ ${area.rate.toFixed(2).replace(".", ",")}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="py-20 text-center space-y-3">
                <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-muted-foreground font-medium">Carregando áreas de entrega...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

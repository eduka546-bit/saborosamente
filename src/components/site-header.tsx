import { Link } from "@tanstack/react-router";
import {
  Menu,
  ShoppingBag,
  User,
  MapPin,
  Sparkles,
  MessageSquare,
  X,
  LogOut,
  Lock,
  Gift,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { imgUrl } from "@/lib/image-proxy";
import { useCart } from "@/lib/cart";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CartSheet } from "./cart-sheet";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const links = [
  { to: "/", hash: "cardapio", label: "Cardápio", icon: Menu, type: "link" },
  { to: "#", label: "Áreas de entrega", icon: MapPin, type: "modal" },
  { to: "/perfil", hash: "cashback", label: "Cashback", icon: Sparkles, type: "link" },
  { to: "/meus-pedidos", label: "Meus Pedidos", icon: ShoppingBag, type: "link" },
  { to: "/indicar", label: "Indique e Ganhe", icon: Gift, type: "link" },
  { to: "/fale-conosco", label: "Fale conosco", icon: MessageSquare, type: "link" },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const queryClient = useQueryClient();
  const [openDeliveryModal, setOpenDeliveryModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  useEffect(() => {
    setMounted(true); // Marca que component foi montado no client

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) checkAdminStatus(u.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) checkAdminStatus(u.id);
      else setIsAdmin(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const { data: areas, isLoading } = useQuery({
    queryKey: ["delivery-areas"],
    queryFn: async () => {
      // Prioridade 1: Buscar do Supabase se houver tabela
      const { data, error } = await supabase
        .from("delivery_rates")
        .select("*")
        .eq("ativo", true)
        .order("cidade", { ascending: true })
        .order("bairro", { ascending: true });

      if (!error && data && data.length > 0) {
        // Mapeia para o formato esperado pelo componente
        return data.map((d: any) => ({
          ...d,
          neighborhood: d.bairro,
          city: d.cidade,
          rate: d.valor,
        }));
      }

      // Se o banco estiver indisponível, não exibimos taxas antigas ou estimadas.
      // É mais seguro mostrar a indisponibilidade temporária do que informar um frete incorreto.
      return [];

    },
    staleTime: 1000 * 60 * 60,
  });

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").maybeSingle();
      return data;
    },
    staleTime: 1000 * 60,
  });

  const navBg = settings?.nav_bg_color || "#ffffff";
  const navText = settings?.nav_text_color || "#086e45";
  const announceBg = settings?.announcement_bg_color || "#086e45";
  const announceText = settings?.announcement_text_color || "#ffffff";

  const logoSrc = imgUrl(settings?.logo_url) || "/logo-saborosamente.png";

  const visibleLinks = links.filter((link) => {
    if (link.label === "Cashback" || link.label === "Indique e Ganhe") {
      return settings?.cashback_ativo === true;
    }
    return true;
  });

  return (
    <header className="relative z-[40] transition-all duration-300 pointer-events-none">
      {/* Announcement Bar */}
      {announcementVisible && (
        <div
          style={{ backgroundColor: announceBg, color: announceText }}
          className="relative py-2 px-8 text-center text-[10px] font-bold uppercase tracking-wider sm:text-xs z-[60] pointer-events-auto"
        >
          {settings?.announcement_text ||
            "PEÇA PARA ENTREGA OU VENHA ESCOLHER PESSOALMENTE EM NOSSA LOJA EM SÃO BENTO DO SUL!"}
          <button
            type="button"
            onClick={() => setAnnouncementVisible(false)}
            aria-label="Fechar aviso"
            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Navigation Bar (White in the print) */}
      <div
        style={{ backgroundColor: navBg }}
        className="mx-auto flex h-16 items-center justify-between px-6 lg:px-12 border-b relative z-[70] pointer-events-auto"
      >
        {/* Menu mobile — evita que os links estourem a largura da tela */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              aria-label="Abrir menu"
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-full border border-border"
              style={{ color: navText }}
            >
              <Menu size={20} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80vw] max-w-xs bg-white z-[300]">
            <SheetHeader>
              <SheetTitle className="text-primary font-black uppercase tracking-tight">
                Menu
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {visibleLinks.map((l) =>
                l.type === "modal" ? (
                  <button
                    key={l.label}
                    onClick={() => setOpenDeliveryModal(true)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-foreground hover:bg-secondary text-left"
                  >
                    <l.icon size={18} className="text-primary" />
                    {l.label}
                  </button>
                ) : (
                  <Link
                    key={l.label}
                    to={l.to as any}
                    hash={(l as any).hash}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
                  >
                    <l.icon size={18} className="text-primary" />
                    {l.label}
                  </Link>
                ),
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 md:hidden"
          aria-label="SaborosaMente"
        >
          <img
            src={logoSrc}
            alt="SaborosaMente"
            className="h-9 w-40 object-contain object-center"
          />
        </Link>

        <Link to="/" className="hidden md:flex shrink-0 items-center mr-6" aria-label="SaborosaMente">
          <img src={logoSrc} alt="SaborosaMente" className="h-11 w-48 object-contain object-left" />
        </Link>

        {/* Navigation Links - Centered options */}
        <nav className="hidden flex-1 md:flex items-center justify-center gap-4 sm:gap-6 lg:gap-10">
          {visibleLinks.map((l) =>
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
                hash={(l as any).hash}
                style={{ color: navText }}
                className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-[13px] font-semibold transition-opacity hover:opacity-70 whitespace-nowrap"
              >
                <l.icon size={16} className="opacity-80 hidden sm:block" />
                {l.label}
              </Link>
            ),
          )}
        </nav>

        {/* Right side - User and Cart */}
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary overflow-hidden"
                  style={{ color: navText }}
                >
                  <User size={20} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-2xl p-2 shadow-soft border-border bg-white z-[300]"
              >
                <div className="px-2 py-1.5 mb-1 border-b border-border/50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Sua Conta
                  </p>
                  <p className="text-xs font-medium truncate opacity-70">{user.email}</p>
                </div>
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                  <Link to="/perfil" className="flex items-center gap-2 w-full">
                    <User className="h-4 w-4" />
                    <span className="font-semibold text-xs">Meu Perfil</span>
                  </Link>
                </DropdownMenuItem>
                {mounted && isAdmin && (
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link to="/admin" className="flex items-center gap-2 w-full">
                      <Lock className="h-4 w-4" />
                      <span className="font-semibold text-xs">Painel Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="rounded-xl cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="font-semibold text-xs">Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/auth"
              search={{ redirect: "/" }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
            >
              <User size={20} />
            </Link>
          )}

          <CartSheet>
            <button
              className="relative flex items-center justify-center size-10 rounded-full hover:bg-black/5 transition-colors"
              style={{ color: navText }}
            >
              <ShoppingBag size={22} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 grid min-size-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white shadow-sm">
                  {count}
                </span>
              )}
            </button>
          </CartSheet>
        </div>
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
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  areas: any[] | undefined;
  isLoading: boolean;
}) {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const cities = useMemo(() => {
    if (!areas) return [];
    return Array.from(new Set(areas.map((a) => a.city))).sort();
  }, [areas]);

  const neighborhoods = useMemo(() => {
    if (!areas || !selectedCity) return [];
    return areas
      .filter((a) => a.city === selectedCity)
      .sort((a, b) => a.neighborhood.localeCompare(b.neighborhood));
  }, [areas, selectedCity]);

  // Reset selected city when modal opens
  useEffect(() => {
    if (open && cities.length > 0 && !selectedCity) {
      setSelectedCity(cities[0]);
    }
  }, [open, cities]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden bg-white border-none shadow-2xl">
        <DialogHeader className="p-6 pb-4 flex flex-row items-center justify-between border-b bg-gray-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <MapPin className="text-primary size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-primary uppercase tracking-tight">
                Áreas de Entrega
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-medium">
                Selecione uma cidade para ver os bairros
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Cidades - Sidebar */}
          <div className="w-1/3 border-r bg-gray-50/30 overflow-y-auto shrink-0">
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={cn(
                  "w-full text-left px-6 py-4 text-xs font-black uppercase tracking-wider transition-all border-l-4",
                  selectedCity === city
                    ? "bg-white border-primary text-primary shadow-sm"
                    : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50",
                )}
              >
                {city}
              </button>
            ))}
            {isLoading && cities.length === 0 && (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-gray-100 animate-pulse rounded" />
                ))}
              </div>
            )}
          </div>

          {/* Bairros - Content Area */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {selectedCity ? (
              <>
                <div className="px-6 py-3 bg-primary/5 border-b shrink-0">
                  <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Bairros em {selectedCity}
                  </h3>
                </div>
                <ScrollArea className="flex-1 px-6 py-4">
                  <div className="grid grid-cols-1 gap-2 pb-6">
                    {neighborhoods.map((area: any) => (
                      <div
                        key={area.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-primary/20 hover:shadow-sm transition-all group"
                      >
                        <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                          {area.neighborhood}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {area.rate === 0
                            ? "Grátis"
                            : `R$ ${area.rate.toFixed(2).replace(".", ",")}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground p-12 text-center">
                <div className="space-y-2">
                  <MapPin className="size-8 mx-auto opacity-20" />
                  <p className="text-sm font-medium">
                    Selecione uma cidade ao lado para ver os bairros e taxas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

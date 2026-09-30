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

const OFFICIAL_LOGO_SRC = "data:image/png;base64,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";

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

  const logoSrc = OFFICIAL_LOGO_SRC;

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
          className="relative py-2.5 px-10 text-center text-xs sm:text-[13px] font-bold uppercase tracking-[0.06em] leading-snug z-[60] pointer-events-auto"
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
                className="flex items-center gap-1 sm:gap-2 text-[13px] lg:text-sm font-bold transition-opacity hover:opacity-70 whitespace-nowrap"
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
                className="flex items-center gap-1 sm:gap-2 text-[13px] lg:text-sm font-bold transition-opacity hover:opacity-70 whitespace-nowrap"
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
                  type="button"
                  aria-label="Abrir minha conta"
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
              aria-label="Entrar ou criar conta"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-secondary"
            >
              <User size={20} />
            </Link>
          )}

          <CartSheet>
            <button
              type="button"
              aria-label="Abrir carrinho"
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

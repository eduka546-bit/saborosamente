import { Link, useLocation } from "@tanstack/react-router";
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
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getPublicSiteSettings } from "@/lib/site-settings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HomeInfoModal } from "@/components/home-info-modal";
import { commerceReturnPath } from "@/lib/commerce-return-path";
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
  const location = useLocation();
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

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      return getPublicSiteSettings();
    },
    staleTime: 1000 * 60,
  });

  const navBg = settings?.nav_bg_color || "#ffffff";
  const navText = settings?.nav_text_color || "#086e45";
  const announceBg = settings?.announcement_bg_color || "#086e45";
  const announceText = settings?.announcement_text_color || "#ffffff";

  const logoSrc = "/logo-saborosamente-oficial.png";
  const abrirSorteio = () => window.dispatchEvent(new Event("saborosamente:abrir-sorteio"));

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
          className="relative px-10 py-2.5 text-center text-sm font-medium leading-snug z-[60] pointer-events-auto"
        >
          {settings?.announcement_text ||
            "Peça para entrega ou venha escolher pessoalmente em nossa loja em São Bento do Sul!"}
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
              <SheetTitle className="text-primary font-bold tracking-normal">
                Menu
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {visibleLinks.map((l) =>
                l.type === "modal" ? (
                  <button
                    key={l.label}
                    onClick={() => setOpenDeliveryModal(true)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-foreground hover:bg-secondary text-left"
                  >
                    <l.icon size={18} className="text-primary" />
                    {l.label}
                  </button>
                ) : (
                  <Link
                    key={l.label}
                    to={l.to as any}
                    hash={(l as any).hash}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-foreground hover:bg-secondary"
                  >
                    <l.icon size={18} className="text-primary" />
                    {l.label}
                  </Link>
                ),
              )}
              {settings?.sorteio_ativo && (
                <button type="button" onClick={abrirSorteio}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold text-foreground hover:bg-secondary text-left">
                  <Gift size={18} className="text-primary"/> Participar do sorteio
                </button>
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
                className="flex items-center gap-1 sm:gap-2 text-sm font-semibold transition-opacity hover:opacity-70 whitespace-nowrap"
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
                className="flex items-center gap-1 sm:gap-2 text-sm font-semibold transition-opacity hover:opacity-70 whitespace-nowrap"
              >
                <l.icon size={16} className="opacity-80 hidden sm:block" />
                {l.label}
              </Link>
            ),
          )}
          {settings?.sorteio_ativo && (
            <button type="button" onClick={abrirSorteio} style={{ color: navText }}
              className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-70">
              <Gift size={16} className="opacity-80 hidden sm:block"/> Participar do sorteio
            </button>
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
                  <p className="text-sm font-bold text-muted-foreground tracking-normal">
                    Sua Conta
                  </p>
                  <p className="text-sm font-normal truncate opacity-75">{user.email}</p>
                </div>
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                  <Link to="/perfil" className="flex items-center gap-2 w-full">
                    <User className="h-4 w-4" />
                    <span className="font-semibold text-sm">Meu Perfil</span>
                  </Link>
                </DropdownMenuItem>
                {mounted && isAdmin && (
                  <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                    <Link to="/admin" className="flex items-center gap-2 w-full">
                      <Lock className="h-4 w-4" />
                      <span className="font-semibold text-sm">Painel Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {settings?.sorteio_ativo && (
                  <DropdownMenuItem onClick={abrirSorteio} className="rounded-xl cursor-pointer">
                    <Gift className="h-4 w-4 mr-2" />
                    <span className="font-semibold text-sm">Participar do sorteio</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="rounded-xl cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="font-semibold text-sm">Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/auth"
              search={{ redirect: location.pathname === "/auth"
                ? commerceReturnPath((location.search as Record<string, unknown>).redirect)
                : location.pathname + location.searchStr + (location.hash ? `#${location.hash}` : ""), confirmed: false }}
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
                <span className="absolute -top-1 -right-1 grid min-size-5 place-items-center rounded-full bg-primary px-1.5 text-sm font-bold text-white shadow-sm">
                  {count}
                </span>
              )}
            </button>
          </CartSheet>
        </div>
      </div>

      <HomeInfoModal
        kind="delivery"
        open={openDeliveryModal}
        onOpenChange={setOpenDeliveryModal}
      />
    </header>
  );
}

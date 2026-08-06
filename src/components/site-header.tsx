import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, User, MapPin, Sparkles, MessageSquare } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/catalogo", label: "Cardápio", icon: Menu },
  { to: "/admin/config/taxas", label: "Áreas de entrega", icon: MapPin },
  { to: "#", label: "Cashback", icon: Sparkles },
  { to: "#", label: "Fale conosco", icon: MessageSquare },
] as const;

export function SiteHeader() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

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
    <header className="sticky top-0 z-50 shadow-sm transition-all duration-300">
      {/* Announcement Bar */}
      <div 
        style={{ backgroundColor: announceBg, color: announceText }}
        className="relative py-2 px-8 text-center text-[10px] font-bold uppercase tracking-wider sm:text-xs z-[60]"
      >
        {settings?.announcement_text || "Peça para entrega ou venha escolher pessoalmente em nossa loja em São Bento do Sul!"}
        <button className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100">✕</button>
      </div>

      {/* Main Navigation */}
      <div 
        style={{ backgroundColor: navBg }}
        className="mx-auto flex h-20 items-center justify-between px-6 lg:px-12"
      >
        {/* Logo (Omitido no print, mas mantido para navegação) */}
        <Link to="/" className="flex items-center gap-2">
           {/* Logo could be here, but using placeholder for layout match */}
        </Link>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-10 lg:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              style={{ color: navText }}
              className="flex items-center gap-2 text-[13px] font-semibold transition-opacity hover:opacity-70"
            >
              <l.icon size={18} className="opacity-80" />
              {l.label}
            </Link>
          ))}
          
          <Link to="/admin" style={{ color: navText }} className="hover:opacity-70">
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
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2"
          style={{ color: navText }}
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Hero / Cover Section as requested by user below the menu */}
      {settings?.hero_image_url && (
        <div className="relative w-full overflow-hidden">
          <img 
            src={settings.hero_image_url} 
            alt="Site Banner" 
            className="w-full h-auto object-cover min-h-[200px]"
          />
          
          {/* Centralized PFP/Logo */}
          {settings.profile_image_url && (
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 z-10">
              <div className="size-40 rounded-full border-[6px] border-white bg-white shadow-xl overflow-hidden">
                <img src={settings.profile_image_url} className="w-full h-full object-cover" alt="Profile" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-[100] bg-white lg:hidden">
          <div className="flex h-20 items-center justify-between px-6 border-b">
            <span className="font-bold text-primary">Menu</span>
            <button onClick={() => setOpen(false)} className="text-gray-500">✕ Fechar</button>
          </div>
          <div className="flex flex-col p-6 gap-6">
            {links.map((l) => (
              <Link 
                key={l.label} 
                to={l.to} 
                onClick={() => setOpen(false)}
                className="flex items-center gap-4 text-lg font-bold text-primary"
              >
                <l.icon /> {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

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
  { to: "/", label: "Cashback", icon: Sparkles },
  { to: "/", label: "Fale conosco", icon: MessageSquare },
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

        {/* Navigation Links - Now side-by-side even on mobile */}
        <nav className="flex items-center gap-4 sm:gap-6 lg:gap-10">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              style={{ color: navText }}
              className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-[13px] font-semibold transition-opacity hover:opacity-70 whitespace-nowrap"
            >
              <l.icon size={16} className="opacity-80 hidden sm:block" />
              {l.label}
            </Link>
          ))}
          
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
        </nav>
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
    </header>
  );
}

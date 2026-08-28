import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ClipboardList,
  Users,
  Utensils,
  Ticket,
  CircleDollarSign,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  MessageSquare,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavGroup {
  label: string;
  icon: any;
  items: { label: string; href: string }[];
}

// Fonte única de verdade: usada tanto no menu desktop (hover) quanto no mobile (drawer).
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Pedidos",
    icon: ClipboardList,
    items: [
      { label: "Ver pedidos", href: "/admin/pedidos" },
      { label: "Carrinho abandonado", href: "/admin/pedidos/carrinhos-abandonados" },
    ],
  },
  {
    label: "Clientes",
    icon: Users,
    items: [
      { label: "Ver clientes", href: "/admin/clientes" },
      { label: "Cashback", href: "/admin/cashback" },
      { label: "Feedbacks", href: "/admin/avaliacoes" },
      { label: "Pontuação", href: "/admin/pontuacao" },
    ],
  },
  {
    label: "Cardápio",
    icon: Utensils,
    items: [
      { label: "Cardápio", href: "/admin/produtos" },
      { label: "Combos Monte Você Mesmo", href: "/admin/combos" },
      { label: "Combos Prontos (Sabores)", href: "/admin/combos-prontos" },
      { label: "Categorias", href: "/admin/categorias" },
      { label: "Bebidas (PDV)", href: "/admin/bebidas" },
    ],
  },
  {
    label: "Cupons",
    icon: Ticket,
    items: [{ label: "Ver cupons", href: "/admin/cupons" }],
  },
  {
    label: "Campanhas",
    icon: MessageSquare,
    items: [{ label: "WhatsApp em Massa", href: "/admin/campanhas" }],
  },
  {
    label: "Financeiro",
    icon: CircleDollarSign,
    items: [
      { label: "Lançamentos", href: "/admin/financeiro/lancamentos" },
      { label: "Transações", href: "/admin/financeiro/transacoes" },
      { label: "Configurar Pagamentos", href: "/admin/config/site" },
    ],
  },
  {
    label: "Relatórios",
    icon: BarChart3,
    items: [
      { label: "KPI e indicadores", href: "/admin/relatorios/kpi" },
      { label: "Faturamento e evolução", href: "/admin/relatorios/faturamento" },
      { label: "Pedidos e Vendas", href: "/admin/relatorios/vendas" },
      { label: "Clientes", href: "/admin/relatorios/clientes" },
      { label: "Estoque e produção", href: "/admin/relatorios/estoque" },
      { label: "Comunicação", href: "/admin/relatorios/comunicacao" },
      { label: "Inteligência de mercado", href: "/admin/relatorios/inteligencia" },
    ],
  },
  {
    label: "Configurações",
    icon: Settings,
    items: [
      { label: "Personalizar Site", href: "/admin/config/site" },
      { label: "Fale Conosco / FAQ", href: "/admin/config/faq" },
      { label: "Cashback", href: "/admin/config/cashback-config" },
      { label: "Agente IA (WhatsApp)", href: "/admin/agente" },
      { label: "Respostas do Chatbot", href: "/admin/config/respostas" },
      { label: "Automações WhatsApp", href: "/admin/automacoes" },
      { label: "Unidades", href: "/admin/config/unidades" },
      { label: "Horários e Exceções", href: "/admin/config/horarios" },
      { label: "Entrega (Bairros / Taxas / Área)", href: "/admin/config/taxas" },
      { label: "Informativo", href: "/admin/config/informativo" },
      { label: "Entregador", href: "/admin/config/entregador" },
      { label: "Parâmetros", href: "/admin/config/parametros" },
      { label: "Impressão automática", href: "/admin/config/impressao" },
    ],
  },
];

// ── Item de navegação DESKTOP (abre submenu por hover) ──
function NavItem({ label, icon: Icon, items }: NavGroup) {
  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 text-xs xl:text-sm font-medium text-white/90 transition-colors hover:text-white shrink-0 outline-none cursor-default"
      >
        <Icon size={18} strokeWidth={2.5} />
        <span className="whitespace-nowrap">{label}</span>
        <ChevronDown
          size={14}
          className="ml-0.5 transition-transform duration-200 group-hover:rotate-180"
        />
      </button>

      <div className="absolute left-0 mt-0 w-64 rounded-b-md bg-white py-2 shadow-xl ring-1 ring-black/5 z-[10000] opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
        <div className="py-1">
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href as any}
              className="block px-4 py-2 text-xs xl:text-sm text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors font-medium border-b border-gray-50 last:border-0"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/admin-login";
    }
  };

  return (
    <header className="bg-primary text-white shadow-lg sticky top-0 z-[9999] w-full border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-2 xl:gap-8 py-2 min-w-0">
          {/* Botão do menu mobile — só aparece em telas menores que lg */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                aria-label="Abrir menu"
                className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 border border-white/20 shrink-0"
              >
                <Menu size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto bg-white p-0">
              <SheetHeader className="border-b px-4 py-4">
                <SheetTitle className="text-primary font-black uppercase tracking-tight">
                  Menu Admin
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-2">
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-bold text-primary hover:bg-primary/10"
                >
                  <LayoutHome />
                  Painel (Dashboard)
                </Link>
                {NAV_GROUPS.map((group) => (
                  <div key={group.label} className="mt-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      <group.icon size={14} />
                      {group.label}
                    </div>
                    <div className="flex flex-col">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          to={item.href as any}
                          onClick={() => setMobileOpen(false)}
                          className="rounded-lg px-3 py-2.5 pl-9 text-sm font-medium text-gray-700 hover:bg-primary/10 hover:text-primary"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleLogout}
                  className="mt-4 flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            to="/admin"
            className="flex items-center gap-2 font-bold text-lg xl:text-xl shrink-0 hover:opacity-90 transition-opacity mr-2"
          >
            <div className="h-9 w-9 bg-white/20 rounded-lg flex items-center justify-center border border-white/20">
              <span className="text-white font-black">PD</span>
            </div>
            <span className="tracking-tight">Admin</span>
          </Link>

          {/* Navegação desktop (hover) — escondida no mobile */}
          <nav className="hidden lg:flex items-center">
            {NAV_GROUPS.map((group) => (
              <NavItem key={group.label} {...group} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-auto pl-4">
          <div className="hidden sm:flex flex-col items-end text-[10px] xl:text-xs">
            <span className="font-bold text-white uppercase tracking-wider">Saborosamente</span>
            <span className="text-white/70 font-medium">Painel Gestor</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs xl:text-sm font-semibold hover:bg-white/25 transition-all active:scale-95 border border-white/20"
          >
            <LogOut size={16} strokeWidth={2.5} />
            <span className="hidden lg:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// Ícone simples de "casa" para o item Dashboard no menu mobile
function LayoutHome() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

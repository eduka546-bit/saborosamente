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
  LayoutDashboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface NavItemProps {
  label: string;
  icon: any;
  items?: { label: string; href: string }[];
  active?: boolean;
}

function NavItem({ label, icon: Icon, items, active }: NavItemProps) {
  return (
    <div className="relative group">
      <button
        type="button"
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-xs xl:text-sm font-medium transition-colors hover:text-white shrink-0 outline-none cursor-default",
          active ? "text-white" : "text-white/90"
        )}
      >
        <Icon size={18} strokeWidth={2.5} />
        <span className="whitespace-nowrap">{label}</span>
        {items && <ChevronDown size={14} className="ml-0.5 transition-transform duration-200 group-hover:rotate-180" />}
      </button>

      {items && (
        <div 
          className="absolute left-0 mt-0 w-64 rounded-b-md bg-white py-2 shadow-xl ring-1 ring-black/5 z-[10000] opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto"
        >
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
      )}
    </div>
  );
}

export function AdminHeader() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  };

  return (
    <header className="bg-primary text-white shadow-lg sticky top-0 z-[9999] w-full border-b border-white/10">
      <div className="mx-auto flex h-16 max-w-[1800px] items-center justify-between px-4 gap-4">
        <div className="flex items-center gap-2 xl:gap-8 py-2">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-lg xl:text-xl shrink-0 hover:opacity-90 transition-opacity mr-2">
            <div className="h-9 w-9 bg-white/20 rounded-lg flex items-center justify-center border border-white/20">
              <span className="text-white font-black">PD</span>
            </div>
            <span className="tracking-tight">Admin</span>
          </Link>

          <nav className="flex items-center">
            <NavItem 
              label="Pedidos" 
              icon={ClipboardList} 
              items={[
                { label: "Ver pedidos", href: "/admin/pedidos" },
                { label: "Pedidos por item", href: "/admin/pedidos/itens" },
                { label: "Pedidos por complemento", href: "/admin/pedidos/complementos" },
                { label: "Acompanhamentos solicitados", href: "/admin/pedidos/acompanhamentos" },
                { label: "Avaliações - Média Mensal", href: "/admin/avaliacoes" },
                { label: "Carrinho abandonado", href: "/admin/carrinhos-abandonados" }
              ]} 
            />
            <NavItem 
              label="Clientes" 
              icon={Users} 
              items={[
                { label: "Ver clientes", href: "/admin/clientes" },
                { label: "Cashback", href: "/admin/cashback" },
                { label: "Pontuação", href: "/admin/pontuacao" },
                { label: "Ouvidoria", href: "/admin/ouvidoria" }
              ]} 
            />
            <NavItem 
              label="Cardápio" 
              icon={Utensils} 
              items={[
                { label: "Cardápio", href: "/admin/produtos" },
                { label: "Categorias", href: "/admin/categorias" },
                { label: "Itens de complementos", href: "/admin/complementos" },
                { label: "Acompanhamentos", href: "/admin/acompanhamentos" },
                { label: "Embalagens", href: "/admin/embalagens" }
              ]} 
            />
            <NavItem 
              label="Cupons" 
              icon={Ticket} 
              items={[
                { label: "Ver cupons", href: "/admin/cupons" },
                { label: "Novo cupom", href: "/admin/cupons/novo" }
              ]} 
            />
            <NavItem 
              label="Financeiro" 
              icon={CircleDollarSign} 
              items={[
                { label: "Lançamentos", href: "/admin/financeiro/lancamentos" },
                { label: "Transações", href: "/admin/financeiro/transacoes" }
              ]} 
            />
            <NavItem 
              label="Relatórios" 
              icon={BarChart3} 
              items={[
                { label: "KPI e indicadores", href: "/admin/relatorios/kpi" },
                { label: "Faturamento e evolução", href: "/admin/relatorios/faturamento" },
                { label: "Pedidos e Vendas", href: "/admin/relatorios/vendas" },
                { label: "Clientes", href: "/admin/relatorios/clientes" },
                { label: "Estoque e produção", href: "/admin/relatorios/estoque" },
                { label: "Comunicação", href: "/admin/relatorios/comunicacao" },
                { label: "Inteligência de mercado", href: "/admin/relatorios/inteligencia" }
              ]} 
            />
            <NavItem 
              label="Configurações" 
              icon={Settings} 
              items={[
                { label: "Unidades", href: "/admin/config/unidades" },
                { label: "Horário de funcionamento", href: "/admin/config/horarios" },
                { label: "Exceção de funcionamento", href: "/admin/config/excecoes" },
                { label: "Bairros", href: "/admin/config/bairros" },
                { label: "Taxa e tempo de entrega", href: "/admin/config/taxas" },
                { label: "Área de entrega", href: "/admin/config/area" },
                { label: "Cashback", href: "/admin/config/cashback" },
                { label: "Informativo", href: "/admin/config/informativo" },
                { label: "Entregador", href: "/admin/config/entregador" },
                { label: "Mesas", href: "/admin/config/mesas" },
                { label: "Parâmetros", href: "/admin/config/parametros" },
                { label: "Como nos conheceu", href: "/admin/config/origem" },
                { label: "Impressão automática", href: "/admin/config/impressao" }
              ]} 
            />
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

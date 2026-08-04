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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-xs xl:text-sm font-medium transition-colors hover:text-white shrink-0",
          active ? "text-white" : "text-white/70"
        )}
      >
        <Icon size={18} />
        <span>{label}</span>
        {items && <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />}
      </button>

      {items && isOpen && (
        <div className="absolute left-0 mt-1 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href as any}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
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
    <header className="bg-primary text-white shadow-md sticky top-0 z-[9999] block !visible opacity-100">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4">
        <div className="flex items-center gap-2 xl:gap-6 overflow-x-auto no-scrollbar py-2">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-xl">
            <div className="h-8 w-8 bg-white/20 rounded-md flex items-center justify-center">
              <span className="text-white">PD</span>
            </div>
            <span>Admin</span>
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

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end text-xs">
            <span className="font-semibold text-white">Saborosamente</span>
            <span className="text-white/60">Admin</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20"
          >
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}

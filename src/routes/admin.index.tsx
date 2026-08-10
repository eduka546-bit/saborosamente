import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ClipboardList, 
  Utensils, 
  TrendingUp, 
  Users as UsersIcon,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  console.log("AdminDashboard rendering");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // Executar queries em paralelo para evitar gargalos
      const [
        ordersTodayRes,
        activeProductsRes,
        monthlyOrdersRes,
        recentOrdersRes,
        newClientsRes
      ] = await Promise.all([
        supabase
          .from("pedidos")
          .select("*", { count: 'exact', head: true })
          .gte("created_at", todayStr),
        supabase
          .from("produtos")
          .select("*", { count: 'exact', head: true })
          .eq("status", "Ativo"),
        supabase
          .from("pedidos")
          .select("valor_total")
          .gte("created_at", firstDayOfMonth),
        supabase
          .from("pedidos")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", firstDayOfMonth)
      ]);

      const monthlyRevenue = monthlyOrdersRes.data?.reduce((acc, o) => acc + (o.valor_total || 0), 0) || 0;

      return {
        ordersToday: ordersTodayRes.count || 0,
        activeProducts: activeProductsRes.count || 0,
        monthlyRevenue,
        recentOrders: recentOrdersRes.data || []
      };
    }
  });

  const statusColors: any = {
    'Pendente': 'bg-yellow-100 text-yellow-700',
    'Em preparo': 'bg-blue-100 text-blue-700',
    'Saiu para entrega': 'bg-purple-100 text-purple-700',
    'Entregue': 'bg-green-100 text-green-700',
    'Cancelado': 'bg-red-100 text-red-700',
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:py-12 space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-[#5850ec]">Painel Administrativo</h1>
        <p className="mt-1 text-muted-foreground">
          Bem-vindo ao centro de controle da Saborosamente.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#5850ec]/10 flex items-center justify-center text-[#5850ec]">
              <ClipboardList size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pedidos Hoje</p>
              <p className="text-2xl font-black text-gray-900">{isLoading ? "..." : stats?.ordersToday}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
              <Utensils size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Produtos Ativos</p>
              <p className="text-2xl font-black text-gray-900">{isLoading ? "..." : stats?.activeProducts}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Receita Mensal</p>
              <p className="text-2xl font-black text-gray-900">
                {isLoading ? "..." : `R$ ${stats?.monthlyRevenue.toFixed(2).replace('.', ',')}`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <UsersIcon size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Novos Clientes</p>
              <p className="text-2xl font-black text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Clock className="text-[#5850ec]" size={20} /> Últimos Pedidos
            </h3>
            <button className="text-xs font-bold text-[#5850ec] uppercase hover:underline">Ver todos</button>
          </div>
          <div className="divide-y">
            {stats?.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Nenhum pedido recente</div>
            ) : (
              stats?.recentOrders.map((order: any) => (
                <div key={order.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Package className="text-gray-400" size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">{order.nome_cliente || "Cliente Final"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">R$ {order.valor_total.toFixed(2).replace('.', ',')}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions / Summary */}
        <div className="space-y-6">
          <div className="bg-[#5850ec] rounded-2xl p-6 text-white shadow-lg overflow-hidden relative group">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Acesso Rápido</h3>
              <p className="text-white/80 text-sm mb-6">Gerencie seu negócio de forma eficiente.</p>
              <div className="grid grid-cols-2 gap-4">
                <button className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all border border-white/20 text-left">
                  <CheckCircle2 size={20} className="mb-2" />
                  <p className="text-xs font-bold uppercase tracking-wider">Novo Produto</p>
                </button>
                <button className="bg-white/10 hover:bg-white/20 p-4 rounded-xl transition-all border border-white/20 text-left">
                  <AlertCircle size={20} className="mb-2" />
                  <p className="text-xs font-bold uppercase tracking-wider">Ver Estoque</p>
                </button>
              </div>
            </div>
            {/* Background pattern */}
            <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
          </div>

          <div className="bg-white rounded-2xl border p-6 shadow-sm">
             <h3 className="font-bold text-gray-800 mb-4">Meta de Vendas Mensal</h3>
             <div className="space-y-4">
               <div className="flex justify-between items-end">
                 <div>
                   <p className="text-2xl font-black text-[#5850ec]">45%</p>
                   <p className="text-xs text-gray-400 font-bold uppercase">R$ {stats?.monthlyRevenue.toFixed(2).replace('.', ',')} / R$ 50.000,00</p>
                 </div>
                 <TrendingUp className="text-green-500" size={24} />
               </div>
               <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                 <div className="h-full bg-[#5850ec] rounded-full" style={{ width: '45%' }} />
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

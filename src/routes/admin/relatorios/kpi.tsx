import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, DollarSign, Users, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

export const Route = createFileRoute("/admin/relatorios/kpi")({
  component: AdminRelatoriosKpiPage,
});

const data = [
  { name: 'Jan', vendas: 4000, conversao: 2.4 },
  { name: 'Fev', vendas: 3000, conversao: 1.39 },
  { name: 'Mar', vendas: 2000, conversao: 9.8 },
  { name: 'Abr', vendas: 2780, conversao: 3.9 },
  { name: 'Mai', vendas: 1890, conversao: 4.8 },
  { name: 'Jun', vendas: 2390, conversao: 3.8 },
];

function AdminRelatoriosKpiPage() {
  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">KPI e Indicadores</h1>
        <p className="text-gray-500 text-sm mt-1">Acompanhe as métricas vitais da Saborosamente.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { title: "Ticket Médio", value: "R$ 48,50", icon: DollarSign, trend: "+2.5%" },
          { title: "Taxa de Retenção", value: "68%", icon: Users, trend: "+1.2%" },
          { title: "Taxa de Conversão", value: "3.2%", icon: TrendingUp, trend: "-0.5%" },
          { title: "Churn Rate", value: "4.1%", icon: Package, trend: "+0.1%" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-[#5850ec]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 font-bold">{stat.trend} vs mês anterior</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 className="text-[#5850ec]" size={20} /> Vendas (R$)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="vendas" fill="#5850ec" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="text-[#5850ec]" size={20} /> Conversão (%)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="conversao" stroke="#5850ec" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

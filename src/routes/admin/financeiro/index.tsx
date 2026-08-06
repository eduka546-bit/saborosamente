import { createFileRoute } from "@tanstack/react-router";
import { 
  CircleDollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/admin/financeiro/")({
  component: AdminFinanceiroIndex,
});

const data = [
  { name: '01/08', receita: 4000, despesa: 2400 },
  { name: '02/08', receita: 3000, despesa: 1398 },
  { name: '03/08', receita: 2000, despesa: 9800 },
  { name: '04/08', receita: 2780, despesa: 3908 },
  { name: '05/08', receita: 1890, despesa: 4800 },
  { name: '06/08', receita: 2390, despesa: 3800 },
  { name: '07/08', receita: 3490, despesa: 4300 },
];

function AdminFinanceiroIndex() {
  const [period, setPeriod] = useState("Mensal");

  const exportCSV = () => {
    const headers = "Data,Receita,Despesa,Saldo\n";
    const rows = data.map(d => `${d.name},${d.receita},${d.despesa},${d.receita - d.despesa}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_financeiro_${period.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Financeiro</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de fluxo de caixa e exportação de dados.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none flex items-center gap-2 border-gray-200">
            <Filter size={18} /> Filtros
          </Button>
          <Button onClick={exportCSV} className="flex-1 md:flex-none flex items-center gap-2 bg-[#5850ec] text-white">
            <Download size={18} /> Exportar CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="border-green-100 bg-green-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Receitas Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-green-700">R$ 12.450,00</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1 font-bold">
              <ArrowUpRight size={14} /> +15.3% vs período anterior
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-100 bg-red-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Despesas Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-red-700">R$ 4.280,00</div>
            <div className="flex items-center gap-1 text-xs text-red-600 mt-1 font-bold">
              <ArrowUpRight size={14} /> +2.1% vs período anterior
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-100 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-widest">Saldo Líquido</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-700">R$ 8.170,00</div>
            <div className="flex items-center gap-1 text-xs text-blue-600 mt-1 font-bold">
              <ArrowUpRight size={14} /> +18.7% vs período anterior
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-[#5850ec]" size={20} /> Fluxo de Caixa Diário
          </h3>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {["Semanal", "Mensal", "Anual"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                  period === p ? "bg-white shadow-sm text-[#5850ec]" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="receita" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
              <Area type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDespesa)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

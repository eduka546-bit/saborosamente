import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/admin/relatorios/")({
  component: AdminRelatoriosIndex,
});

function AdminRelatoriosIndex() {
  return (
    <div className="p-8 text-center py-24">
      <BarChart3 size={48} className="mx-auto text-[#5850ec] mb-4 opacity-20" />
      <h2 className="text-xl font-bold text-gray-800">Relatórios e BI</h2>
      <p className="text-gray-500 mt-2">Analise o desempenho da sua loja.</p>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { CircleDollarSign } from "lucide-react";

export const Route = createFileRoute("/admin/financeiro/")({
  component: AdminFinanceiroIndex,
});

function AdminFinanceiroIndex() {
  return (
    <div className="p-8 text-center py-24">
      <CircleDollarSign size={48} className="mx-auto text-[#5850ec] mb-4 opacity-20" />
      <h2 className="text-xl font-bold text-gray-800">Módulo Financeiro</h2>
      <p className="text-gray-500 mt-2">Fluxo de caixa e transações em breve.</p>
    </div>
  );
}

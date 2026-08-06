import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList, Users, Utensils, Ticket, CircleDollarSign, BarChart3, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/pedidos/")({
  component: AdminPedidosIndex,
});

function AdminPedidosIndex() {
  return (
    <div className="p-8 text-center py-24">
      <ClipboardList size={48} className="mx-auto text-[#5850ec] mb-4 opacity-20" />
      <h2 className="text-xl font-bold text-gray-800">Módulo de Pedidos</h2>
      <p className="text-gray-500 mt-2">Selecione uma sub-aba no menu superior.</p>
      <Link to="/admin/pedidos" className="inline-block mt-4 text-[#5850ec] font-bold hover:underline">Ver todos os pedidos</Link>
    </div>
  );
}

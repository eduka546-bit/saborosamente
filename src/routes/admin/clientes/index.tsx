import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

export const Route = createFileRoute("/admin/clientes/")({
  component: AdminClientesIndex,
});

function AdminClientesIndex() {
  return (
    <div className="p-8 text-center py-24">
      <Users size={48} className="mx-auto text-[#5850ec] mb-4 opacity-20" />
      <h2 className="text-xl font-bold text-gray-800">Módulo de Clientes</h2>
      <p className="text-gray-500 mt-2">Consulte e gerencie sua base de usuários.</p>
    </div>
  );
}

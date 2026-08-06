import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/admin/config/")({
  component: AdminConfigIndex,
});

function AdminConfigIndex() {
  return (
    <div className="p-8 text-center py-24">
      <Settings size={48} className="mx-auto text-[#5850ec] mb-4 opacity-20" />
      <h2 className="text-xl font-bold text-gray-800">Configurações Gerais</h2>
      <p className="text-gray-500 mt-2">Ajuste os parâmetros do sistema.</p>
    </div>
  );
}

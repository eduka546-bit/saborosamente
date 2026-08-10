import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/config/bairros")({
  component: AdminConfigBairrosPage,
});

function AdminConfigBairrosPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Bairros Atendidos</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie os bairros e taxas de entrega.</p>
      </div>
      <div className="bg-white rounded-2xl border p-8 text-center space-y-4">
        <MapPin size={48} className="mx-auto text-[#5850ec] opacity-30" />
        <p className="text-gray-600 font-medium">Esta configuração é gerenciada na página de Taxas de Entrega.</p>
        <Button asChild className="bg-[#5850ec] text-white">
          <Link to="/admin/config/taxas">Ir para Taxas de Entrega</Link>
        </Button>
      </div>
    </div>
  );
}

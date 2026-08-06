import { createFileRoute } from "@tanstack/react-router";
import { Settings, MapPin, DollarSign, Clock, Store, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/config/taxas")({
  component: AdminConfigTaxasPage,
});

function AdminConfigTaxasPage() {
  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Taxa e tempo de entrega</h1>
        <p className="text-gray-500 text-sm mt-1">Configure o raio de atuação e o custo de frete.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-8 max-w-2xl">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <DollarSign size={14} /> Taxa de entrega fixa (R$)
            </label>
            <Input defaultValue="5,00" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <Clock size={14} /> Tempo médio de entrega (min)
            </label>
            <Input defaultValue="45" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <MapPin size={14} /> Raio máximo de entrega (km)
            </label>
            <Input defaultValue="10" />
          </div>
          <div className="pt-4">
            <Button className="bg-[#5850ec] hover:bg-[#5850ec]/90">Salvar Configurações</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
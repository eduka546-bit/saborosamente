import { createFileRoute } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/admin/pedidos/carrinhos-abandonados")({
  component: AdminCarrinhosAbandonadosPage,
});

function AdminCarrinhosAbandonadosPage() {
  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Carrinho Abandonado</h1>
        <p className="text-gray-500 text-sm mt-1">Sessões com itens no carrinho que não foram finalizadas.</p>
      </div>
      <div className="bg-white rounded-2xl border border-dashed p-20 text-center">
        <ShoppingCart size={48} className="mx-auto text-gray-200 mb-4" />
        <h3 className="text-lg font-bold text-gray-500">Em breve</h3>
        <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
          O rastreamento de carrinhos abandonados requer integração com sessões de usuário. Esta funcionalidade será ativada em breve.
        </p>
      </div>
    </div>
  );
}

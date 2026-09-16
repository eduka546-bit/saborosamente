import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle, Settings } from "lucide-react";

export const Route = createFileRoute("/admin/config/")({
  component: AdminConfigIndex,
});

function AdminConfigIndex() {
  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="text-center py-10">
        <Settings size={48} className="mx-auto text-[#5850ec] mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-gray-800">Configurações Gerais</h2>
        <p className="text-gray-500 mt-2">Ajuste os parâmetros do sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to={"/admin/config/whatsapp-notificacoes" as any}
          className="bg-white rounded-2xl border p-5 hover:border-[#5850ec] hover:shadow-sm transition-all"
        >
          <div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3">
            <MessageCircle size={20} />
          </div>
          <h3 className="font-bold text-gray-900">Notificações de pedido no WhatsApp</h3>
          <p className="text-sm text-gray-500 mt-1">
            Mensagens automáticas, templates Utility e feedback pós-pedido.
          </p>
        </Link>
      </div>
    </div>
  );
}

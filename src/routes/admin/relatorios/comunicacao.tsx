import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageCircle, Users } from "lucide-react";

export const Route = createFileRoute("/admin/relatorios/comunicacao")({
  component: AdminRelatoriosComunicacaoPage,
});

function AdminRelatoriosComunicacaoPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["comunicacao-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("telefone_cliente, nome_cliente, valor_total, created_at, status")
        .neq("status", "Cancelado")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const uniquePhones = [...new Set(orders.map((o: any) => o.telefone_cliente).filter(Boolean))];

  const generateWhatsAppList = () => {
    const lines = uniquePhones
      .map((phone) => `https://wa.me/55${phone?.replace(/\D/g, "")}`)
      .join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contatos_whatsapp.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Comunicação</h1>
        <p className="text-gray-500 text-sm mt-1">Base de contatos para campanhas e mensagens.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="grid gap-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-2">
                <Users className="text-[#5850ec]" size={20} />
                <p className="text-xs font-bold uppercase text-gray-400">
                  Contatos únicos (WhatsApp)
                </p>
              </div>
              <p className="text-3xl font-black text-[#5850ec]">{uniquePhones.length}</p>
              <button
                onClick={generateWhatsAppList}
                className="mt-3 text-xs font-bold text-[#5850ec] hover:underline flex items-center gap-1"
              >
                <MessageCircle size={13} /> Exportar lista de links
              </button>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-3 mb-2">
                <MessageCircle className="text-green-600" size={20} />
                <p className="text-xs font-bold uppercase text-gray-400">Pedidos com telefone</p>
              </div>
              <p className="text-3xl font-black text-green-600">
                {orders.filter((o: any) => o.telefone_cliente).length}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Últimos clientes</h3>
              <span className="text-xs text-gray-400">{orders.length} registros</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">Telefone</th>
                  <th className="px-6 py-3">Link WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.slice(0, 50).map((o: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{o.nome_cliente ?? "—"}</td>
                    <td className="px-6 py-3 text-gray-500">{o.telefone_cliente ?? "—"}</td>
                    <td className="px-6 py-3">
                      {o.telefone_cliente && (
                        <a
                          href={`https://wa.me/55${o.telefone_cliente.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 font-bold text-xs hover:underline flex items-center gap-1"
                        >
                          <MessageCircle size={12} /> Abrir
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

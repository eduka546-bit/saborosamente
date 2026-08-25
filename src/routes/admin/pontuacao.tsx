import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Award, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/pontuacao")({
  component: AdminPontuacaoPage,
});

function AdminPontuacaoPage() {
  const [search, setSearch] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["pontuacao-clientes"],
    queryFn: async () => {
      const { data: profs, error } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .order("nome");
      if (error) throw error;
      const { data: orders } = await supabase
        .from("pedidos")
        .select("user_id, valor_total")
        .neq("status", "Cancelado");
      const map = new Map<string, number>();
      (orders ?? []).forEach((o: any) => {
        if (o.user_id)
          map.set(o.user_id, (map.get(o.user_id) ?? 0) + Math.floor((o.valor_total ?? 0) / 10));
      });
      return (profs ?? [])
        .map((p: any) => ({ ...p, pontos: map.get(p.id) ?? 0 }))
        .sort((a: any, b: any) => b.pontos - a.pontos);
    },
  });

  const filtered = useMemo(
    () =>
      profiles.filter(
        (p: any) =>
          p.nome?.toLowerCase().includes(search.toLowerCase()) ||
          p.email?.toLowerCase().includes(search.toLowerCase()),
      ),
    [profiles, search],
  );

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Pontuação de Clientes</h1>
        <p className="text-gray-500 text-sm mt-1">
          Ranking de pontos acumulados (1 ponto a cada R$ 10 gastos).
        </p>
      </div>
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Buscar cliente..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p: any, idx: number) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-black text-gray-300 text-lg">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{p.nome ?? "—"}</p>
                    <p className="text-xs text-gray-400">{p.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-yellow-500" />
                      <span className="font-black text-[#5850ec] text-lg">{p.pontos}</span>
                      <span className="text-xs text-gray-400">pts</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

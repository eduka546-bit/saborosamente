import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ShoppingCart,
  Loader2,
  Search,
  MessageCircle,
  TrendingUp,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  Eye,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/pedidos/carrinhos-abandonados")({
  component: AdminCarrinhosAbandonadosPage,
});

const STATUS_COLORS: Record<string, string> = {
  abandonado: "bg-red-100 text-red-700",
  recuperado: "bg-yellow-100 text-yellow-700",
  convertido: "bg-green-100 text-green-700",
};

function ItemsPreview({ itens }: { itens: any[] }) {
  return (
    <div className="space-y-1 text-xs text-gray-600">
      {itens.slice(0, 3).map((item: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          {item.imagem && (
            <img
              src={item.imagem}
              className="h-6 w-6 rounded object-cover border shrink-0"
              alt=""
            />
          )}
          <span className="truncate max-w-[160px]">{item.nome ?? item.productId}</span>
          <span className="text-gray-400 shrink-0">×{item.quantity}</span>
        </div>
      ))}
      {itens.length > 3 && <p className="text-gray-400">+{itens.length - 3} mais</p>}
    </div>
  );
}

function AdminCarrinhosAbandonadosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [selectedCarrinho, setSelectedCarrinho] = useState<any>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["carrinhos-abandonados-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("carrinhos_abandonados")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000, // atualiza a cada 30s
  });

  const markRecuperadoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("carrinhos_abandonados")
        .update({ status: "recuperado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carrinhos-abandonados-admin"] });
      toast.success("Marcado como recuperado!");
    },
  });

  const filtered = useMemo(
    () =>
      data.filter((c: any) => {
        const matchStatus = filterStatus === "todos" || c.status === filterStatus;
        const matchSearch =
          !search ||
          c.nome?.toLowerCase().includes(search.toLowerCase()) ||
          c.telefone?.includes(search) ||
          c.email?.toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
      }),
    [data, search, filterStatus],
  );

  // Estatísticas
  const stats = useMemo(() => {
    const total = data.length;
    const abandonados = data.filter((c: any) => c.status === "abandonado").length;
    const convertidos = data.filter((c: any) => c.status === "convertido").length;
    const valorPerdido = data
      .filter((c: any) => c.status === "abandonado")
      .reduce((s: number, c: any) => s + (c.valor_total ?? 0), 0);
    const taxaConversao = total > 0 ? ((convertidos / total) * 100).toFixed(1) : "0";
    return { total, abandonados, convertidos, valorPerdido, taxaConversao };
  }, [data]);

  const buildWhatsAppUrl = (carrinho: any) => {
    const phone = carrinho.telefone?.replace(/\D/g, "");
    if (!phone) return null;
    const itens = (carrinho.itens as any[])
      .map((i: any) => `• ${i.nome ?? i.productId} ×${i.quantity}`)
      .join("\n");
    const coupon = carrinho.cupom_oferta
      ? `\n\n🎟️ Use o cupom *${carrinho.cupom_oferta}* para 10% OFF!`
      : "";
    const msg = encodeURIComponent(
      `Olá${carrinho.nome ? `, ${carrinho.nome}` : ""}! 👋\n\nVimos que você deixou itens no carrinho da Saborosamente:\n\n${itens}\n\n💰 Total: R$ ${Number(carrinho.valor_total).toFixed(2)}${coupon}\n\nPosso te ajudar a finalizar o pedido? 😊`,
    );
    return `https://wa.me/55${phone}?text=${msg}`;
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#5850ec]">Carrinhos Abandonados</h1>
        <p className="text-gray-500 text-sm mt-1">
          Recupere vendas perdidas entrando em contato com clientes via WhatsApp.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={16} className="text-gray-400" />
            <p className="text-xs font-bold uppercase text-gray-400">Total</p>
          </div>
          <p className="text-2xl font-black text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 border-red-100">
          <div className="flex items-center gap-2 mb-1">
            <X size={16} className="text-red-400" />
            <p className="text-xs font-bold uppercase text-red-400">Abandonados</p>
          </div>
          <p className="text-2xl font-black text-red-500">{stats.abandonados}</p>
        </div>
        <div className="bg-white rounded-xl border p-4 border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={16} className="text-green-500" />
            <p className="text-xs font-bold uppercase text-green-500">Convertidos</p>
          </div>
          <p className="text-2xl font-black text-green-600">{stats.convertidos}</p>
          <p className="text-xs text-green-400">{stats.taxaConversao}% taxa</p>
        </div>
        <div className="bg-white rounded-xl border p-4 border-orange-100">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-orange-400" />
            <p className="text-xs font-bold uppercase text-orange-400">Valor perdido</p>
          </div>
          <p className="text-2xl font-black text-orange-500">
            R$ {stats.valorPerdido.toFixed(2).replace(".", ",")}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border p-4 mb-6 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            placeholder="Buscar por nome, telefone ou e-mail..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {["todos", "abandonado", "recuperado", "convertido"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all border ${
                filterStatus === s
                  ? "bg-[#5850ec] text-white border-[#5850ec]"
                  : "border-gray-200 text-gray-500 hover:border-[#5850ec]"
              }`}
            >
              {s === "todos" ? "Todos" : s}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ["carrinhos-abandonados-admin"] })
          }
        >
          <RefreshCw size={14} /> Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed p-20 text-center">
          <ShoppingCart size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-medium">Nenhum carrinho encontrado.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Itens</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Cupom</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Há quanto tempo</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((c: any) => {
                const waUrl = buildWhatsAppUrl(c);
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{c.nome ?? "Anônimo"}</p>
                      {c.telefone && <p className="text-xs text-gray-400">{c.telefone}</p>}
                      {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                    </td>
                    <td className="px-6 py-4">
                      {Array.isArray(c.itens) && c.itens.length > 0 ? (
                        <ItemsPreview itens={c.itens} />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600">
                      R$ {Number(c.valor_total).toFixed(2).replace(".", ",")}
                    </td>
                    <td className="px-6 py-4">
                      {c.cupom_oferta ? (
                        <span className="text-xs font-black tracking-widest text-[#5850ec] bg-[#5850ec]/10 px-2 py-1 rounded-lg">
                          {c.cupom_oferta}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[c.status] ?? "bg-gray-100 text-gray-500"}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {formatDistanceToNow(new Date(c.created_at), {
                        locale: ptBR,
                        addSuffix: true,
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-[#5850ec]"
                          title="Ver detalhes"
                          onClick={() => setSelectedCarrinho(c)}
                        >
                          <Eye size={15} />
                        </Button>
                        {waUrl && (
                          <a href={waUrl} target="_blank" rel="noopener noreferrer">
                            <Button
                              size="icon"
                              className="h-8 w-8 bg-green-500 hover:bg-green-600 text-white"
                              title="Enviar mensagem no WhatsApp"
                              onClick={() => {
                                if (c.status === "abandonado") {
                                  markRecuperadoMutation.mutate(c.id);
                                }
                              }}
                            >
                              <MessageCircle size={15} />
                            </Button>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de detalhes */}
      {selectedCarrinho && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
          <div className="bg-white h-full w-full max-w-md p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#5850ec]">Detalhes do Carrinho</h2>
              <Button variant="ghost" size="icon" onClick={() => setSelectedCarrinho(null)}>
                <X size={20} />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Cliente */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
                <p className="font-bold text-gray-900">{selectedCarrinho.nome ?? "Anônimo"}</p>
                {selectedCarrinho.telefone && (
                  <p className="text-sm text-gray-500">📞 {selectedCarrinho.telefone}</p>
                )}
                {selectedCarrinho.email && (
                  <p className="text-sm text-gray-500">✉️ {selectedCarrinho.email}</p>
                )}
                <p className="text-xs text-gray-400 pt-1">
                  {format(new Date(selectedCarrinho.created_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              </div>

              {/* Itens */}
              <div>
                <p className="text-xs font-bold uppercase text-gray-400 mb-3">Itens no carrinho</p>
                <div className="space-y-2">
                  {(selectedCarrinho.itens as any[]).map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-white rounded-xl border p-3">
                      {item.imagem && (
                        <img
                          src={item.imagem}
                          className="h-10 w-10 rounded-lg object-cover border"
                          alt=""
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {item.nome ?? item.productId}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.quantity}× — R$ {Number(item.preco ?? 0).toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-green-600">
                        R$ {Number(item.subtotal ?? 0).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total e cupom */}
              <div className="border-t pt-4 flex items-center justify-between">
                <p className="font-bold text-gray-700">Total</p>
                <p className="text-xl font-black text-[#5850ec]">
                  R$ {Number(selectedCarrinho.valor_total).toFixed(2).replace(".", ",")}
                </p>
              </div>

              {selectedCarrinho.cupom_oferta && (
                <div className="bg-[#5850ec]/5 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Cupom gerado pelo exit intent</p>
                  <p className="font-black tracking-widest text-[#5850ec]">
                    {selectedCarrinho.cupom_oferta}
                  </p>
                </div>
              )}

              {/* Ações */}
              {buildWhatsAppUrl(selectedCarrinho) && (
                <a
                  href={buildWhatsAppUrl(selectedCarrinho)!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600 text-white gap-2"
                    onClick={() => {
                      if (selectedCarrinho.status === "abandonado") {
                        markRecuperadoMutation.mutate(selectedCarrinho.id);
                      }
                    }}
                  >
                    <MessageCircle size={16} />
                    Entrar em contato via WhatsApp
                  </Button>
                </a>
              )}

              {selectedCarrinho.status === "abandonado" && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    markRecuperadoMutation.mutate(selectedCarrinho.id);
                    setSelectedCarrinho({ ...selectedCarrinho, status: "recuperado" });
                  }}
                >
                  <CheckCircle2 size={16} className="text-yellow-500" />
                  Marcar como recuperado (sem WA)
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

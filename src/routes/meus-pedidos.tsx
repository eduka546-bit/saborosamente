/**
 * Meus Pedidos (público) — o cliente informa o telefone e vê os pedidos
 * anteriores (por telefone_cliente), com status, itens e botão "Pedir de novo"
 * que readiciona os itens de catálogo ao carrinho. Não exige login.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { Loader2, Search, RotateCcw, Package, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/meus-pedidos")({
  head: () => ({
    meta: [
      { title: "Meus Pedidos | Saborosamente" },
      {
        name: "description",
        content: "Consulte seus pedidos anteriores e repita em um clique informando seu telefone.",
      },
    ],
  }),
  component: MeusPedidosPage,
});

// Só dígitos, pra casar com telefones gravados em formatos diferentes.
function soDigitos(t: string): string {
  return (t ?? "").replace(/\D/g, "");
}

// Extrai o tamanho da observação ("Peso: 300g | ...") → "300g" | null
function extrairPeso(obs?: string | null): string | null {
  if (!obs) return null;
  const m = obs.match(/Peso:\s*(\d+\s*g)/i);
  return m ? m[1].replace(/\s+/g, "") : null;
}

const STATUS_LABEL: Record<string, { txt: string; cls: string }> = {
  preparando: { txt: "Preparando", cls: "bg-amber-100 text-amber-700" },
  pagamento_confirmado: { txt: "Confirmado", cls: "bg-blue-100 text-blue-700" },
  "saiu para entrega": { txt: "Saiu para entrega", cls: "bg-indigo-100 text-indigo-700" },
  entregue: { txt: "Entregue", cls: "bg-green-100 text-green-700" },
  cancelado: { txt: "Cancelado", cls: "bg-red-100 text-red-600" },
};

function MeusPedidosPage() {
  const navigate = useNavigate();
  const { add } = useCart();
  const [telefone, setTelefone] = useState("");
  const [pedidos, setPedidos] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [repetindo, setRepetindo] = useState<string | null>(null);

  async function buscar(e?: React.FormEvent) {
    e?.preventDefault();
    const tel = soDigitos(telefone);
    if (tel.length < 8) {
      toast.error("Informe um telefone válido com DDD.");
      return;
    }
    setLoading(true);
    try {
      // Busca por telefone_cliente contendo os dígitos informados (ignora máscara).
      const { data, error } = await supabase
        .from("pedidos")
        .select("id, created_at, status, valor_total, metodo_entrega, origem, itens:pedido_itens(*)")
        .ilike("telefone_cliente", `%${tel}%`)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;

      // Resolve nomes dos produtos referenciados pelos itens.
      const ids = [
        ...new Set(
          (data ?? []).flatMap((p: any) =>
            (p.itens ?? []).map((i: any) => i.produto_id).filter(Boolean),
          ),
        ),
      ];
      const nomes: Record<string, string> = {};
      if (ids.length > 0) {
        const { data: prods } = await supabase.from("produtos").select("id, nome").in("id", ids);
        (prods ?? []).forEach((p: any) => (nomes[p.id] = p.nome));
      }

      const comNomes = (data ?? []).map((p: any) => ({
        ...p,
        itens: (p.itens ?? []).map((i: any) => ({
          ...i,
          nomeExibicao: nomes[i.produto_id] ?? i.nome_item ?? "Produto",
        })),
      }));
      setPedidos(comNomes);
      if (comNomes.length === 0) {
        toast.info("Nenhum pedido encontrado para esse telefone.");
      }
    } catch (err: any) {
      toast.error("Erro ao buscar pedidos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function pedirDeNovo(pedido: any) {
    setRepetindo(pedido.id);
    try {
      let adicionados = 0;
      let ignorados = 0;
      for (const item of pedido.itens ?? []) {
        // Itens personalizados (sem produto_id) não têm como ser reconstruídos aqui.
        if (!item.produto_id) {
          ignorados++;
          continue;
        }
        const peso = extrairPeso(item.observacao) ?? "300g";
        add(item.produto_id, item.quantidade ?? 1, peso);
        adicionados++;
      }
      if (adicionados === 0) {
        toast.error("Este pedido não pode ser repetido automaticamente.");
        return;
      }
      if (ignorados > 0) {
        toast.success(
          `${adicionados} item(ns) adicionados. ${ignorados} personalizado(s) precisam ser remontados.`,
        );
      } else {
        toast.success(`${adicionados} item(ns) adicionados ao carrinho!`);
      }
      navigate({ to: "/carrinho" });
    } finally {
      setRepetindo(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-2xl md:text-3xl font-black text-gray-900">Meus Pedidos</h1>
      <p className="text-gray-500 mt-1 text-sm">
        Informe o telefone usado no pedido para ver seu histórico e repetir com um clique.
      </p>

      <form onSubmit={buscar} className="flex gap-2 mt-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="tel"
            inputMode="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Seu telefone com DDD"
            className="w-full h-12 pl-10 pr-4 rounded-2xl border border-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-[#086e45]/30"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-12 px-6 rounded-2xl bg-[#086e45] text-white font-bold disabled:opacity-60 flex items-center gap-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Buscar"}
        </button>
      </form>

      {pedidos !== null && (
        <div className="mt-8 space-y-4">
          {pedidos.length === 0 ? (
            <div className="text-center py-16 text-gray-400 border border-dashed rounded-2xl">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              Nenhum pedido encontrado para esse telefone.
            </div>
          ) : (
            pedidos.map((p) => {
              const st = STATUS_LABEL[(p.status ?? "").toLowerCase()] ?? {
                txt: p.status ?? "—",
                cls: "bg-gray-100 text-gray-600",
              };
              const data = new Date(p.created_at);
              const podeRepetir = (p.itens ?? []).some((i: any) => i.produto_id);
              return (
                <div key={p.id} className="bg-white rounded-2xl border p-4 md:p-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900">
                          #{String(p.id).slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>
                          {st.txt}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {data.toLocaleDateString("pt-BR")} às{" "}
                        {data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        {p.metodo_entrega ? ` • ${p.metodo_entrega}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-[#086e45]">
                        R$ {Number(p.valor_total ?? 0).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1 border-t pt-3">
                    {(p.itens ?? []).map((i: any) => {
                      const peso = extrairPeso(i.observacao);
                      return (
                        <li key={i.id} className="text-sm text-gray-600 flex justify-between gap-2">
                          <span>
                            {i.quantidade}x {i.nomeExibicao}
                            {peso ? <span className="text-gray-400"> ({peso})</span> : ""}
                          </span>
                          <span className="text-gray-400 whitespace-nowrap">
                            R$ {Number(i.preco_unitario ?? 0).toFixed(2).replace(".", ",")}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {podeRepetir && (
                    <button
                      onClick={() => pedirDeNovo(p)}
                      disabled={repetindo === p.id}
                      className="mt-4 w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#086e45]/10 text-[#086e45] font-bold text-sm hover:bg-[#086e45]/20 transition disabled:opacity-60"
                    >
                      {repetindo === p.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <RotateCcw size={16} />
                      )}
                      Pedir de novo
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-[#086e45]"
        >
          Ver cardápio <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}

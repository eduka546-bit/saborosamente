import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, Package, Printer, ClipboardList, PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { imgUrl } from "@/lib/image-proxy";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/relatorios/estoque")({
  component: AdminRelatoriosEstoquePage,
});

function EstoqueCell({
  valor,
  coluna,
  tipo,
}: {
  valor: number;
  coluna: "200g" | "300g" | "400g";
  tipo?: string;
}) {
  // Regras de alerta por coluna/tipo:
  // 200g (marmitas): alerta ≤4, urgente ≤3
  // 300g/400g (marmitas): alerta ≤7, urgente ≤5
  // Sopas/Complementos/Bebidas: alerta ≤7, urgente ≤5
  let limAlerta = 7;
  let limUrgente = 5;
  if (tipo === "marmita" && coluna === "200g") {
    limAlerta = 4;
    limUrgente = 3;
  }

  const urgente = valor <= limUrgente;
  const baixo = !urgente && valor <= limAlerta;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-bold text-sm",
        urgente && "text-red-600",
        baixo && "text-yellow-600",
        !urgente && !baixo && "text-gray-900",
      )}
    >
      {valor}
      {urgente && <span title="Urgente">❌</span>}
      {baixo && <span title="Estoque baixo">⚠️</span>}
    </span>
  );
}

function AdminRelatoriosEstoquePage() {
  const queryClient = useQueryClient();
  const [painelAberto, setPainelAberto] = useState<"substituir" | "somar" | null>(null);
  const [listaTexto, setListaTexto] = useState("");

  // Abre o painel correto se veio via query param (?acao=atualizar ou ?acao=entrada)
  const search = useSearch({ strict: false }) as Record<string, string>;
  useEffect(() => {
    if (search?.acao === "atualizar") setPainelAberto("substituir");
    else if (search?.acao === "entrada") setPainelAberto("somar");
  }, [search?.acao]);

  // ── Parser de lista de estoque ─────────────────────────────────────────────
  // Aceita o formato: "* TD02 - 4/2/6", "Nhoque - 1/0/4", "SO06 - 9"
  // Ignora emojis ❌⚠️, asteriscos, bullets. Separa pelo último " - ".
  async function processarLista(modo: "substituir" | "somar") {
    const linhas = listaTexto.split("\n");
    const atualizados: string[] = [];
    const naoEncontrados: string[] = [];

    for (const linha of linhas) {
      const l = linha.trim();
      if (
        !l ||
        l.startsWith("*ESTOQUE") ||
        l.startsWith("*SOPAS") ||
        l.startsWith("*COMPLEMENTOS") ||
        l.startsWith("Sabor") ||
        l.startsWith("*(") ||
        l.length < 3
      )
        continue;

      const sepIdx = l.lastIndexOf(" - ");
      if (sepIdx === -1) continue;

      const identificador = l
        .slice(0, sepIdx)
        .replace(/^[*•\s]+/, "")
        .trim();
      const numeroParte = l.slice(sepIdx + 3);

      // Extrai números ignorando emojis/sinais
      const numStr = numeroParte.replace(/[^\d/\s]/gu, " ").trim();
      const partes = numStr.split(/[\s/]+/).filter((p) => p.length > 0 && /^\d+$/.test(p));
      if (!partes.length) continue;
      const nums = partes.map(Number);
      const n200 = nums[0] ?? 0;
      const n300 = nums[1] ?? null;
      const n400 = nums[2] ?? null;

      // Busca produto por código ou nome
      const codigoMatch = identificador.match(/^(TD|SO|CO)\d{1,2}/i);
      const termoBusca = codigoMatch
        ? `%${codigoMatch[0].toUpperCase()}%`
        : `%${identificador.replace(/[%_]/g, "").trim()}%`;

      const { data: prods } = await supabase
        .from("produtos")
        .select("id, nome, estoque_200g, estoque_300g, estoque_400g, tipo_produto")
        .ilike("nome", termoBusca)
        .eq("ativo", true)
        .limit(1);

      if (!prods?.length) {
        naoEncontrados.push(identificador);
        continue;
      }

      const p = prods[0] as any;
      const ehSopa = p.tipo_produto === "sopa" || /^SO/i.test(identificador);

      let novo200: number, novo300: number, novo400: number;
      if (modo === "substituir") {
        novo200 = n200;
        novo300 = n300 ?? 0;
        novo400 = n400 ?? 0;
      } else {
        if (n300 === null) {
          // Tamanho único
          novo200 = ehSopa ? (p.estoque_200g ?? 0) : (p.estoque_200g ?? 0) + n200;
          novo300 = 0;
          novo400 = ehSopa ? (p.estoque_400g ?? 0) + n200 : (p.estoque_400g ?? 0);
        } else {
          novo200 = (p.estoque_200g ?? 0) + n200;
          novo300 = (p.estoque_300g ?? 0) + (n300 ?? 0);
          novo400 = (p.estoque_400g ?? 0) + (n400 ?? 0);
        }
      }

      await supabase
        .from("produtos")
        .update({
          estoque_200g: novo200,
          estoque_300g: novo300,
          estoque_400g: novo400,
          updated_at: new Date().toISOString(),
        })
        .eq("id", p.id);

      atualizados.push(p.nome.split(" - ")[0] ?? p.nome);
    }

    return { atualizados, naoEncontrados };
  }

  const atualizarMutation = useMutation({
    mutationFn: (modo: "substituir" | "somar") => processarLista(modo),
    onSuccess: ({ atualizados, naoEncontrados }) => {
      queryClient.invalidateQueries({ queryKey: ["relatorio-estoque"] });
      const msg = atualizados.length
        ? `${atualizados.length} produto(s) atualizado(s).`
        : "Nenhum produto atualizado.";
      if (naoEncontrados.length) {
        toast.warning(`${msg} Não encontrados: ${naoEncontrados.join(", ")}`);
      } else {
        toast.success(msg);
      }
      setListaTexto("");
      setPainelAberto(null);
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["relatorio-estoque"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select(
          "id, nome, imagem_url, tipo_produto, estoque_200g, estoque_300g, estoque_400g, estoque_minimo, controle_estoque, status, categorias(nome)",
        )
        .eq("controle_estoque", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Contadores — usa as novas regras fixas
  const comProblema = products.filter((p: any) => {
    const tipo = p.tipo_produto ?? "marmita";
    if (tipo === "marmita") {
      return (p.estoque_200g ?? 0) <= 4 || (p.estoque_300g ?? 0) <= 7 || (p.estoque_400g ?? 0) <= 7;
    }
    if (tipo === "sopa") return (p.estoque_400g ?? 0) <= 7;
    if (tipo === "complemento" || tipo === "bebida") return (p.estoque_200g ?? 0) <= 7;
    return false;
  });
  const semEstoque = products.filter((p: any) => {
    const tipo = p.tipo_produto ?? "marmita";
    if (tipo === "marmita") {
      return (p.estoque_200g ?? 0) <= 3 || (p.estoque_300g ?? 0) <= 5 || (p.estoque_400g ?? 0) <= 5;
    }
    if (tipo === "sopa") return (p.estoque_400g ?? 0) <= 5;
    if (tipo === "complemento" || tipo === "bebida") return (p.estoque_200g ?? 0) <= 5;
    return false;
  });

  function imprimirEstoque(prods: any[]) {
    const now = new Date();
    const dataStr = now.toLocaleDateString("pt-BR");
    const horaStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const rows = prods
      .map((p: any) => {
        const tipo = p.tipo_produto ?? "marmita";
        const fmt = (v: number, col: string) => {
          let limAlerta = 7;
          let limUrgente = 5;
          if (tipo === "marmita" && col === "200g") {
            limAlerta = 4;
            limUrgente = 3;
          }
          if (v <= limUrgente) return `${v} ❌`;
          if (v <= limAlerta) return `${v} ⚠️`;
          return `${v}`;
        };
        return `<tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;font-size:11px;font-weight:600">${p.nome}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;font-size:11px">${fmt(p.estoque_200g ?? 0, "200g")}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;font-size:11px">${fmt(p.estoque_300g ?? 0, "300g")}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;font-size:11px">${fmt(p.estoque_400g ?? 0, "400g")}</td>
      </tr>`;
      })
      .join("");

    const win = window.open("", "_blank", "width=600,height=800");
    if (!win) {
      alert("Permita pop-ups.");
      return;
    }
    win.document
      .write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Estoque Saborosamente</title>
      <style>@page{margin:10mm}body{font-family:sans-serif;font-size:12px;color:#111}
      table{width:100%;border-collapse:collapse}th{background:#f5f5f5;padding:6px 8px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.5px}
      th:first-child{text-align:left}</style></head><body>
      <h2 style="margin:0 0 4px">SABOROSAMENTE — Estoque</h2>
      <p style="margin:0 0 12px;color:#666;font-size:11px">${dataStr} às ${horaStr} • ${prods.length} produtos</p>
      <table><thead><tr><th>Produto</th><th>200g</th><th>300g</th><th>400g</th></tr></thead><tbody>${rows}</tbody></table>
      <p style="margin-top:12px;font-size:9px;color:#999">⚠️ = estoque baixo | ❌ = sem estoque</p>
      <script>window.onload=function(){window.print();setTimeout(function(){window.close()},1000)}</script>
      </body></html>`);
    win.document.close();
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Estoque por Tamanho</h1>
          <p className="text-gray-500 text-sm mt-1">
            Produtos com controle de estoque ativo. ⚠️ = baixo, ❌ = sem estoque.
          </p>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => imprimirEstoque(products)}
        >
          <Printer size={16} /> Imprimir
        </Button>
      </div>

      {/* ── Painel de atualização de estoque ─────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          onClick={() => setPainelAberto(painelAberto === "substituir" ? null : "substituir")}
          className={cn(
            "flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all",
            painelAberto === "substituir"
              ? "border-[#5850ec] bg-[#5850ec]/5 text-[#5850ec]"
              : "border-gray-200 text-gray-600 hover:border-[#5850ec]/40",
          )}
        >
          <ClipboardList size={16} /> Atualizar Estoque (substituir)
        </button>
        <button
          onClick={() => setPainelAberto(painelAberto === "somar" ? null : "somar")}
          className={cn(
            "flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all",
            painelAberto === "somar"
              ? "border-green-600 bg-green-50 text-green-700"
              : "border-gray-200 text-gray-600 hover:border-green-400",
          )}
        >
          <PackagePlus size={16} /> Entrada de Estoque (somar)
        </button>
      </div>

      {painelAberto && (
        <div className="mb-6 bg-white rounded-2xl border p-5 shadow-sm">
          <p className="text-sm font-bold text-gray-700 mb-1">
            {painelAberto === "substituir"
              ? "🔄 Cole a lista de estoque — os valores vão substituir o atual."
              : "📥 Cole os itens que chegaram — os valores serão somados ao atual."}
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Formato aceito: <code>* TD02 - 4/2/6</code> ou <code>SO06 - 9</code> ou nome
            completo/abreviado. Emojis ❌⚠️ são ignorados.
          </p>
          <Textarea
            rows={12}
            value={listaTexto}
            onChange={(e) => setListaTexto(e.target.value)}
            placeholder={"* TD02 - 4/2/6\n* Nhoque - 1/0/4\n* SO06 - 9\n* CO01 - 7"}
            className="font-mono text-sm mb-3"
          />
          <div className="flex gap-3">
            <Button
              onClick={() => atualizarMutation.mutate(painelAberto)}
              disabled={atualizarMutation.isPending || !listaTexto.trim()}
              className={
                painelAberto === "substituir"
                  ? "bg-[#5850ec] text-white"
                  : "bg-green-600 text-white hover:bg-green-700"
              }
            >
              {atualizarMutation.isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : painelAberto === "substituir" ? (
                <ClipboardList size={16} className="mr-2" />
              ) : (
                <PackagePlus size={16} className="mr-2" />
              )}
              {atualizarMutation.isPending
                ? "Processando..."
                : painelAberto === "substituir"
                  ? "Atualizar Estoque"
                  : "Registrar Entrada"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPainelAberto(null);
                setListaTexto("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-xs font-bold uppercase text-gray-400">Monitorados</p>
          <p className="text-3xl font-black text-[#5850ec] mt-1">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 border-yellow-200 bg-yellow-50">
          <p className="text-xs font-bold uppercase text-yellow-600">Com alerta</p>
          <p className="text-3xl font-black text-yellow-600 mt-1">{comProblema.length}</p>
        </div>
        <div className="bg-white rounded-xl border p-5 border-red-200 bg-red-50">
          <p className="text-xs font-bold uppercase text-red-500">Algum tamanho zerado</p>
          <p className="text-3xl font-black text-red-500 mt-1">{semEstoque.length}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed p-20 text-center">
          <Package size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400">Nenhum produto com controle de estoque ativo.</p>
          <p className="text-xs text-gray-400 mt-1">
            Ative o controle de estoque em Cardápio → editar produto.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b text-xs font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-center">200g / UN</th>
                <th className="px-4 py-3 text-center">300g</th>
                <th className="px-4 py-3 text-center">400g / UN</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p: any) => {
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {p.imagem_url && (
                          <img
                            src={imgUrl(p.imagem_url)}
                            className="h-7 w-7 rounded object-cover border"
                            alt=""
                          />
                        )}
                        <span className="font-semibold text-gray-900 text-xs">{p.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <span className="capitalize">{p.tipo_produto ?? "marmita"}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.tipo_produto === "marmita" || !p.tipo_produto ? (
                        <EstoqueCell valor={p.estoque_200g ?? 0} coluna="200g" tipo="marmita" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.tipo_produto === "marmita" || !p.tipo_produto ? (
                        <EstoqueCell valor={p.estoque_300g ?? 0} coluna="300g" tipo="marmita" />
                      ) : p.tipo_produto === "complemento" || p.tipo_produto === "bebida" ? (
                        <EstoqueCell
                          valor={p.estoque_200g ?? 0}
                          coluna="300g"
                          tipo={p.tipo_produto}
                        />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.tipo_produto === "marmita" || !p.tipo_produto ? (
                        <EstoqueCell valor={p.estoque_400g ?? 0} coluna="400g" tipo="marmita" />
                      ) : p.tipo_produto === "sopa" ? (
                        <EstoqueCell valor={p.estoque_400g ?? 0} coluna="400g" tipo="sopa" />
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

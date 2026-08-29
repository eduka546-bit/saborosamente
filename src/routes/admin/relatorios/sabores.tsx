/**
 * Relatório: Sabores mais vendidos por período.
 * Agrega pedido_itens por sabor (produto_id -> produtos.nome, fallback nome_item),
 * somando quantidade. Período e origem filtráveis. Tamanho extraído de
 * observacao ("Peso: XXXg") quando disponível.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trophy, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { subDays } from "date-fns";

export const Route = createFileRoute("/admin/relatorios/sabores")({
  component: AdminRelatoriosSaboresPage,
  ssr: false,
});

type Periodo = 7 | 30 | 90;
type Origem = "todos" | "site" | "pdv" | "pedidos10";

// Extrai o tamanho da observação do item ("Peso: 300g | ...") → "300g" ou null.
function extrairTamanho(obs?: string | null): string | null {
  if (!obs) return null;
  const m = obs.match(/Peso:\s*(\d+\s*g)/i);
  return m ? m[1].replace(/\s+/g, "") : null;
}

interface SaborAgg {
  nome: string;
  total: number;
  por200: number;
  por300: number;
  por400: number;
  outros: number;
  receita: number;
}

function AdminRelatoriosSaboresPage() {
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const [origem, setOrigem] = useState<Origem>("todos");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["relatorio-sabores", periodo],
    queryFn: async () => {
      // Busca itens dos pedidos no período, com dados do pedido pai (origem/status)
      // e o nome do produto. created_at fica no pedido pai.
      const desde = subDays(new Date(), periodo).toISOString();
      const { data, error } = await supabase
        .from("pedido_itens")
        .select(
          "quantidade, preco_unitario, observacao, nome_item, produtos(nome), pedidos!inner(created_at, status, origem)",
        )
        .gte("pedidos.created_at", desde);
      if (error) throw error;
      return data as any[];
    },
  });

  const { agregados, totalUnidades, totalReceita } = useMemo(() => {
    const map = new Map<string, SaborAgg>();
    let totalUnidades = 0;
    let totalReceita = 0;

    for (const it of rows) {
      const pedido = it.pedidos ?? {};
      const st = (pedido.status ?? "").toLowerCase();
      if (st === "cancelado") continue;
      const org = pedido.origem ?? "site";
      if (origem !== "todos" && org !== origem) continue;

      const nome = it.produtos?.nome ?? it.nome_item ?? "Produto";
      const qtd = Number(it.quantidade ?? 0);
      const receitaItem = qtd * Number(it.preco_unitario ?? 0);
      const tam = extrairTamanho(it.observacao);

      const cur =
        map.get(nome) ??
        ({ nome, total: 0, por200: 0, por300: 0, por400: 0, outros: 0, receita: 0 } as SaborAgg);
      cur.total += qtd;
      cur.receita += receitaItem;
      if (tam === "200g") cur.por200 += qtd;
      else if (tam === "300g") cur.por300 += qtd;
      else if (tam === "400g") cur.por400 += qtd;
      else cur.outros += qtd;
      map.set(nome, cur);

      totalUnidades += qtd;
      totalReceita += receitaItem;
    }

    const agregados = [...map.values()].sort((a, b) => b.total - a.total);
    return { agregados, totalUnidades, totalReceita };
  }, [rows, origem]);

  const maxTotal = agregados[0]?.total ?? 1;

  function imprimir() {
    const now = new Date();
    const dataStr = now.toLocaleDateString("pt-BR");
    const horaStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const labelOrigem =
      origem === "todos" ? "Todas as origens" : origem === "pedidos10" ? "Pedidos10" : origem.toUpperCase();

    const linhas = agregados
      .map(
        (s, i) => `<tr>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;font-size:11px">${i + 1}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;font-size:11px;font-weight:600">${s.nome}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;font-size:11px">${s.por200 || "-"}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;font-size:11px">${s.por300 || "-"}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;font-size:11px">${s.por400 || "-"}</td>
        <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;font-size:11px;font-weight:700">${s.total}</td>
      </tr>`,
      )
      .join("");

    const win = window.open("", "_blank", "width=700,height=900");
    if (!win) {
      alert("Permita pop-ups.");
      return;
    }
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Sabores mais vendidos</title>
      <style>@page{margin:10mm}body{font-family:sans-serif;font-size:12px;color:#111}
      table{width:100%;border-collapse:collapse}th{background:#f5f5f5;padding:6px 8px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.5px}
      th:nth-child(2){text-align:left}</style></head><body>
      <h2 style="margin:0 0 4px">SABOROSAMENTE — Sabores mais vendidos</h2>
      <p style="margin:0 0 12px;color:#666;font-size:11px">Últimos ${periodo} dias • ${labelOrigem} • ${dataStr} às ${horaStr} • ${totalUnidades} unidades</p>
      <table><thead><tr><th>#</th><th>Sabor</th><th>200g</th><th>300g</th><th>400g</th><th>Total</th></tr></thead><tbody>${linhas}</tbody></table>
      <script>window.onload=function(){window.print();setTimeout(function(){window.close()},1000)}</script>
      </body></html>`);
    win.document.close();
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Sabores mais vendidos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Ranking por quantidade vendida no período. Ajuda a decidir o que produzir mais.
          </p>
        </div>
        <button
          onClick={imprimir}
          disabled={agregados.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold text-gray-600 hover:border-[#5850ec]/40 disabled:opacity-40"
        >
          <Printer size={16} /> Imprimir
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          {([7, 30, 90] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                periodo === p
                  ? "bg-[#5850ec] text-white border-[#5850ec]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#5850ec]/40"
              }`}
            >
              {p} dias
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["todos", "site", "pdv", "pedidos10"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOrigem(o)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                origem === o
                  ? "bg-[#5850ec] text-white border-[#5850ec]"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#5850ec]/40"
              }`}
            >
              {o === "todos" ? "Todas" : o === "pedidos10" ? "Pedidos10" : o === "pdv" ? "PDV" : "Site"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs font-bold uppercase text-gray-400">Unidades vendidas</p>
              <p className="text-3xl font-black text-[#5850ec] mt-1">{totalUnidades}</p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs font-bold uppercase text-gray-400">Receita (itens)</p>
              <p className="text-3xl font-black text-green-600 mt-1">
                R$ {totalReceita.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs font-bold uppercase text-gray-400">Sabores distintos</p>
              <p className="text-3xl font-black text-gray-700 mt-1">{agregados.length}</p>
            </div>
          </div>

          {agregados.length === 0 ? (
            <div className="text-center py-16 text-gray-400 border border-dashed rounded-xl">
              Nenhuma venda no período selecionado.
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b">
                      <th className="py-3 px-4 w-10">#</th>
                      <th className="py-3 px-4">Sabor</th>
                      <th className="py-3 px-2 text-center">200g</th>
                      <th className="py-3 px-2 text-center">300g</th>
                      <th className="py-3 px-2 text-center">400g</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 hidden md:table-cell">Participação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {agregados.map((s, i) => (
                      <tr key={s.nome} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-400 font-bold">
                          {i === 0 ? (
                            <Trophy size={16} className="text-yellow-500" />
                          ) : (
                            i + 1
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{s.nome}</td>
                        <td className="py-3 px-2 text-center text-gray-600">{s.por200 || "-"}</td>
                        <td className="py-3 px-2 text-center text-gray-600">{s.por300 || "-"}</td>
                        <td className="py-3 px-2 text-center text-gray-600">{s.por400 || "-"}</td>
                        <td className="py-3 px-4 text-right font-black text-[#5850ec]">{s.total}</td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-[80px]">
                              <div
                                className="bg-[#5850ec] h-2 rounded-full"
                                style={{ width: `${Math.round((s.total / maxTotal) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-10 text-right">
                              {totalUnidades > 0
                                ? `${Math.round((s.total / totalUnidades) * 100)}%`
                                : "0%"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

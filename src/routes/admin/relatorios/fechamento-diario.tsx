/**
 * Relatório: Fechamento diário — uma linha por pedido (substitui o caderno).
 * Colunas: hora · 150g (complementos) · 200g · 300g · 400g (marmitas) · Sopas ·
 * Personalizadas · Valor total · Pagamento · Modo (loja/site/p10) · Taxa entrega.
 * Seletor de data (padrão hoje) + linha de totais + impressão.
 *
 * Classificação de cada item:
 *  - complemento (150g): produtos.tipo_produto === "complemento"
 *  - sopa: produtos.tipo_produto === "sopa"
 *  - personalizada: item sem produto_id
 *  - marmita: por tamanho extraído da observação ("Peso: XXXg")
 *  Combos/bebidas não entram nas colunas de quantidade, mas contam no valor.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Printer } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/admin/relatorios/fechamento-diario")({
  component: FechamentoDiarioPage,
  ssr: false,
});

// "Peso: 300g | ..." → "300g" | null
function extrairPeso(obs?: string | null): string | null {
  if (!obs) return null;
  const m = obs.match(/Peso:\s*(\d+\s*g)/i);
  return m ? m[1].replace(/\s+/g, "") : null;
}

// Conta marmitas por tamanho dentro do texto de um item combo (Pedidos10),
// onde a composição vem no nome/observação como:
//   "TD01 ... 300g, TD02 ... 200g, 3x TD03 ... 300g, 2x TD04 ... 200g"
// Cada trecho separado por vírgula tem um tamanho (200g/300g/400g) no fim e
// pode ter um multiplicador "Nx" no início. Retorna {m200, m300, m400}.
function contarTamanhosNoTexto(texto?: string | null): {
  m200: number;
  m300: number;
  m400: number;
} {
  const out = { m200: 0, m300: 0, m400: 0 };
  if (!texto) return out;
  // Divide por vírgula; cada parte é uma marmita (ou N marmitas do mesmo sabor).
  for (const parte of texto.split(/,|;/)) {
    const mTam = parte.match(/(\d{3})\s*g/); // 200 / 300 / 400
    if (!mTam) continue;
    const mMult = parte.match(/(\d+)\s*x/i); // "3x", "5 x"
    const qtd = mMult ? Math.max(1, parseInt(mMult[1], 10)) : 1;
    const tam = mTam[1];
    if (tam === "200") out.m200 += qtd;
    else if (tam === "400") out.m400 += qtd;
    else if (tam === "300") out.m300 += qtd;
  }
  return out;
}

function modoLabel(origem?: string): string {
  const o = (origem ?? "site").toLowerCase();
  if (o === "pdv") return "Loja";
  if (o === "pedidos10") return "P10";
  if (o === "whatsapp") return "WhatsApp";
  return "Site";
}

interface LinhaPedido {
  id: string;
  hora: string;
  c150: number;
  m200: number;
  m300: number;
  m400: number;
  sopas: number;
  personalizadas: number;
  valor: number;
  pagamento: string;
  modo: string;
  taxa: number;
}

function hojeISO(): string {
  // Data local (Brasília) no formato YYYY-MM-DD para o input date.
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function FechamentoDiarioPage() {
  const [data, setData] = useState<string>(hojeISO());

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["fechamento-diario", data],
    queryFn: async () => {
      // Janela do dia selecionado (00:00–23:59 local → UTC).
      const inicio = new Date(`${data}T00:00:00`);
      const fim = new Date(`${data}T23:59:59.999`);
      const { data: rows, error } = await supabase
        .from("pedidos")
        .select(
          "id, created_at, status, valor_total, taxa_entrega, metodo_pagamento, origem, itens:pedido_itens(quantidade, produto_id, observacao, nome_item, produtos(tipo_produto))",
        )
        .gte("created_at", inicio.toISOString())
        .lte("created_at", fim.toISOString())
        .order("created_at");
      if (error) throw error;
      return rows as any[];
    },
  });

  const linhas = useMemo<LinhaPedido[]>(() => {
    return (pedidos ?? [])
      .filter((p: any) => (p.status ?? "").toLowerCase() !== "cancelado")
      .map((p: any) => {
        let c150 = 0,
          m200 = 0,
          m300 = 0,
          m400 = 0,
          sopas = 0,
          personalizadas = 0;

        for (const it of p.itens ?? []) {
          const qtd = Number(it.quantidade ?? 0);
          const tipo = it.produtos?.tipo_produto ?? (it.produto_id ? "marmita" : "personalizada");
          const textoComposicao = `${it.nome_item ?? ""} ${it.observacao ?? ""}`;
          // Um item combo pode conter marmitas de vários tamanhos na composição
          // (Pedidos10 grava tudo numa linha só). Detecta se há mais de uma
          // gramatura no texto → trata como combo e conta cada marmita.
          // Marmita personalizada: item sem produto_id cuja observação marca
          // "PERSONALIZADA". Nunca é destrinchada como combo (as gramaturas no
          // texto são dos ingredientes, não de marmitas por tamanho).
          const ehPersonalizada =
            !it.produto_id && /PERSONALIZADA/i.test(it.observacao ?? "");

          const tamanhosNoTexto = ehPersonalizada
            ? { m200: 0, m300: 0, m400: 0 }
            : contarTamanhosNoTexto(textoComposicao);
          const totalNoTexto =
            tamanhosNoTexto.m200 + tamanhosNoTexto.m300 + tamanhosNoTexto.m400;
          // Combo composto: produto marcado como combo, ou linha única (sem
          // produto_id, típico do Pedidos10) com mais de uma marmita no texto.
          const ehComboComposto =
            !ehPersonalizada && (tipo === "combo" || (!it.produto_id && totalNoTexto > 1));

          if (ehPersonalizada) {
            personalizadas += qtd;
          } else if (ehComboComposto && totalNoTexto > 0) {
            // Combo: soma as marmitas por tamanho extraídas do texto.
            m200 += tamanhosNoTexto.m200;
            m300 += tamanhosNoTexto.m300;
            m400 += tamanhosNoTexto.m400;
          } else if (tipo === "complemento") {
            c150 += qtd;
          } else if (tipo === "sopa") {
            sopas += qtd;
          } else if (tipo === "marmita") {
            const peso = extrairPeso(it.observacao);
            if (peso === "200g") m200 += qtd;
            else if (peso === "400g") m400 += qtd;
            else m300 += qtd; // default/300g quando não identificado
          }
          // combo sem tamanhos detectáveis / bebida: não entram nas colunas
        }

        const d = new Date(p.created_at);
        return {
          id: p.id,
          hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          c150,
          m200,
          m300,
          m400,
          sopas,
          personalizadas,
          valor: Number(p.valor_total ?? 0),
          pagamento: p.metodo_pagamento ?? "—",
          modo: modoLabel(p.origem),
          taxa: Number(p.taxa_entrega ?? 0),
        };
      });
  }, [pedidos]);

  const totais = useMemo(() => {
    return linhas.reduce(
      (acc, l) => ({
        c150: acc.c150 + l.c150,
        m200: acc.m200 + l.m200,
        m300: acc.m300 + l.m300,
        m400: acc.m400 + l.m400,
        sopas: acc.sopas + l.sopas,
        personalizadas: acc.personalizadas + l.personalizadas,
        valor: acc.valor + l.valor,
        taxa: acc.taxa + l.taxa,
      }),
      { c150: 0, m200: 0, m300: 0, m400: 0, sopas: 0, personalizadas: 0, valor: 0, taxa: 0 },
    );
  }, [linhas]);

  const brl = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const dataFmt = new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");

  function imprimir() {
    const linhasHtml = linhas
      .map(
        (l) => `<tr>
        <td class="c">${l.hora}</td>
        <td class="n">${l.c150 || "-"}</td>
        <td class="n">${l.m200 || "-"}</td>
        <td class="n">${l.m300 || "-"}</td>
        <td class="n">${l.m400 || "-"}</td>
        <td class="n">${l.sopas || "-"}</td>
        <td class="n">${l.personalizadas || "-"}</td>
        <td class="r">${brl(l.valor)}</td>
        <td class="c">${l.pagamento}</td>
        <td class="c">${l.modo}</td>
        <td class="r">${l.taxa > 0 ? brl(l.taxa) : "-"}</td>
      </tr>`,
      )
      .join("");

    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) {
      alert("Permita pop-ups.");
      return;
    }
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fechamento ${dataFmt}</title>
      <style>@page{margin:8mm}body{font-family:sans-serif;font-size:11px;color:#111}
      table{width:100%;border-collapse:collapse}
      th{background:#f0f0f0;padding:5px 4px;font-size:9px;text-transform:uppercase;border-bottom:2px solid #ccc}
      td{padding:4px;border-bottom:1px solid #eee}
      .n{text-align:center}.c{text-align:center}.r{text-align:right}
      tfoot td{font-weight:bold;border-top:2px solid #ccc;background:#fafafa}</style></head><body>
      <h2 style="margin:0 0 2px">SABOROSAMENTE — Fechamento do dia</h2>
      <p style="margin:0 0 10px;color:#666;font-size:11px">${dataFmt} • ${linhas.length} pedido(s)</p>
      <table>
        <thead><tr>
          <th>Hora</th><th>150g</th><th>200g</th><th>300g</th><th>400g</th>
          <th>Sopas</th><th>Person.</th><th>Valor</th><th>Pgto</th><th>Modo</th><th>Taxa</th>
        </tr></thead>
        <tbody>${linhasHtml}</tbody>
        <tfoot><tr>
          <td class="c">TOTAL</td>
          <td class="n">${totais.c150}</td><td class="n">${totais.m200}</td>
          <td class="n">${totais.m300}</td><td class="n">${totais.m400}</td>
          <td class="n">${totais.sopas}</td><td class="n">${totais.personalizadas}</td>
          <td class="r">${brl(totais.valor)}</td><td></td><td></td>
          <td class="r">${brl(totais.taxa)}</td>
        </tr></tfoot>
      </table>
      <script>window.onload=function(){window.print();setTimeout(function(){window.close()},1000)}</script>
      </body></html>`);
    win.document.close();
  }

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec]">Fechamento diário</h1>
          <p className="text-gray-500 text-sm mt-1">
            Uma linha por pedido, com a quantidade de cada item. Substitui o caderno.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="h-10 px-3 rounded-xl border border-gray-200 text-sm"
          />
          <button
            onClick={imprimir}
            disabled={linhas.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold text-gray-600 hover:border-[#5850ec]/40 disabled:opacity-40"
          >
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={32} />
        </div>
      ) : linhas.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border border-dashed rounded-xl">
          Nenhum pedido em {dataFmt}.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b bg-gray-50">
                  <th className="py-3 px-3 text-left">Hora</th>
                  <th className="py-3 px-2 text-center">150g</th>
                  <th className="py-3 px-2 text-center">200g</th>
                  <th className="py-3 px-2 text-center">300g</th>
                  <th className="py-3 px-2 text-center">400g</th>
                  <th className="py-3 px-2 text-center">Sopas</th>
                  <th className="py-3 px-2 text-center">Person.</th>
                  <th className="py-3 px-3 text-right">Valor</th>
                  <th className="py-3 px-3 text-left">Pgto</th>
                  <th className="py-3 px-3 text-left">Modo</th>
                  <th className="py-3 px-3 text-right">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {linhas.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-gray-500">{l.hora}</td>
                    <td className="py-2.5 px-2 text-center">{l.c150 || "-"}</td>
                    <td className="py-2.5 px-2 text-center">{l.m200 || "-"}</td>
                    <td className="py-2.5 px-2 text-center">{l.m300 || "-"}</td>
                    <td className="py-2.5 px-2 text-center">{l.m400 || "-"}</td>
                    <td className="py-2.5 px-2 text-center">{l.sopas || "-"}</td>
                    <td className="py-2.5 px-2 text-center">{l.personalizadas || "-"}</td>
                    <td className="py-2.5 px-3 text-right font-semibold">{brl(l.valor)}</td>
                    <td className="py-2.5 px-3 text-gray-600">{l.pagamento}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {l.modo}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-500">
                      {l.taxa > 0 ? brl(l.taxa) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-black bg-gray-50 border-t-2">
                  <td className="py-3 px-3 text-gray-500 uppercase text-xs">Total</td>
                  <td className="py-3 px-2 text-center text-[#5850ec]">{totais.c150}</td>
                  <td className="py-3 px-2 text-center text-[#5850ec]">{totais.m200}</td>
                  <td className="py-3 px-2 text-center text-[#5850ec]">{totais.m300}</td>
                  <td className="py-3 px-2 text-center text-[#5850ec]">{totais.m400}</td>
                  <td className="py-3 px-2 text-center text-[#5850ec]">{totais.sopas}</td>
                  <td className="py-3 px-2 text-center text-[#5850ec]">{totais.personalizadas}</td>
                  <td className="py-3 px-3 text-right text-green-600">{brl(totais.valor)}</td>
                  <td></td>
                  <td></td>
                  <td className="py-3 px-3 text-right text-gray-600">{brl(totais.taxa)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo, useState } from "react";
import { Printer, ShoppingCart } from "lucide-react";

const n = (v: unknown) => Number(v || 0);
const dinheiro = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatarQtd = (qtd: number, unidade: "g" | "un") => {
  if (unidade === "un") return `${Math.ceil(qtd).toLocaleString("pt-BR")} un`;
  if (qtd >= 1000) return `${(qtd / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
  return `${Math.ceil(qtd).toLocaleString("pt-BR")} g`;
};

export function ListaCompras({ dataProducao, necessidades = [], estoque = [] }: any) {
  const [mostrarTodos, setMostrarTodos] = useState(false);

  const linhas = useMemo(() => {
    return (necessidades as any[]).map((x: any) => {
      const saldo = (estoque as any[]).find((e: any) => e.ingrediente_id === x.id);
      const disponivel = Math.max(0, n(saldo?.quantidade_atual));
      const necessario = Math.max(0, n(x.quantidade));
      const comprar = x.qb ? 0 : Math.max(0, necessario - disponivel);
      const custoUnitario = x.unidade === "un" ? n(x.item?.custo_por_unidade) : n(x.item?.custo_por_kg) / 1000;
      return {
        ...x,
        disponivel,
        necessario,
        comprar,
        custoEstimado: comprar * custoUnitario,
      };
    });
  }, [necessidades, estoque]);

  const faltantes = linhas.filter((x: any) => x.qb || x.comprar > 0);
  const visiveis = mostrarTodos ? linhas : faltantes;
  const custoTotal = faltantes.reduce((s: number, x: any) => s + n(x.custoEstimado), 0);
  const suficientes = linhas.filter((x: any) => !x.qb && x.comprar <= 0).length;

  const imprimir = () => {
    const area = document.getElementById("lista-compras-impressao");
    if (!area) return;
    const janela = window.open("", "_blank", "width=900,height=800");
    if (!janela) return;
    janela.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Lista de compras</title><style>@page{size:A4;margin:10mm}body{font-family:Arial,sans-serif;color:#173a2d;font-size:11px}h2{margin:0 0 4px}p{margin:0 0 10px}table{width:100%;border-collapse:collapse}th,td{padding:7px 6px;border-bottom:1px solid #dbe7dd;text-align:left}th{font-size:10px;text-transform:uppercase;color:#527164}.right{text-align:right}.muted{color:#62766b}strong{color:#087443}</style></head><body>${area.innerHTML}</body></html>`);
    janela.document.close();
    janela.focus();
    setTimeout(() => { janela.print(); janela.close(); }, 200);
  };

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Lista de compras</h2>
          <p className="mt-1 text-sm text-[#62766b]">Calculada pela produção planejada de {new Date(`${dataProducao}T12:00:00`).toLocaleDateString("pt-BR")} menos o estoque atual de ingredientes.</p>
        </div>
        <button onClick={imprimir} className="flex items-center gap-2 rounded-xl border border-[#b9d0c0] bg-white px-4 py-2.5 text-sm font-bold text-[#087443] hover:bg-[#f3f8f4]"><Printer size={17} />Imprimir lista</button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl bg-[#fff4d9] p-4 text-[#8b5a00]"><p className="text-xs font-bold">Itens para comprar</p><p className="text-2xl font-black">{faltantes.length}</p></article>
        <article className="rounded-2xl bg-[#e0f2e7] p-4 text-[#087443]"><p className="text-xs font-bold">Estoque suficiente</p><p className="text-2xl font-black">{suficientes}</p></article>
        <article className="rounded-2xl bg-white p-4 text-[#173a2d] shadow-sm ring-1 ring-[#dbe7dd]"><p className="text-xs font-bold text-[#62766b]">Custo estimado da reposição</p><p className="text-2xl font-black">{dinheiro(custoTotal)}</p></article>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[#62766b]">{faltantes.length ? "Mostrando apenas o que precisa de reposição." : "O estoque cobre toda a produção planejada deste dia."}</p>
        <button onClick={() => setMostrarTodos((v) => !v)} className="text-sm font-bold text-[#087443]">{mostrarTodos ? "Mostrar só faltantes" : "Ver todos os ingredientes"}</button>
      </div>

      <div id="lista-compras-impressao" className="overflow-hidden rounded-2xl border bg-white">
        <div className="hidden print:block">
          <h2>Lista de compras — SaborosaMente</h2>
          <p>Produção de {new Date(`${dataProducao}T12:00:00`).toLocaleDateString("pt-BR")}</p>
        </div>
        {!visiveis.length ? (
          <div className="grid min-h-40 place-items-center p-6 text-center text-sm text-[#62766b]">Nenhum ingrediente precisa ser comprado para a produção selecionada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-[#f4f8f4] text-left text-xs uppercase text-[#527164]"><tr><th className="px-4 py-3">Ingrediente</th><th className="px-4 py-3">Necessário</th><th className="px-4 py-3">Em estoque</th><th className="px-4 py-3">Comprar</th><th className="px-4 py-3 text-right">Estimativa</th></tr></thead>
              <tbody>
                {visiveis.map((x: any) => (
                  <tr key={x.id} className="border-t border-[#edf1ed]">
                    <td className="px-4 py-3"><div className="font-bold">{x.item?.nome}</div>{x.pratos?.length ? <div className="mt-0.5 text-xs text-[#62766b]">Usado em: {x.pratos.join(" · ")}</div> : null}</td>
                    <td className="px-4 py-3 font-semibold">{x.qb ? "a gosto" : formatarQtd(x.necessario, x.unidade)}</td>
                    <td className="px-4 py-3">{formatarQtd(x.disponivel, x.unidade)}</td>
                    <td className="px-4 py-3"><strong>{x.qb ? "conferir estoque" : x.comprar > 0 ? formatarQtd(x.comprar, x.unidade) : "—"}</strong></td>
                    <td className="px-4 py-3 text-right font-bold">{x.qb ? "—" : dinheiro(x.custoEstimado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#edf5e6] p-3 text-sm text-[#315e49]"><ShoppingCart size={18} /><span>Os valores usam o custo cadastrado em cada ingrediente e servem como estimativa. Ao atualizar o último valor pago, a previsão também muda.</span></div>
    </section>
  );
}

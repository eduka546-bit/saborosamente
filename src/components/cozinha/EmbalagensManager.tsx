import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const brl = (v: unknown) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function EmbalagensManager() {
  const qc = useQueryClient();
  const { data: embalagens = [], isLoading } = useQuery({
    queryKey: ["coz-embalagens"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cozinha_embalagens").select("*").order("nome");
      if (error) throw error;
      return data || [];
    },
  });
  const [salvando, setSalvando] = useState<string | null>(null);
  const [edicoes, setEdicoes] = useState<Record<string, any>>({});
  const valor = (item: any, campo: string) => edicoes[item.id]?.[campo] ?? item[campo] ?? "";
  const editar = (id: string, campo: string, novo: any) => setEdicoes((e) => ({ ...e, [id]: { ...(e[id] || {}), [campo]: novo } }));

  async function salvar(item: any) {
    setSalvando(item.id);
    try {
      const patch = edicoes[item.id] || {};
      const { error } = await supabase.from("cozinha_embalagens").update({
        custo_unitario: Number(patch.custo_unitario ?? item.custo_unitario ?? 0),
        estoque_atual: Number(patch.estoque_atual ?? item.estoque_atual ?? 0),
        estoque_minimo: Number(patch.estoque_minimo ?? item.estoque_minimo ?? 0),
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
      if (error) throw error;
      setEdicoes((e) => { const n = { ...e }; delete n[item.id]; return n; });
      await qc.invalidateQueries({ queryKey: ["coz-embalagens"] });
      toast.success(`${item.nome} atualizado.`);
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível salvar.");
    } finally {
      setSalvando(null);
    }
  }

  if (isLoading) return <p className="text-sm text-[#62766b]">Carregando embalagens…</p>;

  return <section>
    <div className="mb-5 flex items-start gap-3 rounded-2xl bg-[#edf5e6] p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#087443] text-white"><Package size={20}/></div>
      <div><h2 className="font-black text-[#173a2d]">Embalagens e etiquetas</h2><p className="mt-1 text-sm text-[#62766b]">Custos entram automaticamente no custo final das fichas técnicas.</p></div>
    </div>
    <div className="grid gap-3 xl:grid-cols-2">
      {(embalagens as any[]).map((item) => {
        const ehEtiqueta = item.categoria === "etiqueta";
        const estoque = Number(valor(item, "estoque_atual") || 0);
        const porEstoque = Number(item.unidades_por_estoque || 1);
        return <article key={item.id} className="rounded-2xl border border-[#dbe7dd] bg-white p-4">
          <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-[#173a2d]">{item.nome}</h3><p className="mt-1 text-xs text-[#62766b]">{ehEtiqueta ? `${porEstoque} etiquetas por folha` : "1 unidade por item produzido"}</p></div><span className="rounded-full bg-[#edf5e6] px-2.5 py-1 text-xs font-bold text-[#087443]">{brl(valor(item, "custo_unitario"))}</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-bold text-[#527164]">Custo unitário<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" type="number" step="0.01" min="0" value={valor(item, "custo_unitario")} onChange={(e)=>editar(item.id,"custo_unitario",e.target.value)}/></label>
            <label className="text-xs font-bold text-[#527164]">Estoque atual ({ehEtiqueta ? "folhas" : "un"})<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" type="number" step="1" min="0" value={valor(item, "estoque_atual")} onChange={(e)=>editar(item.id,"estoque_atual",e.target.value)}/></label>
            <label className="text-xs font-bold text-[#527164]">Estoque mínimo<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" type="number" step="1" min="0" value={valor(item, "estoque_minimo")} onChange={(e)=>editar(item.id,"estoque_minimo",e.target.value)}/></label>
          </div>
          {ehEtiqueta && <div className="mt-3 rounded-xl bg-[#f7f9f6] p-3 text-sm text-[#52695f]"><b>{estoque.toLocaleString("pt-BR")} folhas</b> = {(estoque * porEstoque).toLocaleString("pt-BR")} etiquetas disponíveis</div>}
          <div className="mt-4 flex justify-end"><button onClick={()=>salvar(item)} disabled={salvando===item.id} className="inline-flex items-center gap-2 rounded-lg bg-[#087443] px-3 py-2 text-sm font-bold text-white disabled:opacity-60"><Save size={15}/>{salvando===item.id?"Salvando…":"Salvar"}</button></div>
        </article>;
      })}
    </div>
  </section>;
}

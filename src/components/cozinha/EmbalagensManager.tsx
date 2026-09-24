import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Save, X } from "lucide-react";
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
  const [novoAberto, setNovoAberto] = useState(false);
  const [novo, setNovo] = useState({
    nome: "",
    categoria: "",
    custo_unitario: "",
    estoque_atual: "0",
    estoque_minimo: "0",
    unidades_por_estoque: "1",
    observacao: "",
  });
  const valor = (item: any, campo: string) => edicoes[item.id]?.[campo] ?? item[campo] ?? "";
  const editar = (id: string, campo: string, novo: any) => setEdicoes((e) => ({ ...e, [id]: { ...(e[id] || {}), [campo]: novo } }));

  async function salvar(item: any) {
    setSalvando(item.id);
    try {
      const patch = edicoes[item.id] || {};
      const { error } = await supabase.from("cozinha_embalagens").update({
        nome: String(patch.nome ?? item.nome ?? "").trim(),
        custo_unitario: Number(patch.custo_unitario ?? item.custo_unitario ?? 0),
        estoque_atual: Number(patch.estoque_atual ?? item.estoque_atual ?? 0),
        estoque_minimo: Number(patch.estoque_minimo ?? item.estoque_minimo ?? 0),
        unidades_por_estoque: Math.max(1, Number(patch.unidades_por_estoque ?? item.unidades_por_estoque ?? 1)),
        observacao: String(patch.observacao ?? item.observacao ?? "").trim() || null,
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

  async function cadastrarNovo() {
    const nome = novo.nome.trim();
    const categoria = novo.categoria.trim();
    if (!nome || !categoria) return toast.error("Informe nome e categoria do insumo.");
    setSalvando("novo");
    try {
      const { error } = await supabase.from("cozinha_embalagens").insert({
        nome,
        categoria,
        custo_unitario: Number(novo.custo_unitario || 0),
        estoque_atual: Number(novo.estoque_atual || 0),
        estoque_minimo: Number(novo.estoque_minimo || 0),
        unidades_por_estoque: Math.max(1, Number(novo.unidades_por_estoque || 1)),
        observacao: novo.observacao.trim() || null,
        ativo: true,
      });
      if (error) {
        if (error.code === "23505") throw new Error("Já existe um insumo nessa categoria. Edite o cadastro existente para manter uma única fonte de custo.");
        throw error;
      }
      setNovo({ nome: "", categoria: "", custo_unitario: "", estoque_atual: "0", estoque_minimo: "0", unidades_por_estoque: "1", observacao: "" });
      setNovoAberto(false);
      await qc.invalidateQueries({ queryKey: ["coz-embalagens"] });
      toast.success("Insumo de embalagem cadastrado.");
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível cadastrar.");
    } finally {
      setSalvando(null);
    }
  }

  if (isLoading) return <p className="text-sm text-[#62766b]">Carregando embalagens…</p>;

  return <section>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-[#edf5e6] p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#087443] text-white"><Package size={20}/></div>
        <div><h2 className="font-black text-[#173a2d]">Embalagens e etiquetas</h2><p className="mt-1 text-sm text-[#62766b]">Fonte única dos custos fixos por unidade. Alterações aqui recalculam fichas técnicas, Cardápio Completo, custos e lucros.</p></div>
      </div>
      <button onClick={()=>setNovoAberto((v)=>!v)} className="inline-flex items-center gap-2 rounded-xl bg-[#087443] px-3 py-2 text-sm font-bold text-white">
        {novoAberto?<X size={16}/>:<Plus size={16}/>}
        {novoAberto?"Fechar":"Novo insumo"}
      </button>
    </div>
    {novoAberto && <div className="mb-5 rounded-2xl border border-[#cfe1d3] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-wide text-[#087443]">Cadastrar insumo</p>
      <p className="mt-1 text-xs text-[#62766b]">Categorias padrão usadas automaticamente nos custos: marmita_200, marmita_300, marmita_400, sopa e etiqueta. Cada categoria pode existir apenas uma vez.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-bold text-[#527164]">Nome<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" value={novo.nome} onChange={(e)=>setNovo({...novo,nome:e.target.value})} placeholder="Ex.: Embalagem 250ml (200g)"/></label>
        <label className="text-xs font-bold text-[#527164]">Categoria<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" value={novo.categoria} onChange={(e)=>setNovo({...novo,categoria:e.target.value})} placeholder="Ex.: marmita_200"/></label>
        <label className="text-xs font-bold text-[#527164]">Custo unitário<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" type="number" min="0" step="0.01" value={novo.custo_unitario} onChange={(e)=>setNovo({...novo,custo_unitario:e.target.value})}/></label>
        <label className="text-xs font-bold text-[#527164]">Unidades por estoque<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" type="number" min="1" step="1" value={novo.unidades_por_estoque} onChange={(e)=>setNovo({...novo,unidades_por_estoque:e.target.value})}/></label>
        <label className="text-xs font-bold text-[#527164]">Estoque atual<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" type="number" min="0" step="1" value={novo.estoque_atual} onChange={(e)=>setNovo({...novo,estoque_atual:e.target.value})}/></label>
        <label className="text-xs font-bold text-[#527164]">Estoque mínimo<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" type="number" min="0" step="1" value={novo.estoque_minimo} onChange={(e)=>setNovo({...novo,estoque_minimo:e.target.value})}/></label>
        <label className="text-xs font-bold text-[#527164] md:col-span-2">Observação<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" value={novo.observacao} onChange={(e)=>setNovo({...novo,observacao:e.target.value})}/></label>
      </div>
      <div className="mt-3 flex justify-end"><button onClick={cadastrarNovo} disabled={salvando==="novo"} className="rounded-lg bg-[#087443] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{salvando==="novo"?"Salvando…":"Cadastrar insumo"}</button></div>
    </div>}
    <div className="grid gap-3 xl:grid-cols-2">
      {(embalagens as any[]).map((item) => {
        const ehEtiqueta = item.categoria === "etiqueta";
        const estoque = Number(valor(item, "estoque_atual") || 0);
        const porEstoque = Number(item.unidades_por_estoque || 1);
        return <article key={item.id} className="rounded-2xl border border-[#dbe7dd] bg-white p-4">
          <div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-[#173a2d]">{item.nome}</h3><p className="mt-1 text-xs text-[#62766b]">{ehEtiqueta ? `${porEstoque} etiquetas por folha` : "1 unidade por item produzido"}</p></div><span className="rounded-full bg-[#edf5e6] px-2.5 py-1 text-xs font-bold text-[#087443]">{brl(valor(item, "custo_unitario"))}</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <label className="text-xs font-bold text-[#527164]">Nome<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" value={valor(item, "nome")} onChange={(e)=>editar(item.id,"nome",e.target.value)}/></label>
            <label className="text-xs font-bold text-[#527164]">Categoria<input className="mt-1 w-full rounded-lg border border-[#dbe7dd] bg-[#f5f7f5] p-2.5 text-sm text-[#62766b]" value={item.categoria} readOnly/></label>
            <label className="text-xs font-bold text-[#527164]">Custo unitário<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" type="number" step="0.01" min="0" value={valor(item, "custo_unitario")} onChange={(e)=>editar(item.id,"custo_unitario",e.target.value)}/></label>
            <label className="text-xs font-bold text-[#527164]">Estoque atual ({ehEtiqueta ? "folhas" : "un"})<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" type="number" step="1" min="0" value={valor(item, "estoque_atual")} onChange={(e)=>editar(item.id,"estoque_atual",e.target.value)}/></label>
            <label className="text-xs font-bold text-[#527164]">Estoque mínimo<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" type="number" step="1" min="0" value={valor(item, "estoque_minimo")} onChange={(e)=>editar(item.id,"estoque_minimo",e.target.value)}/></label>
            <label className="text-xs font-bold text-[#527164]">Unidades por estoque<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" type="number" step="1" min="1" value={valor(item, "unidades_por_estoque")} onChange={(e)=>editar(item.id,"unidades_por_estoque",e.target.value)}/></label>
            <label className="text-xs font-bold text-[#527164] sm:col-span-2 xl:col-span-3">Observação<input className="mt-1 w-full rounded-lg border border-[#cbd8ce] p-2.5 text-sm" value={valor(item, "observacao")} onChange={(e)=>editar(item.id,"observacao",e.target.value)}/></label>
          </div>
          {ehEtiqueta && <div className="mt-3 rounded-xl bg-[#f7f9f6] p-3 text-sm text-[#52695f]"><b>{estoque.toLocaleString("pt-BR")} folhas</b> = {(estoque * porEstoque).toLocaleString("pt-BR")} etiquetas disponíveis</div>}
          <div className="mt-4 flex justify-end"><button onClick={()=>salvar(item)} disabled={salvando===item.id} className="inline-flex items-center gap-2 rounded-lg bg-[#087443] px-3 py-2 text-sm font-bold text-white disabled:opacity-60"><Save size={15}/>{salvando===item.id?"Salvando…":"Salvar"}</button></div>
        </article>;
      })}
    </div>
  </section>;
}

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, PackageOpen, Plus, Store, Truck } from "lucide-react";

const input = "w-full rounded-lg border border-[#cbd8ce] bg-white p-2.5 text-sm outline-none focus:border-[#087443]";
const btn = "inline-flex items-center justify-center gap-2 rounded-xl bg-[#087443] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#065f37] disabled:opacity-50";
const btnLight = "inline-flex items-center justify-center gap-2 rounded-xl border border-[#cbd8ce] bg-white px-3 py-2 text-sm font-bold text-[#355445] hover:bg-[#f4f7f4]";

type Aba = "lotes" | "perdas" | "fornecedores" | "entradas";

function moeda(v: unknown) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function dataBR(v: unknown) {
  if (!v) return "—";
  return new Date(`${String(v).slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");
}

export function GestaoOperacional() {
  const qc = useQueryClient();
  const [aba, setAba] = useState<Aba>("lotes");
  const [fornecedorForm, setFornecedorForm] = useState({ nome: "", contato: "", telefone: "", email: "", observacao: "" });
  const [compraForm, setCompraForm] = useState({ fornecedor_id: "", ingrediente_id: "", quantidade_kg: "", valor_kg: "", data_compra: new Date().toISOString().slice(0, 10), numero_documento: "", observacao: "" });
  const [perdaForm, setPerdaForm] = useState({ tipo: "ingrediente", ingrediente_id: "", produto_id: "", tamanho: "300", lote_id: "", quantidade: "", motivo: "", observacao: "" });

  const { data: ingredientes = [] } = useQuery({ queryKey: ["gestao-ing"], queryFn: async () => { const { data, error } = await supabase.from("cozinha_ingredientes").select("id,nome,unidade_medida,custo_por_kg").order("nome"); if (error) throw error; return data ?? []; } });
  const { data: produtos = [] } = useQuery({ queryKey: ["gestao-prod"], queryFn: async () => { const { data, error } = await supabase.from("produtos").select("id,nome,tipo_produto").eq("ativo", true).order("nome"); if (error) throw error; return data ?? []; } });
  const { data: lotes = [] } = useQuery({ queryKey: ["gestao-lotes"], queryFn: async () => { const { data, error } = await supabase.from("cozinha_lotes_producao").select("*").order("created_at", { ascending: false }).limit(250); if (error) throw error; return data ?? []; } });
  const { data: perdas = [] } = useQuery({ queryKey: ["gestao-perdas"], queryFn: async () => { const { data, error } = await supabase.from("cozinha_perdas").select("*").order("created_at", { ascending: false }).limit(100); if (error) throw error; return data ?? []; } });
  const { data: fornecedores = [] } = useQuery({ queryKey: ["gestao-fornecedores"], queryFn: async () => { const { data, error } = await supabase.from("cozinha_fornecedores").select("*").order("nome"); if (error) throw error; return data ?? []; } });
  const { data: compras = [] } = useQuery({ queryKey: ["gestao-compras"], queryFn: async () => { const { data, error } = await supabase.from("cozinha_compras").select("*").order("created_at", { ascending: false }).limit(100); if (error) throw error; return data ?? []; } });
  const { data: compraItens = [] } = useQuery({ queryKey: ["gestao-compra-itens"], queryFn: async () => { const { data, error } = await supabase.from("cozinha_compra_itens").select("*").order("created_at", { ascending: false }).limit(150); if (error) throw error; return data ?? []; } });

  const nomeProduto = useMemo(() => new Map((produtos as any[]).map((x) => [x.id, x.nome])), [produtos]);
  const nomeIngrediente = useMemo(() => new Map((ingredientes as any[]).map((x) => [x.id, x.nome])), [ingredientes]);
  const nomeFornecedor = useMemo(() => new Map((fornecedores as any[]).map((x) => [x.id, x.nome])), [fornecedores]);

  const salvarFornecedor = useMutation({
    mutationFn: async () => {
      if (!fornecedorForm.nome.trim()) throw new Error("Informe o nome do fornecedor.");
      const { error } = await supabase.from("cozinha_fornecedores").insert({ ...fornecedorForm, nome: fornecedorForm.nome.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setFornecedorForm({ nome: "", contato: "", telefone: "", email: "", observacao: "" }); qc.invalidateQueries({ queryKey: ["gestao-fornecedores"] }); toast.success("Fornecedor cadastrado."); },
    onError: (e: any) => toast.error(e.message),
  });

  const salvarCompra = useMutation({
    mutationFn: async () => {
      const qtdKg = Number(String(compraForm.quantidade_kg).replace(",", "."));
      const valorKg = Number(String(compraForm.valor_kg).replace(",", "."));
      if (!compraForm.ingrediente_id || !(qtdKg > 0) || !(valorKg >= 0)) throw new Error("Preencha ingrediente, quantidade e valor.");
      const { error } = await supabase.rpc("registrar_compra_ingrediente_cozinha", {
        p_fornecedor_id: compraForm.fornecedor_id || null,
        p_ingrediente_id: compraForm.ingrediente_id,
        p_quantidade: qtdKg * 1000,
        p_valor_unitario: valorKg / 1000,
        p_data_compra: compraForm.data_compra,
        p_numero_documento: compraForm.numero_documento || null,
        p_observacao: compraForm.observacao || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { setCompraForm((x) => ({ ...x, ingrediente_id: "", quantidade_kg: "", valor_kg: "", numero_documento: "", observacao: "" })); ["gestao-compras","gestao-compra-itens","coz-estoque","coz-ing","gestao-ing"].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); toast.success("Compra registrada e estoque atualizado."); },
    onError: (e: any) => toast.error(e.message),
  });

  const salvarPerda = useMutation({
    mutationFn: async () => {
      const q = Number(String(perdaForm.quantidade).replace(",", "."));
      if (!(q > 0) || !perdaForm.motivo.trim()) throw new Error("Informe quantidade e motivo.");
      const ingrediente = perdaForm.tipo === "ingrediente";
      const quantidadeBanco = ingrediente ? q * 1000 : q;
      const { error } = await supabase.rpc("registrar_perda_cozinha", {
        p_tipo: perdaForm.tipo,
        p_quantidade: quantidadeBanco,
        p_motivo: perdaForm.motivo,
        p_ingrediente_id: ingrediente ? perdaForm.ingrediente_id || null : null,
        p_produto_id: !ingrediente ? perdaForm.produto_id || null : null,
        p_tamanho: !ingrediente ? perdaForm.tamanho : null,
        p_lote_id: !ingrediente ? perdaForm.lote_id || null : null,
        p_observacao: perdaForm.observacao || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { setPerdaForm((x) => ({ ...x, quantidade: "", motivo: "", observacao: "", lote_id: "" })); ["gestao-perdas","gestao-lotes","coz-estoque","coz-estoque-marmitas"].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); toast.success("Perda registrada e estoque corrigido."); },
    onError: (e: any) => toast.error(e.message),
  });

  const lotesDoProduto = (lotes as any[]).filter((l) => !perdaForm.produto_id || l.produto_id === perdaForm.produto_id).filter((l) => !perdaForm.tamanho || l.tamanho === perdaForm.tamanho).filter((l) => Number(l.quantidade_disponivel || 0) > 0);
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const lotesVencendo = (lotes as any[]).filter((l) => l.data_validade && new Date(`${l.data_validade}T12:00:00`).getTime() <= hoje.getTime() + 30*86400000 && Number(l.quantidade_disponivel || 0) > 0).length;
  const perdasMes = (perdas as any[]).filter((p) => String(p.created_at).slice(0,7) === new Date().toISOString().slice(0,7)).length;
  const comprasMes = (compras as any[]).filter((p) => String(p.data_compra).slice(0,7) === new Date().toISOString().slice(0,7)).reduce((s,p) => s + Number(p.valor_total || 0),0);

  return <section>
    <div className="mb-5">
      <h2 className="text-2xl font-black text-[#173a2d]">Gestão operacional</h2>
      <p className="mt-1 text-sm text-[#62766b]">Rastreie lotes e validade, registre perdas reais e mantenha fornecedores e entradas de ingredientes no mesmo fluxo.</p>
    </div>

    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl bg-[#fff4d9] p-4"><div className="flex items-center gap-2 text-[#8b5a00]"><CalendarClock size={18}/><b className="text-xs uppercase">Lotes vencendo</b></div><p className="mt-2 text-2xl font-black">{lotesVencendo}</p><p className="text-xs text-[#8b5a00]">em até 30 dias</p></div>
      <div className="rounded-2xl bg-[#fdeaea] p-4"><div className="flex items-center gap-2 text-red-700"><AlertTriangle size={18}/><b className="text-xs uppercase">Perdas no mês</b></div><p className="mt-2 text-2xl font-black">{perdasMes}</p><p className="text-xs text-red-600">registros</p></div>
      <div className="rounded-2xl bg-[#e8f1ff] p-4"><div className="flex items-center gap-2 text-blue-700"><Truck size={18}/><b className="text-xs uppercase">Compras no mês</b></div><p className="mt-2 text-2xl font-black">{moeda(comprasMes)}</p><p className="text-xs text-blue-600">entradas registradas</p></div>
    </div>

    <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#e7eee8] p-1 md:grid-cols-4">
      {[{id:"lotes",label:"Lotes e validade",icon:PackageOpen},{id:"perdas",label:"Perdas reais",icon:AlertTriangle},{id:"fornecedores",label:"Fornecedores",icon:Store},{id:"entradas",label:"Entradas / compras",icon:Truck}].map((x:any)=><button key={x.id} onClick={()=>setAba(x.id)} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold ${aba===x.id?"bg-white text-[#087443] shadow-sm":"text-[#62766b]"}`}><x.icon size={16}/>{x.label}</button>)}
    </div>

    {aba === "lotes" && <div className="rounded-2xl border bg-white overflow-hidden">
      <div className="border-b bg-[#f4f7f4] px-4 py-3"><h3 className="font-black">Lotes produzidos</h3><p className="text-xs text-[#62766b]">O lote é criado automaticamente ao marcar a produção como concluída. Preencha a validade conforme o padrão usado pela SaborosaMente.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead><tr className="text-left text-xs uppercase text-[#62766b]"><th className="p-3">Lote</th><th className="p-3">Produto</th><th className="p-3">Tam.</th><th className="p-3">Fabricação</th><th className="p-3">Validade</th><th className="p-3">Inicial</th><th className="p-3">Saldo</th></tr></thead><tbody>{(lotes as any[]).map((l)=><tr key={l.id} className="border-t"><td className="p-3 font-bold">{l.lote_codigo || "—"}</td><td className="p-3">{nomeProduto.get(l.produto_id) || "Produto"}</td><td className="p-3">{l.tamanho} g</td><td className="p-3">{dataBR(l.data_fabricacao)}</td><td className="p-3"><input type="date" className={input} value={l.data_validade || ""} onChange={async(e)=>{const {error}=await supabase.from("cozinha_lotes_producao").update({data_validade:e.target.value||null}).eq("id",l.id); if(error) toast.error(error.message); else qc.invalidateQueries({queryKey:["gestao-lotes"]});}}/></td><td className="p-3">{l.quantidade_inicial} un</td><td className="p-3 font-black text-[#087443]">{l.quantidade_disponivel} un</td></tr>)}</tbody></table></div>
      {!lotes.length && <p className="p-8 text-center text-sm text-[#62766b]">Nenhum lote criado ainda.</p>}
    </div>}

    {aba === "perdas" && <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <div className="rounded-2xl border bg-white p-4"><h3 className="font-black">Registrar perda</h3><p className="mb-4 mt-1 text-xs text-[#62766b]">Ao salvar, o saldo é baixado automaticamente do estoque correspondente.</p>
        <div className="grid gap-3">
          <label className="text-xs font-bold">Tipo<select className={input} value={perdaForm.tipo} onChange={e=>setPerdaForm({...perdaForm,tipo:e.target.value,lote_id:""})}><option value="ingrediente">Ingrediente</option><option value="marmita">Marmita pronta</option></select></label>
          {perdaForm.tipo === "ingrediente" ? <label className="text-xs font-bold">Ingrediente<select className={input} value={perdaForm.ingrediente_id} onChange={e=>setPerdaForm({...perdaForm,ingrediente_id:e.target.value})}><option value="">Selecione</option>{(ingredientes as any[]).map(i=><option key={i.id} value={i.id}>{i.nome}</option>)}</select></label> : <><label className="text-xs font-bold">Produto<select className={input} value={perdaForm.produto_id} onChange={e=>setPerdaForm({...perdaForm,produto_id:e.target.value,lote_id:""})}><option value="">Selecione</option>{(produtos as any[]).map(p=><option key={p.id} value={p.id}>{p.nome}</option>)}</select></label><label className="text-xs font-bold">Tamanho<select className={input} value={perdaForm.tamanho} onChange={e=>setPerdaForm({...perdaForm,tamanho:e.target.value,lote_id:""})}><option value="200">200 g</option><option value="300">300 g</option><option value="400">400 g</option></select></label><label className="text-xs font-bold">Lote (opcional)<select className={input} value={perdaForm.lote_id} onChange={e=>setPerdaForm({...perdaForm,lote_id:e.target.value})}><option value="">Sem vínculo de lote</option>{lotesDoProduto.map((l:any)=><option key={l.id} value={l.id}>{l.lote_codigo || l.id.slice(0,8)} · {l.quantidade_disponivel} un</option>)}</select></label></>}
          <label className="text-xs font-bold">Quantidade ({perdaForm.tipo === "ingrediente" ? "kg" : "unidades"})<input className={input} type="number" step="0.001" min="0" value={perdaForm.quantidade} onChange={e=>setPerdaForm({...perdaForm,quantidade:e.target.value})}/></label>
          <label className="text-xs font-bold">Motivo<select className={input} value={perdaForm.motivo} onChange={e=>setPerdaForm({...perdaForm,motivo:e.target.value})}><option value="">Selecione</option><option>Validade</option><option>Quebra / dano</option><option>Erro de produção</option><option>Qualidade</option><option>Contaminação</option><option>Outros</option></select></label>
          <label className="text-xs font-bold">Observação<textarea className={input} rows={3} value={perdaForm.observacao} onChange={e=>setPerdaForm({...perdaForm,observacao:e.target.value})}/></label>
          <button className={btn} disabled={salvarPerda.isPending} onClick={()=>salvarPerda.mutate()}><AlertTriangle size={16}/>Registrar perda</button>
        </div>
      </div>
      <div className="rounded-2xl border bg-white p-4"><h3 className="font-black">Últimas perdas</h3><div className="mt-3 grid gap-2">{(perdas as any[]).map(p=><div key={p.id} className="rounded-xl bg-[#f7f8f7] p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><b>{p.tipo === "ingrediente" ? nomeIngrediente.get(p.ingrediente_id) : nomeProduto.get(p.produto_id)}</b><span className="text-xs text-[#62766b]">{new Date(p.created_at).toLocaleString("pt-BR")}</span></div><p className="mt-1 text-[#62766b]">{p.motivo} · {p.tipo === "ingrediente" ? `${(Number(p.quantidade)/1000).toLocaleString("pt-BR")} kg` : `${p.quantidade} un · ${p.tamanho} g`}</p></div>)}{!perdas.length&&<p className="text-sm text-[#62766b]">Nenhuma perda registrada.</p>}</div></div>
    </div>}

    {aba === "fornecedores" && <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <div className="rounded-2xl border bg-white p-4"><h3 className="font-black">Novo fornecedor</h3><div className="mt-4 grid gap-3">{[["nome","Nome"],["contato","Contato"],["telefone","Telefone"],["email","E-mail"]].map(([k,l])=><label key={k} className="text-xs font-bold">{l}<input className={input} value={(fornecedorForm as any)[k]} onChange={e=>setFornecedorForm({...fornecedorForm,[k]:e.target.value})}/></label>)}<label className="text-xs font-bold">Observação<textarea className={input} rows={3} value={fornecedorForm.observacao} onChange={e=>setFornecedorForm({...fornecedorForm,observacao:e.target.value})}/></label><button className={btn} disabled={salvarFornecedor.isPending} onClick={()=>salvarFornecedor.mutate()}><Plus size={16}/>Cadastrar fornecedor</button></div></div>
      <div className="rounded-2xl border bg-white p-4"><h3 className="font-black">Fornecedores</h3><div className="mt-3 grid gap-2">{(fornecedores as any[]).map(f=><div key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f7f8f7] p-3"><div><b>{f.nome}</b><p className="text-xs text-[#62766b]">{[f.contato,f.telefone,f.email].filter(Boolean).join(" · ") || "Sem contato informado"}</p></div><button className={btnLight} onClick={async()=>{const {error}=await supabase.from("cozinha_fornecedores").update({ativo:!f.ativo,updated_at:new Date().toISOString()}).eq("id",f.id);if(error)toast.error(error.message);else qc.invalidateQueries({queryKey:["gestao-fornecedores"]});}}>{f.ativo?"Ativo":"Inativo"}</button></div>)}</div></div>
    </div>}

    {aba === "entradas" && <div className="grid gap-5 lg:grid-cols-[440px_1fr]">
      <div className="rounded-2xl border bg-white p-4"><h3 className="font-black">Registrar entrada / compra</h3><p className="mb-4 mt-1 text-xs text-[#62766b]">A quantidade entra no estoque e o último custo do ingrediente é atualizado.</p><div className="grid gap-3">
        <label className="text-xs font-bold">Fornecedor<select className={input} value={compraForm.fornecedor_id} onChange={e=>setCompraForm({...compraForm,fornecedor_id:e.target.value})}><option value="">Sem fornecedor</option>{(fornecedores as any[]).filter(f=>f.ativo).map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}</select></label>
        <label className="text-xs font-bold">Ingrediente<select className={input} value={compraForm.ingrediente_id} onChange={e=>setCompraForm({...compraForm,ingrediente_id:e.target.value})}><option value="">Selecione</option>{(ingredientes as any[]).map(i=><option key={i.id} value={i.id}>{i.nome}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">Quantidade (kg)<input className={input} type="number" step="0.001" min="0" value={compraForm.quantidade_kg} onChange={e=>setCompraForm({...compraForm,quantidade_kg:e.target.value})}/></label><label className="text-xs font-bold">Preço (R$/kg)<input className={input} type="number" step="0.01" min="0" value={compraForm.valor_kg} onChange={e=>setCompraForm({...compraForm,valor_kg:e.target.value})}/></label></div>
        <label className="text-xs font-bold">Data<input className={input} type="date" value={compraForm.data_compra} onChange={e=>setCompraForm({...compraForm,data_compra:e.target.value})}/></label>
        <label className="text-xs font-bold">Nota / documento<input className={input} value={compraForm.numero_documento} onChange={e=>setCompraForm({...compraForm,numero_documento:e.target.value})}/></label>
        <label className="text-xs font-bold">Observação<textarea className={input} rows={2} value={compraForm.observacao} onChange={e=>setCompraForm({...compraForm,observacao:e.target.value})}/></label>
        <button className={btn} disabled={salvarCompra.isPending} onClick={()=>salvarCompra.mutate()}><Truck size={16}/>Registrar compra</button>
      </div></div>
      <div className="rounded-2xl border bg-white p-4"><h3 className="font-black">Últimas compras</h3><div className="mt-3 grid gap-2">{(compras as any[]).map(c=>{const item=(compraItens as any[]).find(i=>i.compra_id===c.id);return <div key={c.id} className="rounded-xl bg-[#f7f8f7] p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><b>{item ? nomeIngrediente.get(item.ingrediente_id) : "Compra"}</b><b className="text-[#087443]">{moeda(c.valor_total)}</b></div><p className="mt-1 text-xs text-[#62766b]">{dataBR(c.data_compra)} · {nomeFornecedor.get(c.fornecedor_id) || "Sem fornecedor"}{c.numero_documento?` · ${c.numero_documento}`:""}</p>{item&&<p className="mt-1 text-xs text-[#62766b]">{(Number(item.quantidade)/1000).toLocaleString("pt-BR")} kg · {moeda(Number(item.valor_unitario)*1000)}/kg</p>}</div>})}{!compras.length&&<p className="text-sm text-[#62766b]">Nenhuma compra registrada.</p>}</div></div>
    </div>}
  </section>;
}

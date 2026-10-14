import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createQueryConfig } from "@/lib/query-config";
import { toast } from "sonner";
import { Check, Pencil, Plus, Tag, Tags, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Etiqueta = { id: string; nome: string; cor: string };
type Vinculo = { etiqueta_id: string; cliente_chave: string };

export function chaveEtiquetaCliente(cliente: any): string {
  let tel = String(cliente?.telefone || "").replace(/\D/g, "");
  if (tel.startsWith("55") && tel.length > 11) tel = tel.slice(2);
  if (/^\d{10,11}$/.test(tel)) return `tel:${tel}`;
  return String(cliente?.profileId ? `perfil:${cliente.profileId}` : cliente?.chave || "");
}

export function useEtiquetasClientes() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-client-tags"],
    ...createQueryConfig("clients"),
    queryFn: async () => {
      const [etiquetasResult, atribuicoes] = await Promise.all([
        (supabase as any).from("clientes_etiquetas").select("id,nome,cor").order("nome"),
        (async () => {
          const total: Vinculo[] = [];
          for (let inicio = 0; ; inicio += 500) {
            const { data, error } = await (supabase as any)
              .from("clientes_etiquetas_atribuicoes")
              .select("etiqueta_id,cliente_chave")
              .order("etiqueta_id")
              .order("cliente_chave")
              .range(inicio, inicio + 499);
            if (error) throw error;
            total.push(...(data || []));
            if (!data || data.length < 500) return total;
          }
        })(),
      ]);
      if (etiquetasResult.error) throw etiquetasResult.error;
      return { etiquetas: (etiquetasResult.data || []) as Etiqueta[], atribuicoes };
    },
  });
  const etiquetas = data?.etiquetas || [];
  const atribuicoes = data?.atribuicoes || [];
  const porCliente = useMemo(() => {
    const mapa = new Map<string, Set<string>>();
    for (const linha of atribuicoes) {
      const valores = mapa.get(linha.cliente_chave) || new Set<string>();
      valores.add(linha.etiqueta_id);
      mapa.set(linha.cliente_chave, valores);
    }
    return mapa;
  }, [atribuicoes]);
  const marcadas = (cliente: any) => porCliente.get(chaveEtiquetaCliente(cliente)) || new Set<string>();
  const doCliente = (cliente: any) => {
    const ids = marcadas(cliente);
    return etiquetas.filter((e) => ids.has(e.id));
  };
  const recarregar = () => qc.invalidateQueries({ queryKey: ["admin-client-tags"] });
  return { etiquetas, porCliente, marcadas, doCliente, recarregar, isLoading, isError };
}
type Controlador = ReturnType<typeof useEtiquetasClientes>;
export function EtiquetaPills({ cliente, controlador }: { cliente: any; controlador: Controlador }) {
  const marcadas = controlador.doCliente(cliente);
  if (!marcadas.length) return null;
  return <div className="mt-1.5 flex flex-wrap gap-1">
    {marcadas.map((e) => <span key={e.id} className="rounded-full border px-2 py-0.5 text-[11px] font-bold"
      style={{ backgroundColor: e.cor + "16", color: e.cor, borderColor: e.cor + "66" }}>{e.nome}</span>)}
  </div>;
}

export function GerenciarEtiquetasClientes({ controlador }: { controlador: Controlador }) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#086e45");
  const [editando, setEditando] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [corEdicao, setCorEdicao] = useState("#086e45");
  const [salvando, setSalvando] = useState(false);
  const criar = async () => {
    if (!nome.trim()) return toast.error("Informe um nome.");
    setSalvando(true);
    try {
      const { error } = await (supabase as any).from("clientes_etiquetas").insert({ nome: nome.trim(), cor });
      if (error) throw error;
      await controlador.recarregar();
      setNome("");
      toast.success("Etiqueta criada.");
    } catch (e: any) { toast.error(e?.code === "23505" ? "Já existe uma etiqueta com este nome." : e?.message || "Falha ao criar."); }
    finally { setSalvando(false); }
  };
  const salvar = async (id: string) => {
    if (!nomeEdicao.trim()) return toast.error("Informe um nome.");
    setSalvando(true);
    try {
      const { error } = await (supabase as any).from("clientes_etiquetas")
        .update({ nome: nomeEdicao.trim(), cor: corEdicao, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      await controlador.recarregar();
      setEditando(null);
      toast.success("Etiqueta atualizada em todos os clientes.");
    } catch (e: any) { toast.error(e?.code === "23505" ? "Já existe uma etiqueta com este nome." : e?.message || "Falha ao editar."); }
    finally { setSalvando(false); }
  };
  const excluir = async (etiqueta: Etiqueta) => {
    if (!window.confirm(`Excluir "${etiqueta.nome}" de todos os clientes?`)) return;
    setSalvando(true);
    try {
      const { error } = await (supabase as any).from("clientes_etiquetas").delete().eq("id", etiqueta.id);
      if (error) throw error;
      await controlador.recarregar();
      toast.success("Etiqueta excluída.");
    } catch (e: any) { toast.error(e?.message || "Falha ao excluir."); }
    finally { setSalvando(false); }
  };
  return <div className="mt-3">
    <Button variant="outline" type="button" size="sm" onClick={() => setAberto((x) => !x)}>
      <Tags size={16} className="mr-2"/> {aberto ? "Fechar gerenciador" : "Criar e editar etiquetas"}
    </Button>
    {aberto && <section className="mt-3 rounded-xl border border-[#cfe0d2] bg-[#f7faf6] p-3 sm:p-4" aria-label="Gerenciar etiquetas">
      <p className="mb-3 text-sm text-gray-600">Crie, renomeie e escolha as cores. Editar uma etiqueta atualiza todos os clientes que a utilizam.</p>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input aria-label="Nome da nova etiqueta" maxLength={48} placeholder="Nome da etiqueta" value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") criar(); }} className="min-w-[165px] max-w-sm flex-1 bg-white"/>
        <input aria-label="Cor da nova etiqueta" type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="size-10 cursor-pointer rounded-md border bg-white p-1"/>
        <Button disabled={salvando || !nome.trim()} onClick={criar} className="bg-[#086e45] text-white hover:bg-[#065a38]"><Plus size={15} className="mr-1"/> Criar</Button>
      </div>
      {controlador.isError && <p role="alert" className="text-sm text-red-700">Falha ao carregar as etiquetas. Recarregue a página.</p>}
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {controlador.etiquetas.map((e) => <div key={e.id} className="rounded-lg border bg-white p-2">
          {editando === e.id ? <div className="space-y-2">
            <Input maxLength={48} aria-label={`Editar nome de ${e.nome}`} value={nomeEdicao} onChange={(x) => setNomeEdicao(x.target.value)}/>
            <div className="flex items-center gap-2">
              <input type="color" aria-label={`Editar cor de ${e.nome}`} value={corEdicao} onChange={(x) => setCorEdicao(x.target.value)} className="size-9"/>
              <Button size="sm" disabled={salvando} onClick={() => salvar(e.id)}><Check size={14} className="mr-1"/>Salvar</Button>
              <Button variant="ghost" size="sm" onClick={() => setEditando(null)}>Cancelar</Button>
            </div>
          </div> : <div className="flex items-center gap-1.5">
            <span className="min-w-0 flex-1 truncate rounded-full border px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: e.cor + "18", color: e.cor, borderColor: e.cor + "77" }}>{e.nome}</span>
            <button type="button" title="Editar" aria-label={`Editar ${e.nome}`} className="rounded p-1.5 hover:bg-gray-100" onClick={() => { setEditando(e.id); setNomeEdicao(e.nome); setCorEdicao(e.cor); }}><Pencil size={15}/></button>
            <button type="button" title="Excluir" aria-label={`Excluir ${e.nome}`} disabled={salvando} className="rounded p-1.5 text-red-600 hover:bg-red-50" onClick={() => excluir(e)}><Trash2 size={15}/></button>
          </div>}
        </div>)}
      </div>
    </section>}
  </div>;
}

export function EtiquetasDoClienteEditor({ cliente, controlador }: { cliente: any; controlador: Controlador }) {
  const [salvando, setSalvando] = useState(false);
  const ids = controlador.marcadas(cliente);
  const alternar = async (id: string) => {
    const chave = chaveEtiquetaCliente(cliente);
    if (!chave) return toast.error("Cliente sem identificação.");
    setSalvando(true);
    try {
      const { error } = ids.has(id)
        ? await (supabase as any).from("clientes_etiquetas_atribuicoes").delete().eq("cliente_chave", chave).eq("etiqueta_id", id)
        : await (supabase as any).from("clientes_etiquetas_atribuicoes").insert({ cliente_chave: chave, etiqueta_id: id });
      if (error) throw error;
      await controlador.recarregar();
      toast.success(ids.has(id) ? "Etiqueta retirada." : "Etiqueta adicionada.");
    } catch (e: any) { toast.error(e?.message || "Falha ao salvar etiquetas."); }
    finally { setSalvando(false); }
  };
  return <section className="mb-6 rounded-xl border border-[#dbe7dd] bg-[#f7faf6] p-4">
    <h4 className="mb-1 flex items-center gap-2 font-bold text-[#075636]"><Tag size={17}/>Etiquetas do cliente</h4>
    <p className="mb-3 text-xs text-gray-600">Selecione uma ou várias etiquetas. Elas ficam salvas pelo telefone e também funcionam para pré-cadastros.</p>
    {controlador.isError && <p role="alert" className="text-sm text-red-700">Não foi possível carregar as etiquetas.</p>}
    <div className="flex flex-wrap gap-2">
      {controlador.etiquetas.map((e) => <button key={e.id} type="button" aria-pressed={ids.has(e.id)} disabled={salvando || controlador.isLoading}
        onClick={() => alternar(e.id)} className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold disabled:opacity-50 ${ids.has(e.id) ? "ring-2 ring-offset-1" : "opacity-65 hover:opacity-100"}`}
        style={{ backgroundColor: e.cor + (ids.has(e.id) ? "28" : "0d"), color: e.cor, borderColor: e.cor + "88" }}>
        {ids.has(e.id) ? <Check size={14}/> : <Plus size={14}/>} {e.nome}
      </button>)}
    </div>
    {!controlador.etiquetas.length && !controlador.isLoading && <p className="mt-2 text-sm text-gray-600">Nenhuma etiqueta cadastrada. Use Criar e editar etiquetas na listagem.</p>}
  </section>;
}

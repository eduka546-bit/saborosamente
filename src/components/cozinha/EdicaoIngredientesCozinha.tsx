import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Plus, RotateCcw, Trash2, Check, X } from "lucide-react";
import {
  aplicarIngredientesManuais, nomeNormalizado,
  type IngredienteManual, type NecessidadeCozinha, type UnidadeInsumo,
} from "@/lib/cozinha-ingredientes-manuais";

const campo = "min-h-10 min-w-0 w-full rounded-lg border border-[#cbdccf] bg-white px-3 text-sm text-[#173a2d] focus-visible:outline-[#087443]";
const numeroValido = (texto: string, zero = true): number | null => {
  if (!texto.trim()) return null;
  const valor = Number(texto.replace(",", "."));
  return Number.isFinite(valor) && valor >= (zero ? 0 : Number.EPSILON) && valor <= 100000000 ? valor : null;
};

export function useIngredientesManuais(inicio: string, fim: string, ativo = true) {
  const qc = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  const query = useQuery({
    queryKey: ["coz-ingredientes-manuais", inicio, fim],
    enabled: ativo && Boolean(inicio && fim),
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const todos: IngredienteManual[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await (supabase as any).from("cozinha_ingredientes_manuais")
          .select("*").gte("data_producao", inicio).lte("data_producao", fim)
          .order("data_producao").order("id")
          .range(offset, offset + 499);
        if (error) throw error;
        todos.push(...(data || []));
        if (!data || data.length < 500) break;
      }
      return todos;
    },
  });
  const recarregar = async () => {
    await qc.invalidateQueries({ queryKey: ["coz-ingredientes-manuais"] });
  };
  const executar = async (acao: () => Promise<any>, sucesso: string) => {
    if (salvando) return false;
    setSalvando(true);
    try {
      const { error } = await acao();
      if (error) throw error;
      await recarregar();
      toast.success(sucesso);
      return true;
    } catch (e: any) {
      toast.error(e?.code === "23505" ? "Esse ingrediente já foi adicionado para este dia." : e?.message || "Erro ao salvar ingrediente.");
      return false;
    } finally { setSalvando(false); }
  };
  const salvarAjuste = async (data: string, linha: NecessidadeCozinha, valor: number) => {
    const existente = (query.data || []).find((m) =>
      m.data_producao === data && m.tipo === "ajuste"
      && m.ingrediente_id === linha.id && m.unidade === linha.unidade);
    const dados = {
      data_producao: data, tipo: "ajuste", ingrediente_id: linha.id, nome: linha.item.nome,
      unidade: linha.unidade, quantidade: valor,
      referencia_original: linha.quantidadeReceita ?? linha.quantidade,
      updated_at: new Date().toISOString(),
    };
    return executar(async () => existente
      ? (supabase as any).from("cozinha_ingredientes_manuais").update(dados).eq("id", existente.id)
      : (supabase as any).from("cozinha_ingredientes_manuais").insert(dados),
      "Quantidade ajustada para este dia.");
  };
  const adicionar = async (
    data: string, nome: string, unidade: UnidadeInsumo, valor: number,
    calculados: NecessidadeCozinha[], catalogo: any[],
  ) => {
    const normalizado = nomeNormalizado(nome);
    if (!normalizado) { toast.error("Escreva o nome do ingrediente."); return false; }
    const ingrediente = catalogo.find((item) => nomeNormalizado(item.nome) === normalizado);
    if (ingrediente && ingrediente.unidade_medida !== unidade) {
      toast.error(`Este ingrediente está cadastrado em ${ingrediente.unidade_medida}. Escolha essa unidade para evitar erros.`);
      return false;
    }
    if (calculados.some((linha) => nomeNormalizado(linha.item?.nome || "") === normalizado && linha.unidade === unidade)) {
      toast.error("Ingrediente já listado pela receita. Use Editar quantidade na própria linha.");
      return false;
    }
    if ((query.data || []).some((m) => m.data_producao === data && m.tipo === "adicional"
      && nomeNormalizado(m.nome) === normalizado && m.unidade === unidade)) {
      toast.error("Este item já foi adicionado neste dia. Edite a quantidade dele.");
      return false;
    }
    return executar(() => (supabase as any).from("cozinha_ingredientes_manuais").insert({
      data_producao: data, tipo: "adicional", ingrediente_id: ingrediente?.id || null,
      nome: nome.trim(), unidade, quantidade: valor,
    }), "Item adicionado aos ingredientes e à lista de compras.");
  };
  const editarExtra = async (linha: IngredienteManual, nome: string, unidade: UnidadeInsumo, valor: number, catalogo: any[]) => {
    const normalizado = nomeNormalizado(nome);
    if (!normalizado) { toast.error("Informe o nome."); return false; }
    const ingrediente = catalogo.find((i) => nomeNormalizado(i.nome) === normalizado);
    if (ingrediente && ingrediente.unidade_medida !== unidade) {
      toast.error(`A unidade cadastrada de ${ingrediente.nome} é ${ingrediente.unidade_medida}.`);
      return false;
    }
    return executar(() => (supabase as any).from("cozinha_ingredientes_manuais").update({
      nome: nome.trim(), unidade, quantidade: valor, ingrediente_id: ingrediente?.id || null,
      marcado_em: null, updated_at: new Date().toISOString(),
    }).eq("id", linha.id), "Item manual atualizado.");
  };
  const excluir = async (id: string) => executar(
    () => (supabase as any).from("cozinha_ingredientes_manuais").delete().eq("id", id),
    "Ajuste manual removido.",
  );
  const marcarExtra = async (id: string, marcada: boolean) => executar(
    () => (supabase as any).from("cozinha_ingredientes_manuais")
      .update({ marcado_em: marcada ? new Date().toISOString() : null }).eq("id", id),
    marcada ? "Item separado." : "Item desmarcado.",
  );
  const doDia = (data: string) => (query.data || []).filter((m) => m.data_producao === data);
  return {
    ...query, dados: query.data || [], doDia, salvarAjuste, adicionar, editarExtra, excluir, marcarExtra, salvando,
    indisponivel: salvando || query.isLoading || query.isError,
  };
}
export type ControleIngredientesManuais = ReturnType<typeof useIngredientesManuais>;

export function NovaAdicaoIngrediente({ data, calculados, catalogo, controle }: {
  data: string; calculados: NecessidadeCozinha[]; catalogo: any[]; controle: ControleIngredientesManuais;
}) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [qtd, setQtd] = useState("");
  const [unidade, setUnidade] = useState<UnidadeInsumo>("g");
  return <div className="mt-3">
    <button type="button" onClick={() => setAberto((v) => !v)}
      className="flex items-center gap-1.5 rounded-lg border border-[#b9d0c0] bg-white px-3 py-2 text-xs font-bold text-[#087443] hover:bg-[#f0f7f1]">
      <Plus size={15} /> Adicionar ingrediente / item para comprar
    </button>
    {aberto && <div className="mt-2 rounded-xl border border-[#cfe2d1] bg-[#f7faf5] p-3">
      <p className="mb-2 text-xs text-[#52695f]">Item extra para {new Date(`${data}T12:00:00Z`).toLocaleDateString("pt-BR", {timeZone:"UTC"})}. Não altera a receita.</p>
      <div className="grid gap-2 sm:grid-cols-[minmax(120px,1fr)_110px_90px]">
        <label className="text-xs font-bold text-[#52695f]">Ingrediente ou compra
          <input className={campo} maxLength={120} value={nome} onChange={(e) => {
            setNome(e.target.value);
            const conhecido = catalogo.find((x) => nomeNormalizado(x.nome) === nomeNormalizado(e.target.value));
            if (conhecido && ["g","L","un"].includes(conhecido.unidade_medida)) setUnidade(conhecido.unidade_medida);
          }} list={`ingredientes-cadastrados-${data}`} placeholder="Ex.: Alho, filme plástico..." />
          <datalist id={`ingredientes-cadastrados-${data}`}>{catalogo.map((x) => <option key={x.id} value={x.nome}/>)}</datalist>
        </label>
        <label className="text-xs font-bold text-[#52695f]">Quantidade
          <input className={campo} type="number" inputMode="decimal" step="any" min="0.001"
            value={qtd} onChange={(e) => setQtd(e.target.value)} placeholder="Ex.: 500"/>
        </label>
        <label className="text-xs font-bold text-[#52695f]">Unidade
          <select className={campo} value={unidade} onChange={(e) => setUnidade(e.target.value as UnidadeInsumo)}>
            <option value="g">g</option><option value="L">L</option><option value="un">un</option>
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={controle.indisponivel} onClick={async () => {
          const valor = numeroValido(qtd, false);
          if (valor === null) return toast.error("Informe quantidade maior que zero.");
          if (await controle.adicionar(data,nome,unidade,valor,calculados,catalogo)) {
            setNome(""); setQtd(""); setAberto(false);
          }
        }} className="rounded-lg bg-[#087443] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
          Salvar item
        </button>
        <button type="button" onClick={() => setAberto(false)} className="rounded-lg border px-3 py-2 text-xs">Cancelar</button>
      </div>
    </div>}
  </div>;
}

export function EditarQuantidadeIngrediente({ data, linha, controle, catalogo }: {
  data: string; linha: NecessidadeCozinha; controle: ControleIngredientesManuais; catalogo: any[];
}) {
  const [editar, setEditar] = useState(false);
  const [valor, setValor] = useState(String(linha.quantidade));
  const [nome, setNome] = useState(linha.item.nome);
  const [unidade, setUnidade] = useState<UnidadeInsumo>(linha.unidade);
  const manual = controle.dados.find((m) => m.data_producao === data && m.id === linha.manualId);
  const puroExtra = Boolean(manual && linha.pratos.length === 1 && linha.pratos[0] === "Adicional manual");
  return <div className="mt-1">
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {linha.manual && <span className="font-semibold text-[#ac6b12]">
        {linha.adicional ? "Item adicionado manualmente" : "Quantidade ajustada"}
      </span>}
      {linha.revisaoNecessaria && <span className="font-bold text-red-700">Receita alterada: revisar quantidade</span>}
      <button type="button" onClick={() => { setEditar((x) => !x);setValor(String(linha.quantidade));setNome(linha.item.nome);setUnidade(linha.unidade); }}
        className="inline-flex items-center gap-1 font-semibold text-[#087443] underline underline-offset-2">
        <Pencil size={12}/> Editar{puroExtra ? " item" : " quantidade"}
      </button>
      {linha.ajusteId && <button type="button" disabled={controle.indisponivel} onClick={() => void controle.excluir(linha.ajusteId!)}
        className="flex items-center gap-1 text-[#a16207] disabled:opacity-50"><RotateCcw size={12}/>Voltar à receita</button>}
      {puroExtra && manual && <button type="button" disabled={controle.indisponivel}
        onClick={() => { if (window.confirm(`Retirar "${linha.item.nome}" dos ingredientes deste dia?`)) void controle.excluir(manual.id); }}
        className="flex items-center gap-1 text-red-700 disabled:opacity-50"><Trash2 size={12}/>Excluir</button>}
    </div>
    {editar && <div className="mt-2 rounded-lg border border-[#bcd8c6] bg-[#f8fbf8] p-2.5">
      {puroExtra && <label className="mb-2 block text-xs font-semibold">Nome do item
        <input className={campo} maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} />
      </label>}
      <div className="grid grid-cols-[minmax(0,1fr)_85px] gap-2">
        <label className="text-xs font-semibold">Quantidade necessária
          <input className={campo} type="number" min="0" step="any" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
        </label>
        {puroExtra && <label className="text-xs font-semibold">Unidade
          <select className={campo} value={unidade} onChange={(e) => setUnidade(e.target.value as UnidadeInsumo)}>
            <option value="g">g</option><option value="L">L</option><option value="un">un</option>
          </select>
        </label>}
        {!puroExtra && <span className="self-end pb-3 text-xs font-semibold text-[#52695f]">{linha.unidade}</span>}
      </div>
      <p className="mt-1 text-[11px] text-[#62766b]">Esta quantidade será utilizada nas compras, somente para este dia.</p>
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={controle.indisponivel} onClick={async () => {
          const q = numeroValido(valor, !puroExtra);
          if (q === null) return toast.error(puroExtra ? "Digite quantidade maior que zero." : "Informe uma quantidade válida.");
          const ok = puroExtra && manual
            ? await controle.editarExtra(manual,nome,unidade,q,catalogo)
            : await controle.salvarAjuste(data,linha,q);
          if(ok) setEditar(false);
        }} className="flex items-center gap-1 rounded-lg bg-[#087443] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Check size={13}/>Salvar</button>
        <button type="button" onClick={() => setEditar(false)} className="flex items-center gap-1 px-2 text-xs"><X size={13}/>Cancelar</button>
      </div>
    </div>}
  </div>;
}
export { aplicarIngredientesManuais };

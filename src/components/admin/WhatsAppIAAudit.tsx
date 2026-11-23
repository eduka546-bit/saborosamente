import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Download, Loader2, Play, ShieldCheck, Square, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { avaliarRespostaAuditoria, CENARIOS_AUDITORIA, type CenarioAuditoria } from "@/lib/whatsapp-ia-audit";

type Resultado = {
  id: number;
  categoria: string;
  pergunta: string;
  objetivo: string;
  resposta: string;
  classificacao: "sinalizada" | "revisao" | "erro";
  alertas: string[];
  parecer: "pendente" | "correta" | "incorreta";
  runId?: string;
  fonte?: "regra_verificada" | "modelo";
  observacoes?: string;
};
const money = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const STORAGE_KEY = "saborosamente:wa-auditoria-100:v1";

function exportarResultados(resultados: Resultado[]) {
  const conteudo = JSON.stringify({
    geradoEm: new Date().toISOString(),
    nota: "Resultados de IA em ambiente de simulação, sem envio de mensagens. Ausência de alerta não equivale à aprovação humana.",
    resultados,
  }, null, 2);
  const blob = new Blob([conteudo], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "auditoria-whatsapp-saborosamente.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}


const RODADA_FINAL_AUDITORIA = 4;

/** Carrega a rodada final completa; não retorna uma lista parcial como se fosse a revisão final. */
async function buscarAuditoriaFinal(): Promise<Resultado[]> {
  const db = supabase as any;
  const { data: lotes, error: erroLotes } = await db.from("whatsapp_ia_audit_runs")
    .select("id,rodada,estado").eq("rodada", RODADA_FINAL_AUDITORIA)
    .eq("estado", "concluido").order("criado_em", { ascending: false }).limit(20);
  if (erroLotes) throw erroLotes;
  const ids: string[] = (lotes ?? []).map((x: any) => String(x.id));
  if (ids.length !== 10) throw new Error("Não encontrei os 10 lotes completos da auditoria final.");

  const { data: rows, error: erroRespostas } = await db.from("whatsapp_ia_audit_results")
    .select("run_id,cenario_id,categoria,pergunta,resposta,alertas,status,erro,revisao,observacoes,fonte")
    .in("run_id", ids).order("cenario_id", { ascending: true }).range(0, 199);
  if (erroRespostas) throw erroRespostas;
  const nova: Resultado[] = (rows ?? []).map((x: any) => {
    const c = CENARIOS_AUDITORIA.find(q => q.id === x.cenario_id);
    const alertas = Array.isArray(x.alertas) ? x.alertas.map(String) : [];
    return {
      id: Number(x.cenario_id),
      categoria: String(x.categoria),
      pergunta: String(x.pergunta),
      objetivo: c?.objetivo ?? "Revisar com dados reais do site",
      resposta: String(x.resposta ?? ""),
      alertas,
      classificacao: x.status === "erro" ? "erro" : alertas.length ? "sinalizada" : "revisao",
      parecer: ["correta", "incorreta"].includes(x.revisao) ? x.revisao : "pendente",
      runId: String(x.run_id),
      observacoes: String(x.observacoes ?? ""),
      fonte: x.fonte === "regra_verificada" ? "regra_verificada" : "modelo",
    };
  });
  nova.sort((a, b) => a.id - b.id);
  if (nova.length !== 100 || new Set(nova.map(r => r.id)).size !== 100 ||
      nova[0]?.id !== 1 || nova[99]?.id !== 100) {
    throw new Error("A resposta do servidor veio incompleta (" + nova.length + " de 100).");
  }
  return nova;
}

export function WhatsAppIAAudit({ dark }: { dark: boolean }) {
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [executando, setExecutando] = useState(false);
  const [carregandoRevisao, setCarregandoRevisao] = useState(false);
  const [progresso, setProgresso] = useState({ atual: 0, total: 0 });
  const [mensagem, setMensagem] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [origemRelatorio, setOrigemRelatorio] = useState<"local" | "servidor" | "novo">("local");
  const [somenteSinalizados, setSomenteSinalizados] = useState(false);
  const cancelado = useRef(false);
  const categorias = [...new Set(CENARIOS_AUDITORIA.map(c => c.categoria))];
  useEffect(() => {
    let ativo = true;
    try {
      const salvo = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (Array.isArray(salvo) && salvo.length <= 100 &&
          salvo.every(item => Number.isInteger(item?.id) && typeof item?.pergunta === "string")) {
        setResultados(salvo);
        if (salvo.length) {
          setOrigemRelatorio("local");
          setProgresso({ atual: salvo.length, total: salvo.length });
        }
      }
    } catch { /* armazenamento indisponível */ }
    setCarregado(true);
    setCarregandoRevisao(true);
    setMensagem("Carregando automaticamente as 100 respostas finais do servidor...");
    void buscarAuditoriaFinal().then(nova => {
      if (!ativo) return;
      setResultados(nova);
      setOrigemRelatorio("servidor");
      setProgresso({ atual: nova.length, total: 100 });
      setMensagem("As 100 respostas finais estão carregadas. Confira da pergunta 001 à 100.");
    }).catch(e => {
      if (!ativo) return;
      setMensagem("Não foi possível carregar automaticamente as 100 respostas: " +
        (e instanceof Error ? e.message : "erro de conexão") + ". Use o botão de atualizar.");
    }).finally(() => { if (ativo) setCarregandoRevisao(false); });
    return () => { ativo = false; cancelado.current = true; };
  }, []);
  useEffect(() => {
    if (!carregado) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(resultados)); }
    catch { /* relatório ainda pode ser exportado */ }
  }, [resultados, carregado]);

  const carregarRevisaoTecnica = async () => {
    if (executando || carregandoRevisao) return;
    if (origemRelatorio !== "servidor" && resultados.some(r => r.parecer !== "pendente") &&
        !window.confirm("Carregar as 100 respostas do servidor vai substituir resultados locais. Continuar?")) return;
    setCarregandoRevisao(true);
    setMensagem("Buscando as 100 respostas finais...");
    try {
      const nova = await buscarAuditoriaFinal();
      setResultados(nova);
      setOrigemRelatorio("servidor");
      setFiltro("todos");
      setBusca("");
      setSomenteSinalizados(false);
      setProgresso({ atual: 100, total: 100 });
      setMensagem("As 100 respostas finais estão carregadas. Confira da pergunta 001 à 100.");
    } catch (e) {
      setMensagem("Não foi possível carregar a auditoria completa: " +
        (e instanceof Error ? e.message : "erro desconhecido"));
    } finally {
      setCarregandoRevisao(false);
    }
  };

  const executar = async (quantidade: number) => {
    if (executando || carregandoRevisao) return;
    if (quantidade === 100 && !window.confirm(
      "Executar 100 simulações com a OpenAI? Cada teste consome tokens e pode levar vários minutos. Nenhuma mensagem será enviada a clientes. Confirma?"
    )) return;
    cancelado.current = false;
    setResultados([]);
    setOrigemRelatorio("novo");
    setExecutando(true);
    setProgresso({ atual: 0, total: quantidade });
    setMensagem("Executando respostas reais no simulador, sem envio pelo WhatsApp.");
    const novos: Resultado[] = [];
    try {
      for (let i = 0; i < quantidade; i++) {
        if (cancelado.current) { setMensagem("Auditoria interrompida. Você pode baixar o resultado parcial."); break; }
        const c: CenarioAuditoria = CENARIOS_AUDITORIA[i];
        let resposta = "";
        let erro = "";
        try {
          const { data, error } = await supabase.functions.invoke("whatsapp-ia-assistente", {
            body: { pergunta: c.pergunta, modo: "resposta" },
          });
          if (error) {
            const detalhes = await (error as any)?.context?.json?.().catch(() => null);
            throw new Error(detalhes?.error || error.message || "Erro ao consultar o simulador");
          }
          if (data?.error || !data?.resposta) throw new Error(data?.error || "Resposta vazia do modelo");
          resposta = String(data.resposta);
        } catch (e) {
          erro = e instanceof Error ? e.message : "Erro ao avaliar resposta";
        }
        const avaliacao = erro ? null : avaliarRespostaAuditoria(c, resposta);
        novos.push({
          id: c.id, categoria: c.categoria, pergunta: c.pergunta, objetivo: c.objetivo,
          resposta, classificacao: erro ? "erro" : avaliacao!.classificacao,
          alertas: erro ? [erro] : avaliacao!.alertas, parecer: "pendente",
        });
        setResultados([...novos]);
        setProgresso({ atual: i + 1, total: quantidade });
        if (erro && /limite|cr[eé]dito|429|chave|credencial|503|sess[aã]o|acesso administrativo/i.test(erro)) {
          setMensagem("A auditoria foi interrompida por falha de serviço ou autenticação. Confira o erro e exporte a execução parcial.");
          break;
        }
      }
      if (!cancelado.current && novos.length === quantidade) {
        setMensagem("Execução concluída. Revise as respostas antes de aprovar o atendimento automático.");
      }
    } finally {
      setExecutando(false);
    }
  };

  const definirParecer = async (id: number, parecer: Resultado["parecer"]) => {
    const atual=resultados.find(r=>r.id===id);
    if (!atual) return;
    setResultados((atuais) => atuais.map((r) => r.id === id ? { ...r, parecer } : r));
    if (atual.runId) {
      const {error}=await (supabase as any).from("whatsapp_ia_audit_results")
        .update({revisao:parecer}).eq("run_id",atual.runId).eq("cenario_id",id);
      if(error){
        setResultados((atuais)=>atuais.map(r=>r.id===id?{...r,parecer:atual.parecer}:r));
        setMensagem("Não consegui salvar sua revisão no servidor. Verifique o acesso administrativo.");
      }
    }
  };

  const salvarObservacao = async (id: number, observacoes: string) => {
    const atual = resultados.find(r => r.id === id);
    if (!atual?.runId) return;
    const {error} = await (supabase as any).from("whatsapp_ia_audit_results")
      .update({observacoes: observacoes.slice(0,1000)})
      .eq("run_id", atual.runId).eq("cenario_id", id);
    if (error) setMensagem("Não consegui salvar uma observação. Tente novamente.");
  };

  const buscaNormalizada = busca.trim().toLocaleLowerCase("pt-BR");
  const filtrados = resultados.filter(r =>
    (filtro === "todos" || r.categoria === filtro) &&
    (!somenteSinalizados || r.classificacao !== "revisao") &&
    (!buscaNormalizada || [String(r.id), r.pergunta, r.categoria, r.resposta]
      .some(texto => texto.toLocaleLowerCase("pt-BR").includes(buscaNormalizada))));
  const sinalizados = resultados.filter(r => r.classificacao === "sinalizada").length;
  const erros = resultados.filter(r => r.classificacao === "erro").length;
  const aprovados = resultados.filter(r => r.parecer === "correta").length;
  const rejeitados = resultados.filter(r => r.parecer === "incorreta").length;
  return <section className={"space-y-3 rounded-xl border p-3 text-sm " + (dark ? "border-[#3b4a54] bg-[#182229] text-white" : "border-gray-200 bg-white text-gray-900")}>
    <div className="flex items-center gap-2 font-bold text-[#00a884]">
      <ShieldCheck size={18}/> Auditoria de 100 situações
    </div>
    <p className="text-xs opacity-80">
      Banco de 100 casos, agrupados em 10 temas comerciais e de segurança. Os testes usam o
      mesmo simulador de IA do painel, com informações atuais do site. Não enviam WhatsApp, não criam pedidos,
      não alteram estoque nem ativam atendimento automático.
    </p>
    <p className="text-xs opacity-80">
      A revisão final de 100 respostas é carregada automaticamente. As marcações e observações dessa revisão são salvas no servidor. Os testes manuais novos ficam neste navegador. O verificador identifica indícios de respostas perigosas, mas não confirma automaticamente se
      preço, disponibilidade ou entrega estão corretos. Marque cada resposta como correta ou incorreta
      após conferir as informações reais.
    </p>
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={executando || carregandoRevisao} onClick={() => void carregarRevisaoTecnica()}
        className="inline-flex items-center gap-1 rounded-lg bg-[#00a884] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
        {carregandoRevisao && <Loader2 size={15} className="animate-spin"/>}
        {carregandoRevisao ? "Carregando as 100 respostas..." : "Recarregar 100 respostas finais"}
      </button>
      <button type="button" disabled={executando || carregandoRevisao} onClick={() => void executar(10)}
        className="inline-flex items-center gap-1 rounded-lg bg-[#00a884] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
        {executando ? <Loader2 size={15} className="animate-spin"/> : <Play size={15}/>} Testar 10 casos
      </button>
      <button type="button" disabled={executando || carregandoRevisao} onClick={() => void executar(100)}
        className="rounded-lg border border-[#00a884] px-3 py-2 text-xs font-semibold text-[#00a884] disabled:opacity-50">
        Executar 100 com IA
      </button>
      {executando && <button type="button" onClick={() => { cancelado.current = true; setMensagem("Interrompendo após a resposta atual..."); }}
        className="inline-flex items-center gap-1 rounded-lg border border-amber-500 px-3 py-2 text-xs text-amber-500">
        <Square size={13}/> Parar
      </button>}
      <button type="button" disabled={!resultados.length} onClick={() => exportarResultados(resultados)}
        className="inline-flex items-center gap-1 rounded-lg border border-current/20 px-3 py-2 text-xs disabled:opacity-40">
        <Download size={14}/> Exportar relatório
      </button>
      <button type="button" disabled={executando || !resultados.length}
        onClick={() => { if (window.confirm("Limpar a visualização local? A revisão já salva no servidor será preservada.")) {
          setResultados([]); setOrigemRelatorio("local"); setMensagem("Visualização local limpa. Clique em Recarregar 100 respostas finais.");
          setProgresso({atual:0,total:0}); setFiltro("todos"); setBusca(""); setSomenteSinalizados(false);
        } }}
        className="inline-flex items-center gap-1 rounded-lg border border-current/20 px-3 py-2 text-xs disabled:opacity-40">
        <Trash2 size={14}/> Limpar
      </button>
    </div>
    {progresso.total > 0 && <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{mensagem}</span>
        <strong>{progresso.atual}/{progresso.total}</strong>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#00a884]/15">
        <div className="h-full bg-[#00a884] transition-all" style={{ width: progresso.atual / progresso.total * 100 + "%" }}/>
      </div>
    </div>}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {[
        ["Executados", resultados.length],
        ["Com alertas", sinalizados],
        ["Erros da API", erros],
        ["Aprovados manualmente", aprovados],
      ].map(([label, n]) =>
        <div key={String(label)} className="rounded-lg border border-current/15 p-2">
          <p className="text-[11px] opacity-70">{label}</p><p className="text-xl font-bold tabular-nums">{money(Number(n))}</p>
        </div>)}
    </div>
    {rejeitados > 0 && <p className="text-xs text-orange-500">{rejeitados} resposta(s) marcadas como incorretas para correção no treinamento.</p>}
    <div className="flex flex-wrap items-center gap-3">
      <select aria-label="Filtrar tema da auditoria" value={filtro} onChange={e => setFiltro(e.target.value)}
        className="min-w-0 rounded-lg border border-current/20 bg-transparent px-2 py-2 text-xs">
        <option className="text-gray-900" value="todos">Todos os temas</option>
        {categorias.map(c => <option className="text-gray-900" key={c} value={c}>{c}</option>)}
      </select>
      <input type="search" aria-label="Buscar entre as 100 perguntas" value={busca}
        onChange={e => setBusca(e.target.value)} placeholder="Buscar pergunta ou número (ex.: 95)"
        className="min-w-0 flex-1 rounded-lg border border-current/20 bg-transparent px-2 py-2 text-xs"/>
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={somenteSinalizados} onChange={e => setSomenteSinalizados(e.target.checked)}/>
        Só alertas e erros
      </label>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-current/15 px-3 py-2 text-xs">
      <span className="font-semibold">Mostrando {filtrados.length} de {resultados.length} respostas
        {origemRelatorio === "servidor" && resultados.length === 100 ? " — revisão final completa (001 a 100)" :
          origemRelatorio === "novo" ? " — execução local" : resultados.length ? " — resultados locais; carregue a revisão final" : ""}
      </span>
      {(filtro !== "todos" || somenteSinalizados || busca.trim()) && <button type="button"
        onClick={() => { setFiltro("todos"); setSomenteSinalizados(false); setBusca(""); }}
        className="font-semibold text-[#00a884] underline">Mostrar todas</button>}
    </div>
    {!resultados.length
      ? <p className="rounded-lg border border-dashed border-current/20 p-3 text-xs opacity-80">
          {carregandoRevisao ? "Carregando as 100 respostas..." : "Clique em Recarregar 100 respostas finais para conferir a auditoria completa."}
        </p>
      : <div className="space-y-2">
        {filtrados.map(r => <details key={r.id} className="rounded-lg border border-current/15 p-3">
          <summary className="cursor-pointer text-xs font-semibold">
            #{String(r.id).padStart(3, "0")} · {r.categoria} · {r.classificacao === "erro" ? "Erro" : r.classificacao === "sinalizada" ? "Atenção" : "Revisar"}
            {r.parecer !== "pendente" ? " · " + (r.parecer === "correta" ? "Aprovado" : "Incorreto") : ""}
            <span className="mt-1 block font-normal opacity-80">{r.pergunta}</span>
          </summary>
          <p className="mt-2 text-[11px] opacity-70">Objetivo: {r.objetivo}</p>
          {r.fonte && <p className="mt-1 text-[11px] opacity-70">Fonte: {r.fonte==="regra_verificada"?"Dados calculados do site":"Resposta gerada pela OpenAI"}</p>}
          <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-[#00a884]/10 p-2 text-xs">{r.resposta || "(sem resposta)"}</p>
          {r.alertas.map((a, i) => <p key={i} className="mt-1 flex items-center gap-1 text-xs text-orange-500"><AlertTriangle size={13}/>{a}</p>)}
          {r.runId && <div className="mt-2 space-y-1">
            <label htmlFor={"nota-qa-"+r.id} className="block text-[11px] opacity-70">O que você gostaria de mudar?</label>
            <textarea id={"nota-qa-"+r.id} rows={2} maxLength={1000}
              placeholder="Digite sugestões ou correções para nossa equipe."
              value={r.observacoes??""}
              onChange={e=>setResultados(atuais=>atuais.map(x=>x.id===r.id?{...x,observacoes:e.target.value}:x))}
              onBlur={e=>void salvarObservacao(r.id,e.target.value)}
              className="w-full resize-y rounded border border-current/20 bg-transparent p-2 text-xs"/>
          </div>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => definirParecer(r.id, "correta")}
              className="rounded-lg border border-green-600 px-2 py-1 text-xs text-green-600">Correta</button>
            <button type="button" onClick={() => definirParecer(r.id, "incorreta")}
              className="rounded-lg border border-orange-500 px-2 py-1 text-xs text-orange-500">Incorreta</button>
            <button type="button" onClick={() => definirParecer(r.id, "pendente")}
              className="rounded-lg border border-current/20 px-2 py-1 text-xs">Ainda não revisei</button>
          </div>
        </details>)}
      </div>}
  </section>;
}

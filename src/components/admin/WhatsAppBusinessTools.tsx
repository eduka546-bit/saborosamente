import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Bell, BellOff, Bookmark, Check, Clock3, Pencil, Pin, Plus, Save, Tag, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type AtendimentoEstado = {
  conversa_id: string;
  fixada: boolean;
  arquivada: boolean;
  marcada_nao_lida: boolean;
  ultima_leitura: string | null;
  etiquetas: string[];
  anotacoes: string;
  responsavel_id: string | null;
  lembrete_em: string | null;
  lembrete_texto: string | null;
  resolvida_em: string | null;
};
export type Etiqueta = { id: string; nome: string; cor: string };
export type Atendente = { id: string; nome: string };
export const estadoPadrao = (conversa_id: string): AtendimentoEstado => ({
  conversa_id, fixada: false, arquivada: false, marcada_nao_lida: false,
  ultima_leitura: null, etiquetas: [], anotacoes: "",
  responsavel_id: null, lembrete_em: null, lembrete_texto: null, resolvida_em: null,
});

const ESTADOS = ["wa-business-estados"];
const ETIQUETAS = ["wa-business-etiquetas"];

export function useWhatsAppBusiness() {
  const qc = useQueryClient();
  const { data: estados = [] } = useQuery({
    queryKey: ESTADOS,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("whatsapp_atendimento_estado")
        .select("conversa_id,fixada,arquivada,marcada_nao_lida,ultima_leitura,etiquetas,anotacoes,responsavel_id,lembrete_em,lembrete_texto,resolvida_em")
        .limit(10000);
      if (error) throw error;
      return (data ?? []) as AtendimentoEstado[];
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
  const { data: etiquetas = [] } = useQuery({
    queryKey: ETIQUETAS,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("whatsapp_etiquetas")
        .select("id,nome,cor").order("nome");
      if (error) throw error;
      return (data ?? []) as Etiqueta[];
    },
    staleTime: 30_000,
  });
  const { data: equipe = [] } = useQuery({
    queryKey: ["wa-business-atendentes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("whatsapp_listar_atendentes");
      if (error) throw error;
      return (data ?? []) as Atendente[];
    },
    staleTime: 5 * 60_000,
  });
  const mapa = new Map(estados.map((e) => [e.conversa_id, e]));

  const atualizar = useMutation({
    mutationFn: async ({ id, mudancas }: { id: string; mudancas: Partial<AtendimentoEstado> }) => {
      const { error } = await (supabase as any).from("whatsapp_atendimento_estado")
        .upsert({ conversa_id: id, ...mudancas, atualizado_em: new Date().toISOString() }, { onConflict: "conversa_id" });
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ESTADOS }),
    onError: (error: Error) => toast.error("Erro ao salvar atendimento: " + error.message),
  });
  const salvarEtiqueta = useMutation({
    mutationFn: async ({ id, nome, cor }: { id?: string; nome: string; cor: string }) => {
      const safeName = nome.trim();
      if (safeName.length < 2 || safeName.length > 40) throw new Error("Informe um nome com 2 a 40 caracteres.");
      if (!/^#[0-9a-fA-F]{6}$/.test(cor)) throw new Error("Cor inválida.");
      const db = (supabase as any).from("whatsapp_etiquetas");
      const { error } = id ? await db.update({ nome: safeName, cor }).eq("id", id) : await db.insert({ nome: safeName, cor });
      if (error) throw error;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ETIQUETAS }); toast.success("Etiqueta salva."); },
    onError: (e: Error) => toast.error(e.message),
  });
  const apagarEtiqueta = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("whatsapp_etiquetas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ETIQUETAS }); toast.success("Etiqueta excluída."); },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    const canal = supabase.channel("wa-business-organizacao")
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_atendimento_estado" },
        () => void qc.invalidateQueries({ queryKey: ESTADOS }))
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_etiquetas" },
        () => void qc.invalidateQueries({ queryKey: ETIQUETAS }))
      .subscribe();
    return () => { void supabase.removeChannel(canal); };
  }, [qc]);

  return { estados, mapa, etiquetas, equipe, atualizar, salvarEtiqueta, apagarEtiqueta };
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
function inputParaIso(local: string) {
  const d = new Date(local);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}
function isoParaInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

type DialogProps = {
  conversa: any;
  estado: AtendimentoEstado;
  etiquetas: Etiqueta[];
  equipe: Atendente[];
  dark: boolean;
  onPatch: (mudancas: Partial<AtendimentoEstado>) => void;
  salvarEtiqueta: (p: { id?: string; nome: string; cor: string }) => void;
  apagarEtiqueta: (id: string) => void;
  resumoCliente?: { pedidos: number; total: number; ultimo?: string; endereco?: string };
};

export function WhatsAppBusinessDetails({
  conversa, estado, etiquetas, equipe, dark, onPatch, salvarEtiqueta, apagarEtiqueta, resumoCliente,
}: DialogProps) {
  const [aberto, setAberto] = useState(false);
  const [anotacoes, setAnotacoes] = useState(estado.anotacoes || "");
  const [lembreteEm, setLembreteEm] = useState(isoParaInput(estado.lembrete_em));
  const [lembreteTexto, setLembreteTexto] = useState(estado.lembrete_texto || "");
  const [editando, setEditando] = useState<Etiqueta | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [novaCor, setNovaCor] = useState("#00a884");
  const fundo = dark ? "border-[#3b4a54] bg-[#202c33] text-[#e9edef]" : "border-[#e9edef] bg-white text-[#111b21]";
  const entrada = dark ? "border-[#3b4a54] bg-[#111b21] text-white" : "border-[#d1d7db] bg-white text-[#111b21]";

  useEffect(() => {
    setAnotacoes(estado.anotacoes || "");
    setLembreteEm(isoParaInput(estado.lembrete_em));
    setLembreteTexto(estado.lembrete_texto || "");
  }, [conversa.id, estado.anotacoes, estado.lembrete_em, estado.lembrete_texto]);

  return (
    <>
      <button type="button" title="Ficha, etiquetas e lembretes" onClick={() => setAberto(true)}
        className="rounded-lg px-2 py-1.5 text-xs font-semibold text-[#00a884] hover:bg-black/10">
        <UserRound size={15} className="inline mr-1" /> Ficha
      </button>
      {aberto && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60" role="dialog" aria-modal="true" aria-label="Ficha do cliente">
          <div className={"h-full w-full max-w-md overflow-y-auto border-l p-4 shadow-2xl " + fundo}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold">Ficha de atendimento</h2>
                <p className="text-xs opacity-70">{conversa.nome || conversa.telefone} · {conversa.telefone}</p>
              </div>
              <button type="button" title="Fechar" onClick={() => setAberto(false)} className="rounded-lg p-2 hover:bg-black/10"><X size={20}/></button>
            </div>
            {resumoCliente && (
              <section className="mt-4 rounded-xl border border-current/15 p-3 text-xs">
                <strong>Histórico comercial</strong>
                <p className="mt-1">{resumoCliente.pedidos} pedidos · R$ {resumoCliente.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em compras</p>
                {resumoCliente.ultimo && <p>Último pedido: {formatarData(resumoCliente.ultimo)}</p>}
                {resumoCliente.endereco && <p className="mt-1 break-words">Endereço: {resumoCliente.endereco}</p>}
              </section>
            )}
            <section className="mt-4">
              <h3 className="flex items-center gap-1 text-xs font-bold"><Bookmark size={14}/> Organização</h3>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <button type="button" onClick={() => onPatch({ fixada: !estado.fixada })} className="rounded-lg border border-current/20 p-2">{estado.fixada ? "Desafixar" : "Fixar conversa"}</button>
                <button type="button" onClick={() => onPatch({ arquivada: !estado.arquivada })} className="rounded-lg border border-current/20 p-2">{estado.arquivada ? "Desarquivar" : "Arquivar"}</button>
                <button type="button" onClick={() => onPatch({ marcada_nao_lida: !estado.marcada_nao_lida })} className="rounded-lg border border-current/20 p-2">{estado.marcada_nao_lida ? "Marcar como lida" : "Marcar não lida"}</button>
              </div>
            </section>
            <section className="mt-4">
              <h3 className="flex items-center gap-1 text-xs font-bold"><Tag size={14}/> Etiquetas</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {etiquetas.map((e) => (
                  <button key={e.id} type="button" onClick={() => onPatch({ etiquetas: estado.etiquetas.includes(e.id)
                    ? estado.etiquetas.filter((id) => id !== e.id) : [...estado.etiquetas, e.id] })}
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                    style={{ borderColor: e.cor, color: e.cor }}>
                    {estado.etiquetas.includes(e.id) && <Check size={12}/>}
                    {e.nome}
                  </button>
                ))}
              </div>
              <details className="mt-3 rounded-lg border border-current/15 p-2 text-xs">
                <summary className="cursor-pointer font-semibold">Criar, editar ou excluir etiquetas</summary>
                <div className="mt-2 space-y-2">
                  {etiquetas.map((e) => (
                    <div key={e.id} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: e.cor }}/>
                      <span className="min-w-0 flex-1 truncate">{e.nome}</span>
                      <button title="Editar etiqueta" onClick={() => { setEditando(e); setNovoNome(e.nome); setNovaCor(e.cor); }}><Pencil size={13}/></button>
                      <button title="Excluir etiqueta" onClick={() => window.confirm("Excluir a etiqueta de toda a equipe?") && apagarEtiqueta(e.id)}><Trash2 size={13}/></button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <input value={novoNome} maxLength={40} onChange={(e) => setNovoNome(e.target.value)}
                      placeholder="Nome da etiqueta" className={"min-w-0 flex-1 rounded-md border px-2 py-1.5 " + entrada}/>
                    <input type="color" value={novaCor} onChange={(e) => setNovaCor(e.target.value)} title="Cor da etiqueta" className="h-8 w-9"/>
                    <button type="button" title="Salvar etiqueta" onClick={() => {
                      salvarEtiqueta({ id: editando?.id, nome: novoNome, cor: novaCor });
                      setNovoNome(""); setEditando(null); setNovaCor("#00a884");
                    }} className="rounded bg-[#00a884] p-2 text-white"><Save size={15}/></button>
                    {editando && <button title="Cancelar" onClick={() => { setEditando(null); setNovoNome(""); }}><X size={15}/></button>}
                  </div>
                </div>
              </details>
            </section>
            <section className="mt-4">
              <label className="block text-xs font-bold">Funcionário responsável</label>
              <select value={estado.responsavel_id || ""} onChange={(e) => onPatch({ responsavel_id: e.target.value || null })}
                className={"mt-2 w-full rounded-lg border p-2 text-sm " + entrada}>
                <option value="">Sem responsável</option>
                {equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <p className="mt-1 text-[11px] opacity-60">Somente integrantes com acesso administrativo ao WhatsApp.</p>
            </section>
            <section className="mt-4">
              <label className="block text-xs font-bold">Anotações internas (cliente não vê)</label>
              <textarea value={anotacoes} maxLength={10000} rows={4} onChange={(e) => setAnotacoes(e.target.value)}
                placeholder="Preferência de horário, restrições, combinações..." className={"mt-2 w-full rounded-lg border p-2 text-sm " + entrada}/>
              <button type="button" onClick={() => onPatch({ anotacoes })} className="rounded-lg bg-[#00a884] px-3 py-2 text-xs font-bold text-white">Salvar anotações</button>
            </section>
            <section className="mt-4">
              <label className="flex items-center gap-1 text-xs font-bold"><Clock3 size={14}/> Lembrete interno</label>
              <input type="datetime-local" value={lembreteEm} onChange={(e) => setLembreteEm(e.target.value)}
                className={"mt-2 w-full rounded-lg border p-2 text-sm " + entrada}/>
              <input value={lembreteTexto} maxLength={500} onChange={(e) => setLembreteTexto(e.target.value)} placeholder="Ex.: retornar sobre entrega"
                className={"mt-2 w-full rounded-lg border p-2 text-sm " + entrada}/>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => {
                  const data = inputParaIso(lembreteEm);
                  if (!data || new Date(data).getTime() <= Date.now()) { toast.error("Escolha data e hora futuras."); return; }
                  onPatch({ lembrete_em: data, lembrete_texto: lembreteTexto });
                }} className="rounded-lg bg-[#00a884] px-3 py-2 text-xs font-bold text-white">Salvar lembrete</button>
                {estado.lembrete_em && <button type="button" onClick={() => onPatch({ lembrete_em: null, lembrete_texto: null })}
                  className="rounded-lg border border-current/20 px-3 py-2 text-xs">Concluir lembrete</button>}
              </div>
              <p className="mt-1 text-[11px] opacity-60">Alerta no painel enquanto ele estiver aberto. Não envia mensagem ao cliente.</p>
            </section>
          </div>
        </div>
      )}
    </>
  );
}

export function useWhatsAppAlerts(conversas: any[], estados: AtendimentoEstado[]) {
  const [ativadas, setAtivadas] = useState(false);
  const [som, setSom] = useState(false);
  const anteriores = useRef<Map<string,string> | null>(null);
  const avisadas = useRef<Set<string>>(new Set());
  useEffect(() => {
    try {
      setAtivadas(localStorage.getItem("wa-aviso-browser") === "true");
      setSom(localStorage.getItem("wa-aviso-som") === "true");
    } catch { /* ambiente sem armazenamento */ }
  }, []);
  const ativar = async () => {
    if (!("Notification" in window)) { toast.error("Notificações não disponíveis neste navegador."); return; }
    const ok = Notification.permission === "granted" || await Notification.requestPermission() === "granted";
    if (!ok) { toast.error("Autorize as notificações nas configurações do navegador."); return; }
    setAtivadas(true);
    localStorage.setItem("wa-aviso-browser","true");
    toast.success("Notificações ativadas.");
  };
  const desativar = () => { setAtivadas(false); localStorage.setItem("wa-aviso-browser","false"); };
  const alternarSom = () => { const novo = !som; setSom(novo); localStorage.setItem("wa-aviso-som",String(novo)); };
  const tocar = () => {
    try {
      const W = window as any;
      const AudioCtx = W.AudioContext || W.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 720;
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.17);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.18);
      osc.onended = () => { void ctx.close(); };
    } catch { /* sem autoplay */ }
  };
  useEffect(() => {
    const mapa = new Map<string,string>();
    const changed: any[] = [];
    for (const c of conversas) {
      const last = Array.isArray(c.mensagens) ? c.mensagens.at(-1) : null;
      const codigo = String(c.ultima_msg || "") + "|" + String(last?.whatsapp_message_id || last?.timestamp || "");
      mapa.set(c.id, codigo);
      if (anteriores.current && anteriores.current.get(c.id) !== codigo && last?.role === "user") changed.push(c);
    }
    if (anteriores.current && changed.length) {
      if (som) tocar();
      if (ativadas && "Notification" in window && Notification.permission === "granted") {
        for (const c of changed.slice(0, 3)) {
          try { const n = new Notification("Nova mensagem · SaborosaMente", { body: c.nome || "Cliente", tag: "wa-" + c.id }); n.onclick = () => { window.focus(); n.close(); }; }
          catch { /* permissão alterada */ }
        }
      }
    }
    anteriores.current = mapa;
  }, [conversas, ativadas, som]);
  useEffect(() => {
    const check = () => {
      for (const e of estados) {
        if (!e.lembrete_em) continue;
        const key = e.conversa_id + ":" + e.lembrete_em;
        if (new Date(e.lembrete_em).getTime() > Date.now() || avisadas.current.has(key)) continue;
        avisadas.current.add(key);
        toast.warning("Lembrete de atendimento: " + (e.lembrete_texto || "retornar contato"), { duration: 12000 });
        if (som) tocar();
        if (ativadas && "Notification" in window && Notification.permission === "granted") {
          try { new Notification("Lembrete · SaborosaMente", { body: e.lembrete_texto || "Retornar atendimento", tag: key }); } catch {}
        }
      }
    };
    check();
    const interval = window.setInterval(check, 60_000);
    return () => window.clearInterval(interval);
  }, [estados, som, ativadas]);
  return { ativadas, som, ativar, desativar, alternarSom };
}

export function BotaoNotificacoes({ alertas, dark }: { alertas: ReturnType<typeof useWhatsAppAlerts>; dark: boolean }) {
  const [aberto,setAberto] = useState(false);
  return (
    <div className="relative">
      <button type="button" title="Configurar notificações" onClick={() => setAberto((v) => !v)}
        className={"rounded-full p-2 hover:bg-black/10 " + (alertas.ativadas ? "text-[#00a884]" : dark ? "text-[#8696a0]" : "text-[#667781]")}>
        {alertas.ativadas ? <Bell size={18}/> : <BellOff size={18}/>}
      </button>
      {aberto && (
        <div className={"absolute right-0 top-10 z-40 w-60 rounded-xl border p-3 shadow-xl " + (dark ? "border-[#3b4a54] bg-[#202c33] text-white" : "border-[#e9edef] bg-white text-[#111b21]")}>
          <p className="text-sm font-bold">Notificações</p>
          <p className="mt-1 text-xs opacity-70">Alertas quando o painel estiver aberto.</p>
          <button type="button" onClick={() => alertas.ativadas ? alertas.desativar() : void alertas.ativar()}
            className="mt-3 w-full rounded-lg border border-current/20 px-2 py-2 text-xs">
            {alertas.ativadas ? "Desativar avisos" : "Ativar avisos do navegador"}
          </button>
          <button type="button" onClick={alertas.alternarSom}
            className="mt-2 w-full rounded-lg border border-current/20 px-2 py-2 text-xs">
            Som: {alertas.som ? "ligado" : "desligado"}
          </button>
        </div>
      )}
    </div>
  );
}

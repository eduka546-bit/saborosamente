import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Plus, Trash2, Play, Pause, Loader2, Save, X, ChevronRight,
  Zap, MessageCircle, GitBranch, Clock, Tag, ShoppingBag,
  ArrowRight, Eye, Copy, BarChart2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { FlowDiagram } from "@/components/flow-diagram";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/automacoes")({
  component: AutomacoesPage,
});

// ── Tipos ─────────────────────────────────────────────────────────────────────

type GatilhoTipo = "keyword" | "primeira_msg" | "pedido_criado" | "status_pedido" | "sem_resposta" | "tag";

type NoTipo =
  | "mensagem"      // Enviar mensagem de texto
  | "menu"          // Enviar menu interativo
  | "condicao"      // Bifurcar baseado em condição
  | "aguardar"      // Aguardar X horas/minutos
  | "tag"           // Adicionar tag ao contato
  | "transferir"    // Transferir para atendente
  | "encerrar";     // Encerrar o fluxo

interface No {
  id: string;
  tipo: NoTipo;
  titulo: string;
  config: any;
  proximo_id?: string;       // próximo nó (geral)
  proximo_sim_id?: string;   // se condição = verdadeira
  proximo_nao_id?: string;   // se condição = falsa
}

interface Automacao {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  gatilho_tipo: GatilhoTipo;
  gatilho_valor: any;
  nos: No[];
  execucoes_total: number;
  created_at: string;
}

// ── Configurações dos tipos ───────────────────────────────────────────────────

const GATILHO_CONFIG: Record<GatilhoTipo, { label: string; icon: any; cor: string; descricao: string }> = {
  keyword:       { label: "Palavra-chave",      icon: MessageCircle, cor: "bg-blue-100 text-blue-700",   descricao: "Quando o cliente enviar uma palavra/frase específica" },
  primeira_msg:  { label: "1ª Mensagem",         icon: Zap,           cor: "bg-green-100 text-green-700", descricao: "Quando um novo contato enviar a primeira mensagem" },
  pedido_criado: { label: "Pedido criado",       icon: ShoppingBag,   cor: "bg-purple-100 text-purple-700",descricao: "Quando um pedido for registrado (site ou WhatsApp)" },
  status_pedido: { label: "Status do pedido",   icon: ShoppingBag,   cor: "bg-orange-100 text-orange-700",descricao: "Quando o status do pedido mudar" },
  sem_resposta:  { label: "Sem resposta",        icon: Clock,         cor: "bg-yellow-100 text-yellow-700",descricao: "Quando o cliente não responder em X horas" },
  tag:           { label: "Tag adicionada",      icon: Tag,           cor: "bg-pink-100 text-pink-700",   descricao: "Quando uma tag específica for adicionada ao contato" },
};

const NO_CONFIG: Record<NoTipo, { label: string; icon: any; cor: string }> = {
  mensagem:   { label: "Enviar mensagem",    icon: MessageCircle, cor: "bg-blue-50 border-blue-200 text-blue-700" },
  menu:       { label: "Enviar menu",        icon: GitBranch,     cor: "bg-indigo-50 border-indigo-200 text-indigo-700" },
  condicao:   { label: "Condição",           icon: GitBranch,     cor: "bg-yellow-50 border-yellow-200 text-yellow-700" },
  aguardar:   { label: "Aguardar",           icon: Clock,         cor: "bg-gray-50 border-gray-200 text-gray-700" },
  tag:        { label: "Adicionar tag",      icon: Tag,           cor: "bg-pink-50 border-pink-200 text-pink-700" },
  transferir: { label: "Transferir atendente", icon: ArrowRight,  cor: "bg-orange-50 border-orange-200 text-orange-700" },
  encerrar:   { label: "Encerrar fluxo",     icon: X,             cor: "bg-red-50 border-red-200 text-red-700" },
};

// ── Editor de Nó ─────────────────────────────────────────────────────────────

function EditorNo({ no, onChange, onRemove }: { no: No; onChange: (n: No) => void; onRemove: () => void }) {
  const cfg = NO_CONFIG[no.tipo];

  return (
    <div className={`rounded-xl border-2 p-4 space-y-3 ${cfg.cor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <cfg.icon size={16} />
          <span className="text-sm font-bold">{cfg.label}</span>
        </div>
        <button onClick={onRemove} className="text-red-400 hover:text-red-600 p-1">
          <Trash2 size={14} />
        </button>
      </div>

      {no.tipo === "mensagem" && (
        <textarea
          value={no.config.texto ?? ""}
          onChange={e => onChange({ ...no, config: { ...no.config, texto: e.target.value } })}
          placeholder="Digite a mensagem que será enviada..."
          rows={3}
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400 resize-none"
        />
      )}

      {no.tipo === "menu" && (
        <div className="space-y-2">
          <input
            value={no.config.titulo ?? ""}
            onChange={e => onChange({ ...no, config: { ...no.config, titulo: e.target.value } })}
            placeholder="Título do menu"
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none"
          />
          <textarea
            value={no.config.corpo ?? ""}
            onChange={e => onChange({ ...no, config: { ...no.config, corpo: e.target.value } })}
            placeholder="Texto do menu (aparece acima das opções)"
            rows={2}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none resize-none"
          />
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-500">Opções (uma por linha)</label>
            <textarea
              value={(no.config.opcoes ?? []).join("\n")}
              onChange={e => onChange({ ...no, config: { ...no.config, opcoes: e.target.value.split("\n").filter(Boolean) } })}
              placeholder="Ex: Ver cardápio&#10;Fazer pedido&#10;Falar com atendente"
              rows={4}
              className="w-full rounded-lg border bg-white px-3 py-2 text-xs font-mono outline-none resize-none"
            />
          </div>
        </div>
      )}

      {no.tipo === "condicao" && (
        <div className="space-y-2">
          <select
            value={no.config.campo ?? "mensagem"}
            onChange={e => onChange({ ...no, config: { ...no.config, campo: e.target.value } })}
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="mensagem">Mensagem contém</option>
            <option value="cidade">Cidade do cliente</option>
            <option value="tag">Cliente tem tag</option>
            <option value="horario">Horário atual</option>
            <option value="pedidos">Total de pedidos</option>
          </select>
          <input
            value={no.config.valor ?? ""}
            onChange={e => onChange({ ...no, config: { ...no.config, valor: e.target.value } })}
            placeholder="Valor para comparar"
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none"
          />
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-green-50 border border-green-200 rounded-lg p-2">
              <span className="font-bold text-green-700">✅ Se SIM →</span>
              <p className="text-green-600 mt-0.5">Próximo nó (acima)</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-2">
              <span className="font-bold text-red-700">❌ Se NÃO →</span>
              <p className="text-red-600 mt-0.5">Nó alternativo</p>
            </div>
          </div>
        </div>
      )}

      {no.tipo === "aguardar" && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={no.config.valor ?? 1}
            onChange={e => onChange({ ...no, config: { ...no.config, valor: Number(e.target.value) } })}
            className="w-20 rounded-lg border bg-white px-3 py-2 text-sm outline-none"
          />
          <select
            value={no.config.unidade ?? "horas"}
            onChange={e => onChange({ ...no, config: { ...no.config, unidade: e.target.value } })}
            className="rounded-lg border bg-white px-3 py-2 text-sm outline-none"
          >
            <option value="minutos">minutos</option>
            <option value="horas">horas</option>
            <option value="dias">dias</option>
          </select>
          <span className="text-xs text-gray-500">antes de prosseguir</span>
        </div>
      )}

      {no.tipo === "tag" && (
        <input
          value={no.config.tag ?? ""}
          onChange={e => onChange({ ...no, config: { ...no.config, tag: e.target.value } })}
          placeholder="Nome da tag (ex: interessado, vip, fidelizado)"
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none"
        />
      )}

      {no.tipo === "transferir" && (
        <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
          A conversa será transferida para um atendente humano e o agente IA vai pausar.
        </p>
      )}

      {no.tipo === "encerrar" && (
        <input
          value={no.config.mensagem_final ?? ""}
          onChange={e => onChange({ ...no, config: { ...no.config, mensagem_final: e.target.value } })}
          placeholder="Mensagem de encerramento (opcional)"
          className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none"
        />
      )}
    </div>
  );
}

// ── Editor de Automação ───────────────────────────────────────────────────────

function EditorAutomacao({ automacao, onSave, onClose }: {
  automacao: Partial<Automacao>;
  onSave: (a: Partial<Automacao>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Automacao>>({
    nome: "",
    descricao: "",
    ativo: true,
    gatilho_tipo: "keyword",
    gatilho_valor: {},
    nos: [],
    ...automacao,
  });
  const [saving, setSaving] = useState(false);

  const addNo = (tipo: NoTipo) => {
    const novo: No = {
      id: `no_${Date.now()}`,
      tipo,
      titulo: NO_CONFIG[tipo].label,
      config: {},
    };
    setForm(f => ({ ...f, nos: [...(f.nos ?? []), novo] }));
  };

  const updateNo = (idx: number, no: No) => {
    const nos = [...(form.nos ?? [])];
    nos[idx] = no;
    setForm(f => ({ ...f, nos }));
  };

  const removeNo = (idx: number) => {
    const nos = [...(form.nos ?? [])];
    nos.splice(idx, 1);
    setForm(f => ({ ...f, nos }));
  };

  const handleSave = async () => {
    if (!form.nome?.trim()) { toast.error("Informe um nome"); return; }
    if (!form.nos?.length) { toast.error("Adicione pelo menos um nó"); return; }
    setSaving(true);
    try { await onSave(form); }
    finally { setSaving(false); }
  };

  const gatilhoCfg = GATILHO_CONFIG[form.gatilho_tipo!];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-end p-4 overflow-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[95vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-[#5850ec]">
            {automacao.id ? "Editar automação" : "Nova automação"}
          </h2>
          <div className="flex gap-2">
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Nome e descrição */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">Nome da automação</label>
              <input
                value={form.nome ?? ""}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Boas-vindas novos contatos"
                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400">Descrição (opcional)</label>
              <input
                value={form.descricao ?? ""}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                placeholder="Para que serve esta automação?"
                className="mt-1 w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30"
              />
            </div>
          </div>

          {/* Preview do Fluxo */}
          {(form.nos ?? []).length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <GitBranch size={16} className="text-[#5850ec]" /> Pré-visualização do fluxo
              </h3>
              <div className="max-h-96 overflow-y-auto border rounded-xl bg-white">
                <FlowDiagram 
                  nos={form.nos ?? []} 
                  onUpdate={(novoNos) => setForm(f => ({ ...f, nos: novoNos }))}
                  editavel={true}
                />
              </div>
            </div>
          )}

          {/* Gatilho */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Zap size={16} className="text-[#5850ec]" /> Gatilho — quando executar?
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(Object.entries(GATILHO_CONFIG) as [GatilhoTipo, any][]).map(([tipo, cfg]) => (
                <button
                  key={tipo}
                  onClick={() => setForm(f => ({ ...f, gatilho_tipo: tipo, gatilho_valor: {} }))}
                  className={`p-3 rounded-xl border text-left transition-all ${form.gatilho_tipo === tipo
                    ? "border-[#5850ec] bg-[#5850ec]/10"
                    : "border-gray-100 hover:border-[#5850ec]/30"
                  }`}
                >
                  <cfg.icon size={16} className="mb-1.5 text-[#5850ec]" />
                  <p className="text-xs font-bold text-gray-800">{cfg.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{cfg.descricao}</p>
                </button>
              ))}
            </div>

            {/* Config do gatilho */}
            <div className="bg-gray-50 rounded-xl border p-4 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase">{gatilhoCfg.label} — configuração</p>

              {form.gatilho_tipo === "keyword" && (
                <div>
                  <label className="text-[10px] text-gray-400">Palavras ou frases (uma por linha)</label>
                  <textarea
                    value={(form.gatilho_valor?.palavras ?? []).join("\n")}
                    onChange={e => setForm(f => ({ ...f, gatilho_valor: { ...f.gatilho_valor, palavras: e.target.value.split("\n").filter(Boolean) } }))}
                    placeholder="promoção&#10;desconto&#10;quero pedir&#10;cardápio"
                    rows={4}
                    className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-[#5850ec] resize-none"
                  />
                  <div className="flex gap-3 mt-2">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input type="radio" checked={form.gatilho_valor?.modo !== "all"} onChange={() => setForm(f => ({ ...f, gatilho_valor: { ...f.gatilho_valor, modo: "any" } }))} />
                      Qualquer uma das palavras
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input type="radio" checked={form.gatilho_valor?.modo === "all"} onChange={() => setForm(f => ({ ...f, gatilho_valor: { ...f.gatilho_valor, modo: "all" } }))} />
                      Todas as palavras
                    </label>
                  </div>
                </div>
              )}

              {form.gatilho_tipo === "status_pedido" && (
                <select
                  value={form.gatilho_valor?.status ?? "entregue"}
                  onChange={e => setForm(f => ({ ...f, gatilho_valor: { status: e.target.value } }))}
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none"
                >
                  <option value="preparando">Preparando</option>
                  <option value="saiu para entrega">Saiu para entrega</option>
                  <option value="entregue">Entregue</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              )}

              {form.gatilho_tipo === "sem_resposta" && (
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="1"
                    value={form.gatilho_valor?.horas ?? 2}
                    onChange={e => setForm(f => ({ ...f, gatilho_valor: { horas: Number(e.target.value) } }))}
                    className="w-20 rounded-lg border bg-white px-3 py-2 text-sm outline-none"
                  />
                  <span className="text-sm text-gray-600">horas sem resposta</span>
                </div>
              )}

              {form.gatilho_tipo === "tag" && (
                <input
                  value={form.gatilho_valor?.tag ?? ""}
                  onChange={e => setForm(f => ({ ...f, gatilho_valor: { tag: e.target.value } }))}
                  placeholder="Nome da tag que dispara a automação"
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none"
                />
              )}

              {(form.gatilho_tipo === "primeira_msg" || form.gatilho_tipo === "pedido_criado") && (
                <p className="text-xs text-gray-500 italic">Nenhuma configuração necessária — dispara automaticamente.</p>
              )}
            </div>
          </div>

          {/* Fluxo de nós */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <GitBranch size={16} className="text-[#5850ec]" /> Fluxo — o que fazer?
            </h3>

            {(form.nos ?? []).length === 0 && (
              <div className="py-8 text-center border-2 border-dashed rounded-xl text-gray-400">
                <GitBranch size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Adicione nós abaixo para montar o fluxo</p>
              </div>
            )}

            <div className="space-y-2">
              {(form.nos ?? []).map((no, idx) => (
                <div key={no.id}>
                  <EditorNo
                    no={no}
                    onChange={n => updateNo(idx, n)}
                    onRemove={() => removeNo(idx)}
                  />
                  {idx < (form.nos ?? []).length - 1 && (
                    <div className="flex justify-center my-1">
                      <div className="h-6 w-0.5 bg-gray-200" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Botões para adicionar nós */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
              {(Object.entries(NO_CONFIG) as [NoTipo, any][]).map(([tipo, cfg]) => (
                <button
                  key={tipo}
                  onClick={() => addNo(tipo)}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-dashed hover:border-[#5850ec] hover:bg-[#5850ec]/5 transition-all text-gray-500 hover:text-[#5850ec]"
                >
                  <cfg.icon size={16} />
                  <span className="text-[10px] font-semibold text-center leading-tight">{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Botão salvar */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#5850ec] text-white rounded-xl font-bold hover:bg-[#4338ca] transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar automação
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

function AutomacoesPage() {
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<Partial<Automacao> | null>(null);

  const { data: automacoes = [], isLoading } = useQuery({
    queryKey: ["automacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automacoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Automacao[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (form: Partial<Automacao>) => {
      if (form.id) {
        const { error } = await supabase.from("automacoes")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("automacoes").insert({ ...form });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automacoes"] });
      setEditando(null);
      toast.success("Automação salva!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("automacoes").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automacoes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automacoes"] });
      toast.success("Automação removida.");
    },
  });

  const ativasCount = automacoes.filter(a => a.ativo).length;

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec] flex items-center gap-2">
            <Zap size={22} /> Automações WhatsApp
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {ativasCount} ativa{ativasCount !== 1 ? "s" : ""} · {automacoes.length} no total
          </p>
        </div>
        <button
          onClick={() => setEditando({})}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#5850ec] text-white rounded-xl text-sm font-bold hover:bg-[#4338ca] transition-all"
        >
          <Plus size={16} /> Nova automação
        </button>
      </div>

      {/* Explicação rápida */}
      {automacoes.length === 0 && !isLoading && (
        <div className="bg-[#5850ec]/5 border border-[#5850ec]/20 rounded-2xl p-6 mb-6">
          <h3 className="font-bold text-[#5850ec] mb-2">Como funcionam as automações?</h3>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex gap-3">
              <span className="text-2xl">⚡</span>
              <div><strong>Gatilho</strong> — define quando a automação dispara (palavra-chave, novo contato, pedido criado...)</div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">🔀</span>
              <div><strong>Fluxo</strong> — sequência de ações: enviar mensagem, aguardar, condicionar, transferir...</div>
            </div>
            <div className="flex gap-3">
              <span className="text-2xl">📊</span>
              <div><strong>Resultado</strong> — acompanhe quantas vezes cada automação foi executada</div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de automações */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#5850ec]" size={28} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {automacoes.map(aut => {
            const gatilho = GATILHO_CONFIG[aut.gatilho_tipo];
            return (
              <div key={aut.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${!aut.ativo ? "opacity-60" : ""}`}>
                {/* Topo colorido */}
                <div className={`h-1.5 ${aut.ativo ? "bg-[#5850ec]" : "bg-gray-200"}`} />

                <div className="p-5 space-y-3">
                  {/* Nome e gatilho */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{aut.nome}</p>
                      {aut.descricao && <p className="text-xs text-gray-400 truncate">{aut.descricao}</p>}
                    </div>
                    <Switch
                      checked={aut.ativo}
                      onCheckedChange={v => toggleMutation.mutate({ id: aut.id, ativo: v })}
                      className="data-[state=checked]:bg-[#5850ec] shrink-0"
                    />
                  </div>

                  {/* Badge gatilho */}
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${gatilho.cor}`}>
                    <gatilho.icon size={12} />
                    {gatilho.label}
                    {aut.gatilho_tipo === "keyword" && aut.gatilho_valor?.palavras?.length > 0 && (
                      <span className="opacity-70">· {aut.gatilho_valor.palavras.slice(0, 2).join(", ")}{aut.gatilho_valor.palavras.length > 2 ? "..." : ""}</span>
                    )}
                  </div>

                  {/* Fluxo resumido */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {(aut.nos ?? []).slice(0, 4).map((no, i) => {
                      const noCfg = NO_CONFIG[no.tipo as NoTipo];
                      return (
                        <div key={i} className="flex items-center gap-1">
                          {i > 0 && <ChevronRight size={10} className="text-gray-300" />}
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${noCfg?.cor ?? "bg-gray-50 border-gray-200 text-gray-600"}`}>
                            {noCfg?.label ?? no.tipo}
                          </span>
                        </div>
                      );
                    })}
                    {(aut.nos ?? []).length > 4 && (
                      <span className="text-[10px] text-gray-400">+{aut.nos.length - 4} nós</span>
                    )}
                  </div>

                  {/* Stats + ações */}
                  <div className="flex items-center justify-between pt-1 border-t">
                    <div className="flex items-center gap-1 text-[11px] text-gray-400">
                      <BarChart2 size={12} />
                      {aut.execucoes_total ?? 0} execuções
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditando(aut)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#5850ec] hover:bg-[#5850ec]/10 transition-all"
                        title="Editar"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => setEditando({ ...aut, id: undefined, nome: aut.nome + " (cópia)" })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                        title="Duplicar"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => confirm(`Remover "${aut.nome}"?`) && deleteMutation.mutate(aut.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor */}
      {editando !== null && (
        <EditorAutomacao
          automacao={editando}
          onSave={saveMutation.mutateAsync}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}

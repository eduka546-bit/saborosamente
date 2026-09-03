import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Save,
  Bot,
  MessageCircle,
  Clock,
  User,
  Zap,
  Send,
  Settings,
  AlertTriangle,
  Info,
  Upload,
  Trash2,
  FileText,
  Image,
  File,
  Eye,
  EyeOff,
  Search,
  Sun,
  Moon,
  ChevronLeft,
  CheckCheck,
  Paperclip,
  Smile,
  Plus,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Pencil,
  X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/agente")({
  component: AdminAgentePage,
});

// ── helpers ───────────────────────────────────────────────────────────────────
async function sendManualMessage(
  to: string,
  text: string,
): Promise<{ ok: boolean; errorMsg?: string }> {
  try {
    const { error } = await supabase.functions.invoke("whatsapp-send", { body: { to, text } });
    if (error) return { ok: false, errorMsg: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, errorMsg: e.message };
  }
}

function formatMsgTime(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Ontem";
  return format(d, "dd/MM", { locale: ptBR });
}

function getInitials(name: string) {
  return (
    name
      ?.split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?"
  );
}

// ── Tema ──────────────────────────────────────────────────────────────────────
const DARK = {
  app: "bg-[#111b21]",
  sidebar: "bg-[#111b21]",
  sidebarHeader: "bg-[#202c33]",
  sidebarSearch: "bg-[#202c33]",
  sidebarSearchInput: "bg-[#2a3942] text-[#d1d7db]",
  chatBg: "bg-[#0b141a]",
  chatPattern: "opacity-[0.03]",
  chatHeader: "bg-[#202c33]",
  chatInput: "bg-[#202c33]",
  chatInputField: "bg-[#2a3942] text-[#d1d7db]",
  contactItem: "hover:bg-[#202c33]",
  contactItemActive: "bg-[#2a3942]",
  contactDivider: "bg-[#2a3942]",
  text: "text-[#e9edef]",
  textSub: "text-[#8696a0]",
  textTime: "text-[#8696a0]",
  bubbleOut: "bg-[#005c4b] text-[#e9edef]",
  bubbleIn: "bg-[#202c33] text-[#e9edef]",
  bubbleManual: "bg-[#1d4b3a] text-[#e9edef]",
  settingsPanel: "bg-[#111b21]",
  settingsCard: "bg-[#202c33] border-[#2a3942]",
  settingsInput: "bg-[#2a3942] border-[#3b4a54] text-[#e9edef]",
  settingsLabel: "text-[#8696a0]",
  badge: "bg-[#00a884] text-white",
  badgeHumano: "bg-[#f0a202] text-white",
  divider: "border-[#2a3942]",
};

const LIGHT = {
  app: "bg-[#f0f2f5]",
  sidebar: "bg-white",
  sidebarHeader: "bg-[#f0f2f5]",
  sidebarSearch: "bg-[#f0f2f5]",
  sidebarSearchInput: "bg-white text-[#3b4a54]",
  chatBg: "bg-[#efeae2]",
  chatPattern: "opacity-[0.06]",
  chatHeader: "bg-[#f0f2f5]",
  chatInput: "bg-[#f0f2f5]",
  chatInputField: "bg-white text-[#3b4a54]",
  contactItem: "hover:bg-[#f5f6f6]",
  contactItemActive: "bg-[#f0f2f5]",
  contactDivider: "bg-[#e9edef]",
  text: "text-[#111b21]",
  textSub: "text-[#667781]",
  textTime: "text-[#667781]",
  bubbleOut: "bg-[#d9fdd3] text-[#111b21]",
  bubbleIn: "bg-white text-[#111b21]",
  bubbleManual: "bg-[#fff3cd] text-[#111b21]",
  settingsPanel: "bg-[#f0f2f5]",
  settingsCard: "bg-white border-[#e9edef]",
  settingsInput: "bg-white border-[#e9edef] text-[#111b21]",
  settingsLabel: "text-[#667781]",
  badge: "bg-[#25d366] text-white",
  badgeHumano: "bg-[#f0a202] text-white",
  divider: "border-[#e9edef]",
};

// ── Aba de Módulos do Prompt ─────────────────────────────────────────────────
const CATEGORIAS: Record<string, { label: string; cor: string }> = {
  identidade: { label: "Identidade", cor: "bg-purple-100 text-purple-700 border-purple-200" },
  cardapio: { label: "Cardápio", cor: "bg-green-100 text-green-700 border-green-200" },
  pedidos: { label: "Pedidos", cor: "bg-blue-100 text-blue-700 border-blue-200" },
  entregas: { label: "Entregas", cor: "bg-orange-100 text-orange-700 border-orange-200" },
  comportamento: { label: "Comportamento", cor: "bg-gray-100 text-gray-700 border-gray-200" },
};

function AbaModulos({ dark }: { dark: boolean }) {
  const t = dark ? DARK : LIGHT;
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", categoria: "comportamento", conteudo: "" });
  const [criando, setCriando] = useState(false);
  const [novoForm, setNovoForm] = useState({ nome: "", categoria: "comportamento", conteudo: "" });
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");

  const { data: modulos = [], isLoading } = useQuery({
    queryKey: ["agente-modulos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agente_modulos").select("*").order("ordem");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos para reduzir egress
    gcTime: 5 * 60 * 1000, // Mantém cache por 5min
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: any }) => {
      const { error } = await supabase
        .from("agente_modulos")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Força refetch completo dos dados
      queryClient.invalidateQueries({
        queryKey: ["agente-modulos"],
        exact: true,
      });
      setEditingId(null);
      toast.success("Módulo salvo!");
    },
    onError: (e: any) => {
      console.error("Erro ao salvar módulo:", e);
      toast.error(e.message || "Erro ao salvar");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("agente_modulos").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["agente-modulos"],
        exact: true,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agente_modulos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agente-modulos"],
        exact: true,
      });
      toast.success("Módulo removido.");
    },
    onError: (e: any) => {
      console.error("Erro ao remover módulo:", e);
      toast.error(e.message || "Erro ao remover");
    },
  });

  const criarMutation = useMutation({
    mutationFn: async (values: any) => {
      const maxOrdem = (modulos as any[]).reduce(
        (m: number, mod: any) => Math.max(m, mod.ordem ?? 0),
        0,
      );
      const { error } = await supabase.from("agente_modulos").insert({
        ...values,
        ativo: true,
        ordem: maxOrdem + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["agente-modulos"],
        exact: true,
      });
      setCriando(false);
      setNovoForm({ nome: "", categoria: "comportamento", conteudo: "" });
      toast.success("Módulo criado!");
    },
    onError: (e: any) => {
      console.error("Erro ao criar módulo:", e);
      toast.error(e.message || "Erro ao criar");
    },
  });

  const modulosFiltrados =
    filtroCategoria === "todos"
      ? (modulos as any[])
      : (modulos as any[]).filter((m: any) => m.categoria === filtroCategoria);

  const ativosCount = (modulos as any[]).filter((m: any) => m.ativo).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`rounded-xl border p-4 flex items-center justify-between ${t.settingsCard}`}>
        <div>
          <p className={`text-sm font-semibold ${t.text}`}>Módulos do Prompt</p>
          <p className={`text-xs ${t.textSub}`}>
            {ativosCount} de {(modulos as any[]).length} ativos · A IA usa apenas os módulos
            ativados
          </p>
        </div>
        <button
          onClick={() => setCriando(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00a884] text-white text-xs font-semibold hover:bg-[#008f72] transition-all"
        >
          <Plus size={13} /> Novo módulo
        </button>
      </div>

      {/* Filtros de categoria */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltroCategoria("todos")}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            filtroCategoria === "todos"
              ? "bg-[#00a884] text-white border-[#00a884]"
              : `${t.settingsCard} ${t.textSub}`
          }`}
        >
          Todos ({(modulos as any[]).length})
        </button>
        {Object.entries(CATEGORIAS).map(([key, cat]) => {
          const count = (modulos as any[]).filter((m: any) => m.categoria === key).length;
          return (
            <button
              key={key}
              onClick={() => setFiltroCategoria(key)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                filtroCategoria === key ? cat.cor + " font-bold" : `${t.settingsCard} ${t.textSub}`
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Formulário novo módulo */}
      {criando && (
        <div className={`rounded-xl border p-4 space-y-3 ${t.settingsCard}`}>
          <p className={`text-sm font-bold ${t.text}`}>Novo módulo</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`text-[10px] font-bold uppercase ${t.settingsLabel}`}>Nome</label>
              <input
                value={novoForm.nome}
                onChange={(e) => setNovoForm((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Promoções especiais"
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] ${t.settingsInput}`}
              />
            </div>
            <div>
              <label className={`text-[10px] font-bold uppercase ${t.settingsLabel}`}>
                Categoria
              </label>
              <select
                value={novoForm.categoria}
                onChange={(e) => setNovoForm((p) => ({ ...p, categoria: e.target.value }))}
                className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] ${t.settingsInput}`}
              >
                {Object.entries(CATEGORIAS).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={`text-[10px] font-bold uppercase ${t.settingsLabel}`}>Conteúdo</label>
            <textarea
              value={novoForm.conteudo}
              onChange={(e) => setNovoForm((p) => ({ ...p, conteudo: e.target.value }))}
              placeholder="Escreva as instruções deste módulo..."
              rows={5}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] resize-none leading-relaxed ${t.settingsInput}`}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => criarMutation.mutate(novoForm)}
              disabled={
                !novoForm.nome.trim() || !novoForm.conteudo.trim() || criarMutation.isPending
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00a884] text-white text-xs font-semibold disabled:opacity-50"
            >
              {criarMutation.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Save size={12} />
              )}{" "}
              Criar
            </button>
            <button
              onClick={() => {
                setCriando(false);
                setNovoForm({ nome: "", categoria: "comportamento", conteudo: "" });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${t.textSub}`}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de módulos */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-[#00a884]" size={20} />
        </div>
      ) : (
        <div className="space-y-2">
          {modulosFiltrados.map((mod: any) => {
            const cat = CATEGORIAS[mod.categoria] ?? CATEGORIAS.comportamento;
            const isEditing = editingId === mod.id;

            return (
              <div
                key={mod.id}
                className={`rounded-xl border transition-all ${t.settingsCard} ${!mod.ativo ? "opacity-50" : ""}`}
              >
                {isEditing ? (
                  /* ── Modo edição ── */
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={`text-[10px] font-bold uppercase ${t.settingsLabel}`}>
                          Nome
                        </label>
                        <input
                          value={editForm.nome}
                          onChange={(e) => setEditForm((p) => ({ ...p, nome: e.target.value }))}
                          className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] ${t.settingsInput}`}
                        />
                      </div>
                      <div>
                        <label className={`text-[10px] font-bold uppercase ${t.settingsLabel}`}>
                          Categoria
                        </label>
                        <select
                          value={editForm.categoria}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, categoria: e.target.value }))
                          }
                          className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] ${t.settingsInput}`}
                        >
                          {Object.entries(CATEGORIAS).map(([key, c]) => (
                            <option key={key} value={key}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className={`text-[10px] font-bold uppercase ${t.settingsLabel}`}>
                          Conteúdo
                        </label>
                        <span className={`text-[10px] ${t.textSub}`}>
                          {editForm.conteudo.length} chars
                        </span>
                      </div>
                      <textarea
                        value={editForm.conteudo}
                        onChange={(e) => setEditForm((p) => ({ ...p, conteudo: e.target.value }))}
                        rows={8}
                        className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] resize-none leading-relaxed font-mono ${t.settingsInput}`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateMutation.mutate({ id: mod.id, values: editForm })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00a884] text-white text-xs font-semibold"
                      >
                        {updateMutation.isPending ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Save size={12} />
                        )}{" "}
                        Salvar
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${t.textSub}`}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Modo visualização ── */
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cat.cor}`}
                        >
                          {cat.label}
                        </span>
                        <span className={`text-sm font-semibold ${t.text}`}>{mod.nome}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Toggle ativo */}
                        <button
                          onClick={() => toggleMutation.mutate({ id: mod.id, ativo: !mod.ativo })}
                          title={mod.ativo ? "Desativar" : "Ativar"}
                          className={`p-1.5 rounded-lg transition-all ${mod.ativo ? "text-[#00a884]" : t.textSub}`}
                        >
                          {mod.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        {/* Editar */}
                        <button
                          onClick={() => {
                            setEditingId(mod.id);
                            setEditForm({
                              nome: mod.nome,
                              categoria: mod.categoria,
                              conteudo: mod.conteudo,
                            });
                          }}
                          className={`p-1.5 rounded-lg hover:text-[#00a884] transition-all ${t.textSub}`}
                        >
                          <Pencil size={14} />
                        </button>
                        {/* Excluir */}
                        <button
                          onClick={() =>
                            confirm(`Remover o módulo "${mod.nome}"?`) &&
                            deleteMutation.mutate(mod.id)
                          }
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {/* Preview do conteúdo */}
                    <p className={`text-[11px] mt-2 leading-relaxed line-clamp-2 ${t.textSub}`}>
                      {mod.conteudo}
                    </p>
                    <p className={`text-[10px] mt-1 ${t.textSub} opacity-60`}>
                      {mod.conteudo.length} chars
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Painel de Configurações ───────────────────────────────────────────────────
function PainelConfig({ dark, config, setConfig, saveConfig, saving, onClose }: any) {
  const t = dark ? DARK : LIGHT;
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"instrucoes" | "modulos" | "arquivos" | "webhook">("instrucoes");
  const [uploading, setUploading] = useState(false);
  const [novoArquivo, setNovoArquivo] = useState({ nome: "", descricao: "", tipo: "imagem" });
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);

  const { data: arquivos = [], isLoading: loadingArquivos } = useQuery({
    queryKey: ["agente-arquivos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("agente_arquivos")
        .select("*")
        .order("ordem")
        .order("created_at");
      return data ?? [];
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("agente_arquivos").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agente-arquivos"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      if (storagePath) await supabase.storage.from("agente-arquivos").remove([storagePath]);
      const { error } = await supabase.from("agente_arquivos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agente-arquivos"] });
      toast.success("Removido!");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivoSelecionado(file);
    if (!novoArquivo.nome)
      setNovoArquivo((p) => ({ ...p, nome: file.name.replace(/\.[^/.]+$/, "") }));
    if (file.type.startsWith("image/")) setNovoArquivo((p) => ({ ...p, tipo: "imagem" }));
    else if (file.type === "application/pdf") setNovoArquivo((p) => ({ ...p, tipo: "pdf" }));
    else setNovoArquivo((p) => ({ ...p, tipo: "documento" }));
  };

  const handleUpload = async () => {
    if (!arquivoSelecionado) {
      toast.error("Selecione um arquivo");
      return;
    }
    if (!novoArquivo.nome.trim()) {
      toast.error("Informe um nome");
      return;
    }
    if (!novoArquivo.descricao.trim()) {
      toast.error("Informe a descrição para a IA");
      return;
    }
    setUploading(true);
    try {
      const ext = arquivoSelecionado.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      console.log("Iniciando upload para:", path, "Tamanho:", arquivoSelecionado.size);

      const { error: upErr, data } = await supabase.storage
        .from("agente-arquivos")
        .upload(path, arquivoSelecionado);
      console.log("Resposta upload:", { upErr, data });

      if (upErr) {
        console.error("Erro detalhado:", upErr);
        throw new Error(`Erro ao fazer upload: ${upErr.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("agente-arquivos").getPublicUrl(path);
      console.log("URL pública:", publicUrl);

      const { error: insErr } = await supabase.from("agente_arquivos").insert({
        nome: novoArquivo.nome.trim(),
        descricao: novoArquivo.descricao.trim(),
        tipo: novoArquivo.tipo,
        url: publicUrl,
        storage_path: path,
        ativo: true,
        ordem: arquivos.length,
      });
      if (insErr) throw new Error(`Erro ao salvar no banco: ${insErr.message}`);

      toast.success("Arquivo adicionado!");
      setNovoArquivo({ nome: "", descricao: "", tipo: "imagem" });
      setArquivoSelecionado(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["agente-arquivos"] });
    } catch (e: any) {
      console.error("Erro completo:", e);
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: "instrucoes", label: "Instruções" },
    { id: "modulos", label: "🧩 Módulos" },
    { id: "arquivos", label: "📎 Arquivos" },
    { id: "webhook", label: "Técnico" },
  ] as const;

  return (
    <div className={`flex flex-col h-full ${t.settingsPanel}`}>
      {/* Header */}
      <div className={`flex items-center gap-4 px-4 py-4 ${t.sidebarHeader}`}>
        <button onClick={onClose} className={`p-1.5 rounded-full hover:bg-black/10 ${t.text}`}>
          <ChevronLeft size={20} />
        </button>
        <span className={`font-semibold text-base ${t.text}`}>Configurações</span>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${t.divider} shrink-0`}>
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`flex-1 py-3 text-xs font-semibold transition-all ${
              tab === tb.id ? "border-b-2 border-[#00a884] text-[#00a884]" : t.textSub
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ── Instruções ── */}
        {tab === "instrucoes" && config && (
          <>
            {/* Toggle ativo */}
            <div
              className={`flex items-center justify-between p-4 rounded-xl border ${t.settingsCard}`}
            >
              <div>
                <p className={`text-sm font-semibold ${t.text}`}>Agente ativo</p>
                <p className={`text-xs ${t.textSub}`}>Saborosa responde automaticamente</p>
              </div>
              <Switch
                checked={config.ativo}
                onCheckedChange={(v) => setConfig({ ...config, ativo: v })}
                className="data-[state=checked]:bg-[#00a884]"
              />
            </div>

            {/* Modo Treino */}
            <div
              className={`rounded-xl border p-4 space-y-3 ${config.modo_treino ? (dark ? "border-yellow-600 bg-yellow-900/20" : "border-yellow-300 bg-yellow-50") : t.settingsCard}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm font-semibold flex items-center gap-1.5 ${config.modo_treino ? "text-yellow-500" : t.text}`}
                  >
                    🎓 Modo Treino
                    {config.modo_treino && (
                      <span className="text-[10px] bg-yellow-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                        ATIVO
                      </span>
                    )}
                  </p>
                  <p className={`text-xs ${t.textSub}`}>Ensine a IA conversando pelo WhatsApp</p>
                </div>
                <Switch
                  checked={!!config.modo_treino}
                  onCheckedChange={(v) => setConfig({ ...config, modo_treino: v })}
                  className="data-[state=checked]:bg-yellow-500"
                />
              </div>

              {config.modo_treino && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div
                    className={`text-[11px] rounded-lg px-3 py-2.5 leading-relaxed ${dark ? "bg-yellow-900/30 text-yellow-300" : "bg-yellow-50 text-yellow-800"} border ${dark ? "border-yellow-700" : "border-yellow-200"}`}
                  >
                    <p className="font-bold mb-1">Como funciona:</p>
                    <p>1. Informe seu número abaixo e salve</p>
                    <p>2. No WhatsApp, converse normalmente com a Saborosa</p>
                    <p>3. Envie qualquer instrução e ela salva como módulo</p>
                    <p className="mt-1.5 font-bold">Comandos especiais:</p>
                    <p>
                      <code className="bg-black/10 px-1 rounded">#ver</code> — ver módulos recentes
                    </p>
                    <p>
                      <code className="bg-black/10 px-1 rounded">#testar</code> — ela responde como
                      cliente
                    </p>
                    <p>
                      <code className="bg-black/10 px-1 rounded">#sair</code> — desativa o modo
                      treino
                    </p>
                  </div>
                  <div>
                    <label className={`text-[10px] font-bold uppercase ${t.settingsLabel}`}>
                      Seu número (com DDI, sem +)
                    </label>
                    <input
                      value={config.treinador_telefone ?? ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          treinador_telefone: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      placeholder="Ex: 5547997391514"
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-yellow-500 ${t.settingsInput}`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className={`rounded-xl border p-4 space-y-3 ${t.settingsCard}`}>
              <div>
                <label
                  className={`text-[10px] font-bold uppercase tracking-wider ${t.settingsLabel}`}
                >
                  Nome da assistente
                </label>
                <input
                  value={config.nome_agente}
                  onChange={(e) => setConfig({ ...config, nome_agente: e.target.value })}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#00a884]/40 ${t.settingsInput}`}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label
                    className={`text-[10px] font-bold uppercase tracking-wider ${t.settingsLabel}`}
                  >
                    System Prompt
                  </label>
                  <span className={`text-[10px] ${t.textSub}`}>
                    {config.system_prompt?.length ?? 0} chars
                  </span>
                </div>
                <div
                  className={`text-[10px] rounded-lg px-3 py-2 mb-2 flex gap-1.5 items-start ${dark ? "bg-[#1b3a2d] text-[#5cad8a]" : "bg-[#f0fff8] text-[#128c7e]"}`}
                >
                  <Info size={11} className="shrink-0 mt-0.5" />
                  Cardápio, bairros, formas de pagamento e arquivos são injetados automaticamente.
                </div>
                <textarea
                  value={config.system_prompt}
                  onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                  rows={14}
                  className={`w-full rounded-lg border px-3 py-2 text-xs font-mono outline-none focus:ring-2 focus:ring-[#00a884]/40 resize-none leading-relaxed ${t.settingsInput}`}
                />
              </div>
              <button
                onClick={saveConfig}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00a884] text-white text-sm font-semibold hover:bg-[#008f72] transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Salvar
              </button>
            </div>
          </>
        )}

        {/* ── Módulos ── */}
        {tab === "modulos" && <AbaModulos dark={dark} />}

        {/* ── Arquivos ── */}
        {tab === "arquivos" && (
          <>
            <div className={`rounded-xl border p-4 space-y-3 ${t.settingsCard}`}>
              <p className={`text-sm font-semibold ${t.text}`}>Adicionar arquivo</p>
              <p className={`text-xs ${t.textSub}`}>
                A <strong>descrição</strong> é usada pela IA para decidir quando enviar o arquivo.
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all hover:border-[#00a884] ${dark ? "border-[#2a3942]" : "border-[#e9edef]"}`}
              >
                {arquivoSelecionado ? (
                  <p className={`text-sm ${t.text}`}>{arquivoSelecionado.name}</p>
                ) : (
                  <>
                    <Upload size={22} className={`mx-auto mb-1 ${t.textSub}`} />
                    <p className={`text-xs ${t.textSub}`}>
                      Clique para selecionar imagem, PDF ou documento
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-[10px] font-bold uppercase ${t.settingsLabel}`}>
                    Nome
                  </label>
                  <input
                    value={novoArquivo.nome}
                    onChange={(e) => setNovoArquivo((p) => ({ ...p, nome: e.target.value }))}
                    placeholder="Ex: Cardápio PDF"
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] ${t.settingsInput}`}
                  />
                </div>
                <div>
                  <label className={`text-[10px] font-bold uppercase ${t.settingsLabel}`}>
                    Tipo
                  </label>
                  <select
                    value={novoArquivo.tipo}
                    onChange={(e) => setNovoArquivo((p) => ({ ...p, tipo: e.target.value }))}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] ${t.settingsInput}`}
                  >
                    <option value="imagem">🖼️ Imagem</option>
                    <option value="pdf">📄 PDF</option>
                    <option value="documento">📎 Documento</option>
                  </select>
                </div>
              </div>
              <textarea
                value={novoArquivo.descricao}
                onChange={(e) => setNovoArquivo((p) => ({ ...p, descricao: e.target.value }))}
                placeholder="Quando a IA deve enviar este arquivo? Ex: Cardápio completo em PDF. Enviar quando cliente pedir o cardápio."
                rows={2}
                className={`w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#00a884] resize-none ${t.settingsInput}`}
              />
              <button
                onClick={handleUpload}
                disabled={uploading || !arquivoSelecionado}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#00a884] text-white text-sm font-semibold hover:bg-[#008f72] transition-all disabled:opacity-60"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}{" "}
                Enviar arquivo
              </button>
            </div>

            {/* Lista */}
            {loadingArquivos ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-[#00a884]" size={20} />
              </div>
            ) : arquivos.length === 0 ? (
              <p className={`text-center text-sm py-8 ${t.textSub}`}>Nenhum arquivo ainda.</p>
            ) : (
              <div className={`rounded-xl border overflow-hidden ${t.settingsCard}`}>
                {(arquivos as any[]).map((arq, i) => (
                  <div
                    key={arq.id}
                    className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? `border-t ${t.divider}` : ""} ${!arq.ativo ? "opacity-40" : ""}`}
                  >
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${dark ? "bg-[#2a3942]" : "bg-[#f0f2f5]"} overflow-hidden`}
                    >
                      {arq.tipo === "imagem" ? (
                        <img src={arq.url} className="h-full w-full object-cover" alt="" />
                      ) : arq.tipo === "pdf" ? (
                        <FileText size={18} className="text-red-400" />
                      ) : (
                        <File size={18} className={t.textSub} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${t.text}`}>{arq.nome}</p>
                      <p className={`text-[10px] truncate ${t.textSub}`}>{arq.descricao}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() =>
                          toggleAtivoMutation.mutate({ id: arq.id, ativo: !arq.ativo })
                        }
                        className={`p-1.5 rounded-lg ${arq.ativo ? "text-[#00a884]" : t.textSub}`}
                      >
                        {arq.ativo ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() =>
                          confirm(`Remover "${arq.nome}"?`) &&
                          deleteMutation.mutate({ id: arq.id, storagePath: arq.storage_path })
                        }
                        className="p-1.5 rounded-lg text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Técnico / Webhook ── */}
        {tab === "webhook" && (
          <>
            <div className={`rounded-xl border p-4 space-y-3 ${t.settingsCard}`}>
              <p className={`text-sm font-semibold ${t.text}`}>Webhook Meta</p>
              {[
                {
                  label: "URL de Callback",
                  val: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-agent`,
                },
                { label: "Verify Token", val: "saborosamente-webhook-2026" },
                { label: "Campo assinado", val: "messages" },
              ].map((row) => (
                <div key={row.label}>
                  <label className={`text-[10px] font-bold uppercase ${t.settingsLabel}`}>
                    {row.label}
                  </label>
                  <div
                    className={`mt-1 font-mono text-[11px] rounded-lg border px-3 py-2 break-all select-all ${t.settingsInput}`}
                  >
                    {row.val}
                  </div>
                </div>
              ))}
            </div>
            <div className={`rounded-xl border p-4 space-y-2 ${t.settingsCard}`}>
              <p className={`text-sm font-semibold flex items-center gap-1.5 text-red-400`}>
                <AlertTriangle size={14} /> Segurança
              </p>
              <p className={`text-[11px] leading-relaxed ${t.textSub}`}>
                Nunca compartilhe o WHATSAPP_TOKEN publicamente. Se exposto, revogue imediatamente
                em Meta for Developers e gere um novo token permanente.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Tela de chat de uma conversa ──────────────────────────────────────────────
function ChatView({ conversa, dark, onBack, onToggleModo }: any) {
  const t = dark ? DARK : LIGHT;
  const queryClient = useQueryClient();
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mensagensDaConversa: any[] = conversa.mensagens ?? [];
  const telefoneNormalizado = String(conversa.telefone ?? "").replace(/\D/g, "");

  // As campanhas são guardadas em tabelas próprias. Ao trazer os envios para a
  // conversa, o atendimento passa a exibir também o que a empresa enviou antes
  // de o cliente responder — inclusive campanhas disparadas antes desta tela.
  const { data: enviosDeCampanha = [] } = useQuery({
    queryKey: ["whatsapp-campanhas-do-contato", telefoneNormalizado],
    queryFn: async () => {
      const telefones = [...new Set([String(conversa.telefone ?? ""), telefoneNormalizado])].filter(Boolean);
      const { data, error } = await supabase
        .from("campanhas_whatsapp_envios")
        .select("campanha_id, status, enviado_em, created_at")
        .in("telefone", telefones)
        .order("enviado_em", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!telefoneNormalizado,
    staleTime: 15_000,
  });

  const idsCampanhas = [...new Set(enviosDeCampanha.map((envio: any) => envio.campanha_id))];
  const { data: campanhas = [] } = useQuery({
    queryKey: ["whatsapp-campanhas-detalhes", idsCampanhas],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanhas_whatsapp")
        .select("id, nome, mensagem")
        .in("id", idsCampanhas);
      if (error) throw error;
      return data ?? [];
    },
    enabled: idsCampanhas.length > 0,
    staleTime: 60_000,
  });

  const campanhasPorId = new Map((campanhas as any[]).map((campanha) => [campanha.id, campanha]));
  const mensagensDeCampanha = (enviosDeCampanha as any[])
    .map((envio) => {
      const campanha = campanhasPorId.get(envio.campanha_id);
      if (!campanha) return null;
      return {
        role: "assistant",
        content: campanha.mensagem,
        timestamp: envio.enviado_em ?? envio.created_at,
        campaignName: campanha.nome || "Campanha",
        deliveryStatus: envio.status,
      };
    })
    .filter(Boolean);
  const mensagens: any[] = [...mensagensDaConversa, ...mensagensDeCampanha].sort(
    (a, b) => new Date(a.timestamp ?? 0).getTime() - new Date(b.timestamp ?? 0).getTime(),
  );
  const somenteCampanha = conversa.somenteCampanha === true;
  const isHumano = conversa.modo === "humano";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length]);

  const handleSend = async () => {
    if (!msgText.trim() || sending) return;
    setSending(true);
    try {
      const novas = [...mensagensDaConversa, { role: "assistant", content: msgText, manual: true }].slice(
        -30,
      );
      await supabase
        .from("whatsapp_conversas")
        .update({ mensagens: novas, ultima_msg: new Date().toISOString() })
        .eq("id", conversa.id);
      const { ok, errorMsg } = await sendManualMessage(conversa.telefone, msgText);
      if (ok) {
        toast.success("Enviado!");
        setMsgText("");
        queryClient.invalidateQueries({ queryKey: ["whatsapp-conversas"] });
      } else toast.error(errorMsg ? `Erro: ${errorMsg}` : "Falha ao enviar");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  };

  // Agrupa mensagens por data
  const grupos: { date: string; msgs: any[] }[] = [];
  for (const msg of mensagens) {
    const d = msg.timestamp ? format(new Date(msg.timestamp), "dd/MM/yyyy") : "Hoje";
    const last = grupos[grupos.length - 1];
    if (last?.date === d) last.msgs.push(msg);
    else grupos.push({ date: d, msgs: [msg] });
  }

  const avatarColor = isHumano ? "bg-[#f0a202]" : "bg-[#00a884]";

  return (
    <div
      className={`flex flex-col h-full ${t.chatBg}`}
      style={{
        backgroundImage: dark
          ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='%23ffffff'/%3E%3C/svg%3E\")"
          : "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='1.5' fill='%23000000'/%3E%3C/svg%3E\")",
        backgroundSize: "60px",
      }}
    >
      {/* Chat header */}
      <div className={`flex items-center gap-3 px-4 py-3 shrink-0 ${t.chatHeader}`}>
        <button onClick={onBack} className={`p-1 rounded-full md:hidden ${t.textSub}`}>
          <ChevronLeft size={20} />
        </button>
        <div
          className={`h-10 w-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}
        >
          {getInitials(conversa.nome || conversa.telefone)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm leading-tight truncate ${t.text}`}>
            {conversa.nome || "Desconhecido"}
          </p>
          <p className={`text-xs ${t.textSub}`}>{conversa.telefone}</p>
        </div>
        {!somenteCampanha && (
          <button
            onClick={() => onToggleModo(conversa.id, conversa.modo)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              isHumano
                ? "bg-[#00a884] text-white hover:bg-[#008f72]"
                : "bg-[#f0a202] text-white hover:bg-[#d99200]"
            }`}
          >
            {isHumano ? (
              <>
                <Zap size={11} /> IA responder
              </>
            ) : (
              <>
                <User size={11} /> Assumir
              </>
            )}
          </button>
        )}
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {mensagens.length === 0 && (
          <div className="flex justify-center mt-10">
            <div
              className={`px-4 py-2 rounded-lg text-xs ${dark ? "bg-[#182229] text-[#8696a0]" : "bg-[#e2ffc7] text-[#667781]"}`}
            >
              Nenhuma mensagem ainda
            </div>
          </div>
        )}

        {mensagens.map((msg: any, i: number) => {
          const isOut = msg.role === "assistant";
          const isManual = msg.manual === true;
          const bubbleClass = isOut ? (isManual ? t.bubbleManual : t.bubbleOut) : t.bubbleIn;

          return (
            <div key={i} className={`flex ${isOut ? "justify-end" : "justify-start"} mb-0.5`}>
              <div
                className={`relative max-w-[72%] rounded-2xl px-3 py-2 shadow-sm text-sm leading-relaxed ${bubbleClass} ${
                  isOut ? "rounded-tr-sm" : "rounded-tl-sm"
                }`}
              >
                {isOut && isManual && (
                  <p className="text-[9px] font-bold opacity-60 mb-0.5">👤 Você</p>
                )}
                {isOut && !isManual && (
                  <p className="text-[9px] font-bold opacity-60 mb-0.5">
                    {msg.campaignName ? `📣 Campanha: ${msg.campaignName}` : "🤖 Saborosa"}
                  </p>
                )}
                <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                <div className={`flex items-center justify-end gap-1 mt-0.5`}>
                  <span className="text-[10px] opacity-50">
                    {msg.timestamp ? format(new Date(msg.timestamp), "HH:mm") : ""}
                  </span>
                  {isOut && <CheckCheck size={12} className="opacity-50" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`px-3 py-3 shrink-0 ${t.chatInput}`}>
        {somenteCampanha ? (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${dark ? "bg-[#182229] text-[#8696a0]" : "bg-[#f0f2f5] text-[#667781]"}`}
          >
            <MessageCircle size={16} />
            <span>Campanha enviada. Este contato ainda não respondeu.</span>
          </div>
        ) : !isHumano ? (
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${dark ? "bg-[#182229] text-[#8696a0]" : "bg-[#f0f2f5] text-[#667781]"}`}
          >
            <Bot size={16} />
            <span>Saborosa está respondendo automaticamente.</span>
            <button
              onClick={() => onToggleModo(conversa.id, conversa.modo)}
              className="ml-auto text-[#00a884] font-semibold text-xs hover:underline"
            >
              Assumir conversa
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 flex items-center gap-2 rounded-full px-4 py-2.5 ${t.chatInputField} border ${t.divider}`}
            >
              <Smile size={18} className={t.textSub} />
              <input
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())
                }
                placeholder="Digite uma mensagem"
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <Paperclip size={18} className={t.textSub} />
            </div>
            <button
              onClick={handleSend}
              disabled={!msgText.trim() || sending}
              className="h-11 w-11 rounded-full bg-[#00a884] flex items-center justify-center text-white hover:bg-[#008f72] transition-all disabled:opacity-50 shrink-0"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
function AdminAgentePage() {
  const queryClient = useQueryClient();
  const [dark, setDark] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [filterModo, setFilterModo] = useState<"todos" | "ia" | "humano" | "campanhas">("todos");

  const t = dark ? DARK : LIGHT;

  useQuery({
    queryKey: ["agente-config"],
    queryFn: async () => {
      const { data } = await supabase.from("agente_config").select("*").maybeSingle();
      if (data) setConfig(data);
      return data;
    },
  });

  const { data: conversas = [], isLoading } = useQuery({
    queryKey: ["whatsapp-conversas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_conversas")
        .select("*")
        .order("ultima_msg", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    refetchInterval: 8000,
  });

  // A maioria dos destinatários de campanha ainda não tem uma conversa criada,
  // pois não respondeu. Esta consulta os apresenta no painel sem criar dados
  // artificiais nem mudar o histórico do WhatsApp.
  const { data: enviosDeCampanha = [], isLoading: carregandoCampanhas } = useQuery({
    queryKey: ["whatsapp-envios-campanhas-painel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanhas_whatsapp_envios")
        .select("id, campanha_id, telefone, status, enviado_em, created_at")
        .order("enviado_em", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 15_000,
  });

  const idsCampanhasPainel = [...new Set((enviosDeCampanha as any[]).map((envio) => envio.campanha_id))];
  const { data: campanhasDoPainel = [] } = useQuery({
    queryKey: ["whatsapp-campanhas-painel", idsCampanhasPainel],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campanhas_whatsapp")
        .select("id, nome, mensagem")
        .in("id", idsCampanhasPainel);
      if (error) throw error;
      return data ?? [];
    },
    enabled: idsCampanhasPainel.length > 0,
    staleTime: 60_000,
  });

  const toggleAgenteMutation = useMutation({
    mutationFn: async (ativo: boolean) => {
      if (!config?.id) throw new Error("Configuração da IA não encontrada.");
      const { error } = await supabase
        .from("agente_config")
        .update({ ativo, updated_at: new Date().toISOString() })
        .eq("id", config.id);
      if (error) throw error;
      return ativo;
    },
    onSuccess: (ativo) => {
      setConfig((atual: any) => ({ ...atual, ativo }));
      queryClient.invalidateQueries({ queryKey: ["agente-config"] });
      toast.success(ativo ? "IA ligada: respostas automáticas ativadas." : "IA desligada: mensagens continuam no painel, sem resposta automática.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleModoMutation = useMutation({
    mutationFn: async ({ id, modoAtual }: { id: string; modoAtual: string }) => {
      const novoModo = modoAtual === "humano" ? "ia" : "humano";
      const { error } = await supabase
        .from("whatsapp_conversas")
        .update({ modo: novoModo })
        .eq("id", id);
      if (error) throw error;
      return novoModo;
    },
    onSuccess: (novoModo) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversas"] });
      toast.success(novoModo === "humano" ? "Você assumiu a conversa!" : "IA voltou a responder!");
    },
  });

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    const { error } = await supabase
      .from("agente_config")
      .update({
        nome_agente: config.nome_agente,
        system_prompt: config.system_prompt,
        ativo: config.ativo,
        modo_treino: config.modo_treino ?? false,
        treinador_telefone: config.treinador_telefone ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", config.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      queryClient.invalidateQueries({ queryKey: ["agente-config"] });
      toast.success("Salvo!");
    }
  };

  const humanasCount = (conversas as any[]).filter((c) => c.modo === "humano").length;

  const telefonesComConversa = new Set(
    (conversas as any[]).map((conversa) => String(conversa.telefone ?? "").replace(/\D/g, "")),
  );
  const campanhasPorIdPainel = new Map(
    (campanhasDoPainel as any[]).map((campanha) => [campanha.id, campanha]),
  );
  const campanhasSemResposta = (enviosDeCampanha as any[])
    .filter((envio) => !telefonesComConversa.has(String(envio.telefone ?? "").replace(/\D/g, "")))
    .map((envio) => ({
      id: `campanha-${envio.id}`,
      telefone: envio.telefone,
      nome: campanhasPorIdPainel.get(envio.campanha_id)?.nome
        ? `${campanhasPorIdPainel.get(envio.campanha_id).nome} · ${envio.telefone}`
        : envio.telefone,
      mensagens: [],
      ultima_msg: envio.enviado_em ?? envio.created_at,
      modo: "campanha",
      somenteCampanha: true,
      statusCampanha: envio.status,
    }));

  const itensDaLista = filterModo === "campanhas" ? campanhasSemResposta : (conversas as any[]);
  const filtered = itensDaLista.filter((c: any) => {
    const matchModo = filterModo === "todos" || filterModo === "campanhas" || c.modo === filterModo;
    const matchSearch =
      !search ||
      c.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.telefone?.includes(search);
    return matchModo && matchSearch;
  });

  const activeConversa = [...(conversas as any[]), ...campanhasSemResposta].find((c) => c.id === activeId);

  return (
    <div className={`flex h-[calc(100vh-56px)] overflow-hidden ${t.app}`}>
      {/* ── Sidebar esquerda ── */}
      <div
        className={`flex flex-col w-full md:w-[380px] shrink-0 border-r ${t.sidebar} ${t.divider} ${activeId && !showConfig ? "hidden md:flex" : "flex"}`}
      >
        {/* Header sidebar */}
        <div className={`flex items-center justify-between px-4 py-3 shrink-0 ${t.sidebarHeader}`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-sm">
              <Bot size={18} />
            </div>
            <div>
              <p className={`font-semibold text-sm ${t.text}`}>Saborosa</p>
              <p className={`text-[10px] ${t.textSub}`}>
                {config?.ativo ? "🟢 Ativa" : "🔴 Pausada"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleAgenteMutation.mutate(!config?.ativo)}
              disabled={!config || toggleAgenteMutation.isPending}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50 ${config?.ativo ? "bg-[#00a884] text-white hover:bg-[#008f72]" : "bg-[#f0a202] text-white hover:bg-[#d88900]"}`}
              title="Ligar ou desligar as respostas automáticas"
            >
              {config?.ativo ? "IA ligada" : "IA desligada"}
            </button>
            {humanasCount > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.badgeHumano}`}>
                {humanasCount}
              </span>
            )}
            <button
              onClick={() => setDark(!dark)}
              className={`p-2 rounded-full hover:bg-black/10 ${t.textSub}`}
              title="Alternar tema"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => {
                setShowConfig(!showConfig);
                setActiveId(null);
              }}
              className={`p-2 rounded-full hover:bg-black/10 ${t.textSub}`}
              title="Configurações"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Busca */}
        <div className={`px-3 py-2 shrink-0 ${t.sidebarSearch}`}>
          <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${t.sidebarSearchInput}`}>
            <Search size={15} className={t.textSub} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar ou começar nova conversa"
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className={`flex gap-2 px-3 py-2 shrink-0`}>
          {(["todos", "humano", "ia", "campanhas"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterModo(f)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterModo === f
                  ? "bg-[#00a884] text-white"
                  : `${dark ? "bg-[#2a3942] text-[#8696a0]" : "bg-[#f0f2f5] text-[#667781]"}`
              }`}
            >
              {f === "todos"
                ? "Tudo"
                : f === "humano"
                  ? "👤 Você"
                  : f === "ia"
                    ? "🤖 IA"
                    : `📣 Campanhas${carregandoCampanhas ? "" : ` (${campanhasSemResposta.length})`}`}
            </button>
          ))}
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-[#00a884]" size={22} />
            </div>
          ) : filtered.length === 0 ? (
            <div className={`py-16 text-center ${t.textSub} text-sm`}>Nenhuma conversa</div>
          ) : (
            filtered.map((c: any) => {
              const isActive = activeId === c.id;
              const isHumano = c.modo === "humano";
              const isCampanha = c.somenteCampanha === true;
              const lastMsg = c.mensagens?.at(-1);
              const avatarColor = isCampanha ? "bg-[#5850ec]" : isHumano ? "bg-[#f0a202]" : "bg-[#00a884]";

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveId(c.id);
                    setShowConfig(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b ${t.divider} ${isActive ? t.contactItemActive : t.contactItem}`}
                >
                  <div
                    className={`h-12 w-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}
                  >
                    {getInitials(c.nome || c.telefone)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`font-semibold text-sm truncate ${t.text}`}>
                        {c.nome || c.telefone}
                      </p>
                      <span
                        className={`text-[11px] shrink-0 ml-2 ${isHumano ? "text-[#f0a202]" : t.textTime}`}
                      >
                        {formatMsgTime(c.ultima_msg)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${t.textSub}`}>
                        {isCampanha
                          ? `📣 ${c.statusCampanha === "enviado" ? "Enviada" : c.statusCampanha}`
                          : <>{lastMsg?.role === "assistant" ? "🤖 " : ""}{lastMsg?.content?.slice(0, 45) ?? ""}</>}
                      </p>
                      {isHumano && (
                        <span
                          className={`ml-2 h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${t.badgeHumano}`}
                        >
                          !
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Área principal (chat ou config) ── */}
      <div className="flex-1 hidden md:flex flex-col overflow-hidden">
        {showConfig ? (
          <PainelConfig
            dark={dark}
            config={config}
            setConfig={setConfig}
            saveConfig={saveConfig}
            saving={saving}
            onClose={() => setShowConfig(false)}
          />
        ) : activeConversa ? (
          <ChatView
            conversa={activeConversa}
            dark={dark}
            onBack={() => setActiveId(null)}
            onToggleModo={(id: string, modo: string) =>
              toggleModoMutation.mutate({ id, modoAtual: modo })
            }
          />
        ) : (
          <div className={`flex flex-col items-center justify-center h-full gap-4 ${t.chatBg}`}>
            <div
              className={`h-20 w-20 rounded-full ${dark ? "bg-[#202c33]" : "bg-[#f0f2f5]"} flex items-center justify-center`}
            >
              <MessageCircle size={36} className={t.textSub} />
            </div>
            <div className="text-center">
              <p className={`text-lg font-semibold ${t.text}`}>Painel Saborosa</p>
              <p className={`text-sm ${t.textSub}`}>Selecione uma conversa para começar</p>
            </div>
            <div className={`flex gap-6 text-center mt-2`}>
              {[
                { label: "Contatos", val: (conversas as any[]).length },
                { label: "Aguardando", val: humanasCount },
                {
                  label: "Com IA",
                  val: (conversas as any[]).filter((c: any) => c.modo === "ia").length,
                },
              ].map((s) => (
                <div key={s.label}>
                  <p
                    className={`text-2xl font-black ${dark ? "text-[#00a884]" : "text-[#128c7e]"}`}
                  >
                    {s.val}
                  </p>
                  <p className={`text-xs ${t.textSub}`}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile: chat em fullscreen */}
      {activeId && !showConfig && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col">
          {activeConversa && (
            <ChatView
              conversa={activeConversa}
              dark={dark}
              onBack={() => setActiveId(null)}
              onToggleModo={(id: string, modo: string) =>
                toggleModoMutation.mutate({ id, modoAtual: modo })
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

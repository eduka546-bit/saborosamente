import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, Save, Bot, MessageCircle, Clock,
  User, Zap, Send, ChevronDown, ChevronUp,
  Settings, AlertTriangle, Info, Upload, Trash2,
  FileText, Image, File, Eye, EyeOff, GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/agente")({
  component: AdminAgentePage,
});

// ── Envio manual via Edge Function ────────────────────────────────────────────
async function sendManualMessage(to: string, text: string): Promise<{ ok: boolean; errorMsg?: string }> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ to, text }),
      }
    );
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = body?.error?.error?.message ?? body?.error ?? JSON.stringify(body);
      console.error("whatsapp-send error:", body);
      return { ok: false, errorMsg: String(detail) };
    }
    return { ok: true };
  } catch (e: any) {
    console.error("whatsapp-send fetch failed:", e);
    return { ok: false, errorMsg: e.message };
  }
}

// ── Card de conversa com handoff ──────────────────────────────────────────────
function ConversaCard({ c, onToggleModo }: { c: any; onToggleModo: (id: string, modo: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const queryClient = useQueryClient();

  const isHumano = c.modo === "humano";
  const mensagens: any[] = c.mensagens ?? [];

  const handleSend = async () => {
    if (!msgText.trim()) return;
    setSending(true);
    try {
      const novas = [...mensagens, { role: "assistant", content: msgText, manual: true }].slice(-20);
      await supabase.from("whatsapp_conversas").update({
        mensagens: novas, ultima_msg: new Date().toISOString(),
      }).eq("id", c.id);
      const { ok, errorMsg } = await sendManualMessage(c.telefone, msgText);
      if (ok) { toast.success("Enviado!"); setMsgText(""); queryClient.invalidateQueries({ queryKey: ["whatsapp-conversas"] }); }
      else toast.error(errorMsg ? `Erro: ${errorMsg}` : "Erro ao enviar. Verifique o console.");
    } catch (e: any) { toast.error("Erro: " + e.message); }
    finally { setSending(false); }
  };

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${isHumano ? "border-orange-200 bg-orange-50/30" : "border-gray-100 bg-white"}`}>
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${isHumano ? "bg-orange-100 text-orange-600" : "bg-[#5850ec]/10 text-[#5850ec]"}`}>
            {isHumano ? <User size={18} /> : <Bot size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 text-sm">{c.nome || "Desconhecido"}</p>
              <Badge className={isHumano ? "bg-orange-100 text-orange-700 text-[10px] hover:bg-orange-100" : "bg-[#5850ec]/10 text-[#5850ec] text-[10px] hover:bg-[#5850ec]/10"}>
                {isHumano ? "👤 Você" : "🤖 Saborosa"}
              </Badge>
            </div>
            <p className="text-xs text-gray-400">{c.telefone}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-1">
            <p className="text-[10px] text-gray-400 flex items-center gap-1 justify-end"><Clock size={10} />{format(new Date(c.ultima_msg), "dd/MM HH:mm", { locale: ptBR })}</p>
            <p className="text-[10px] text-gray-400">{mensagens.length} msgs</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleModo(c.id, c.modo); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isHumano ? "bg-[#5850ec] text-white hover:bg-[#4338ca]" : "bg-orange-100 text-orange-700 hover:bg-orange-200"}`}
          >
            {isHumano ? <><Zap size={12} /> IA responder</> : <><User size={12} /> Assumir</>}
          </button>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {!expanded && mensagens.length > 0 && (
        <div className="px-5 pb-3 ml-14">
          <p className="text-xs text-gray-500 truncate">
            <span className={`font-bold mr-1 ${mensagens.at(-1)?.role === "assistant" ? "text-[#5850ec]" : "text-gray-600"}`}>
              {mensagens.at(-1)?.role === "assistant" ? "Saborosa:" : "Cliente:"}
            </span>
            {mensagens.at(-1)?.content?.slice(0, 90)}
          </p>
        </div>
      )}

      {expanded && (
        <div className="border-t bg-gray-50/50 p-4 space-y-3">
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {mensagens.map((msg: any, i: number) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-white border text-gray-800 rounded-tl-sm"
                    : msg.manual
                    ? "bg-orange-500 text-white rounded-tr-sm"
                    : "bg-[#5850ec] text-white rounded-tr-sm"
                }`}>
                  {msg.manual && <p className="text-[9px] opacity-70 mb-0.5">👤 Você</p>}
                  {!msg.manual && msg.role === "assistant" && <p className="text-[9px] opacity-70 mb-0.5">🤖 Saborosa</p>}
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {isHumano && (
            <div className="flex gap-2 pt-2 border-t">
              <input
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
                placeholder="Digite sua resposta e pressione Enter..."
                className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300 bg-white"
              />
              <Button onClick={handleSend} disabled={sending || !msgText.trim()} className="bg-orange-500 hover:bg-orange-600 text-white shrink-0 gap-1.5">
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Enviar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Aba de Arquivos do Agente ────────────────────────────────────────────────
function AbaArquivos() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [novoArquivo, setNovoArquivo] = useState({ nome: "", descricao: "", tipo: "imagem" });
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);

  const { data: arquivos = [], isLoading } = useQuery({
    queryKey: ["agente-arquivos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agente_arquivos")
        .select("*")
        .order("ordem")
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("agente_arquivos").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["agente-arquivos"] }),
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      if (storagePath) {
        await supabase.storage.from("agente-arquivos").remove([storagePath]);
      }
      const { error } = await supabase.from("agente_arquivos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agente-arquivos"] });
      toast.success("Arquivo removido!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivoSelecionado(file);
    // Auto-preenche nome se estiver vazio
    if (!novoArquivo.nome) {
      setNovoArquivo(prev => ({ ...prev, nome: file.name.replace(/\.[^/.]+$/, "") }));
    }
    // Auto-detecta tipo
    if (file.type.startsWith("image/")) setNovoArquivo(prev => ({ ...prev, tipo: "imagem" }));
    else if (file.type === "application/pdf") setNovoArquivo(prev => ({ ...prev, tipo: "pdf" }));
    else setNovoArquivo(prev => ({ ...prev, tipo: "documento" }));
  };

  const handleUpload = async () => {
    if (!arquivoSelecionado) { toast.error("Selecione um arquivo"); return; }
    if (!novoArquivo.nome.trim()) { toast.error("Informe um nome"); return; }
    if (!novoArquivo.descricao.trim()) { toast.error("Informe uma descrição (a IA usa isso para saber quando enviar)"); return; }

    setUploading(true);
    try {
      const ext = arquivoSelecionado.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("agente-arquivos")
        .upload(path, arquivoSelecionado, { upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const { data: { publicUrl } } = supabase.storage
        .from("agente-arquivos")
        .getPublicUrl(path);

      const { error: insertError } = await supabase.from("agente_arquivos").insert({
        nome: novoArquivo.nome.trim(),
        descricao: novoArquivo.descricao.trim(),
        tipo: novoArquivo.tipo,
        url: publicUrl,
        storage_path: path,
        ativo: true,
        ordem: arquivos.length,
      });

      if (insertError) throw new Error(insertError.message);

      toast.success("Arquivo enviado! A Saborosa já pode usá-lo.");
      setNovoArquivo({ nome: "", descricao: "", tipo: "imagem" });
      setArquivoSelecionado(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["agente-arquivos"] });
    } catch (e: any) {
      toast.error("Erro no upload: " + e.message);
    } finally {
      setUploading(false);
    }
  };

  const tipoIcon = (tipo: string) => {
    if (tipo === "imagem") return <Image size={14} className="text-blue-500" />;
    if (tipo === "pdf") return <FileText size={14} className="text-red-500" />;
    return <File size={14} className="text-gray-500" />;
  };

  const tipoBadgeColor = (tipo: string) => {
    if (tipo === "imagem") return "bg-blue-50 text-blue-700 border-blue-100";
    if (tipo === "pdf") return "bg-red-50 text-red-700 border-red-100";
    return "bg-gray-50 text-gray-700 border-gray-100";
  };

  return (
    <div className="space-y-5">
      {/* Upload */}
      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          <Upload size={16} className="text-[#5850ec]" /> Adicionar arquivo
        </h4>

        <div className="bg-[#5850ec]/5 border border-[#5850ec]/10 rounded-xl px-3 py-2.5 flex items-start gap-2 text-[11px] text-[#5850ec]">
          <Info size={13} className="shrink-0 mt-0.5" />
          A <strong>descrição</strong> é o que a IA usa para decidir quando enviar o arquivo. Seja específico: ex. "Cardápio completo em PDF com todos os pratos e preços".
        </div>

        {/* Área de drop / seleção */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#5850ec]/40 hover:bg-[#5850ec]/5 transition-all"
        >
          {arquivoSelecionado ? (
            <div className="flex items-center justify-center gap-2">
              {tipoIcon(novoArquivo.tipo)}
              <span className="text-sm font-medium text-gray-700">{arquivoSelecionado.name}</span>
              <span className="text-xs text-gray-400">({(arquivoSelecionado.size / 1024).toFixed(0)} KB)</span>
            </div>
          ) : (
            <>
              <Upload size={24} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Clique para selecionar</p>
              <p className="text-xs text-gray-400 mt-1">Imagens (JPG, PNG, WebP) • PDF • Documentos</p>
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">Nome do arquivo</label>
            <input
              value={novoArquivo.nome}
              onChange={e => setNovoArquivo(p => ({ ...p, nome: e.target.value }))}
              placeholder="Ex: Cardápio Janeiro 2026"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">Tipo</label>
            <select
              value={novoArquivo.tipo}
              onChange={e => setNovoArquivo(p => ({ ...p, tipo: e.target.value }))}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30 bg-white"
            >
              <option value="imagem">🖼️ Imagem</option>
              <option value="pdf">📄 PDF</option>
              <option value="documento">📎 Documento</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-gray-400">
            Descrição para a IA <span className="text-red-400">*</span>
          </label>
          <textarea
            value={novoArquivo.descricao}
            onChange={e => setNovoArquivo(p => ({ ...p, descricao: e.target.value }))}
            placeholder="Ex: Cardápio completo em PDF com todos os pratos, preços e informações nutricionais. Envie quando o cliente pedir o cardápio completo."
            rows={3}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30 resize-none"
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={uploading || !arquivoSelecionado}
          className="w-full bg-[#5850ec] text-white"
        >
          {uploading ? <><Loader2 size={15} className="animate-spin mr-2" /> Enviando...</> : <><Upload size={15} className="mr-2" /> Enviar arquivo</>}
        </Button>
      </div>

      {/* Lista de arquivos */}
      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h4 className="font-bold text-gray-800 text-sm">Arquivos disponíveis para a Saborosa</h4>
          <span className="text-xs text-gray-400">{arquivos.filter((a: any) => a.ativo).length} ativos</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#5850ec]" size={24} /></div>
        ) : arquivos.length === 0 ? (
          <div className="py-12 text-center">
            <File size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Nenhum arquivo ainda.</p>
            <p className="text-xs text-gray-300 mt-1">Faça upload do cardápio em PDF, fotos dos pratos, etc.</p>
          </div>
        ) : (
          <div className="divide-y">
            {arquivos.map((arq: any) => (
              <div key={arq.id} className={`px-5 py-4 flex items-start gap-4 transition-all ${!arq.ativo ? "opacity-50" : ""}`}>
                {/* Preview */}
                <div className="h-12 w-12 rounded-xl border bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                  {arq.tipo === "imagem" ? (
                    <img src={arq.url} alt={arq.nome} className="h-full w-full object-cover rounded-xl" />
                  ) : arq.tipo === "pdf" ? (
                    <FileText size={22} className="text-red-400" />
                  ) : (
                    <File size={22} className="text-gray-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm truncate">{arq.nome}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tipoBadgeColor(arq.tipo)}`}>
                      {arq.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{arq.descricao}</p>
                  <a href={arq.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#5850ec] hover:underline mt-1 inline-block">
                    Ver arquivo ↗
                  </a>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleAtivoMutation.mutate({ id: arq.id, ativo: !arq.ativo })}
                    title={arq.ativo ? "Desativar" : "Ativar"}
                    className={`p-2 rounded-xl transition-all ${arq.ativo ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
                  >
                    {arq.ativo ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remover "${arq.nome}"?`)) {
                        deleteMutation.mutate({ id: arq.id, storagePath: arq.storage_path });
                      }
                    }}
                    className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Painel principal ──────────────────────────────────────────────────────────
function AdminAgentePage() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [filterModo, setFilterModo] = useState<"todos" | "ia" | "humano">("todos");

  const { isLoading: loadingConfig } = useQuery({
    queryKey: ["agente-config"],
    queryFn: async () => {
      const { data } = await supabase.from("agente_config").select("*").maybeSingle();
      if (data) setConfig(data);
      return data;
    },
  });

  const { data: conversas = [], isLoading: loadingConversas } = useQuery({
    queryKey: ["whatsapp-conversas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_conversas").select("*")
        .order("ultima_msg", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });

  const toggleModoMutation = useMutation({
    mutationFn: async ({ id, modoAtual }: { id: string; modoAtual: string }) => {
      const novoModo = modoAtual === "humano" ? "ia" : "humano";
      const { error } = await supabase.from("whatsapp_conversas").update({ modo: novoModo }).eq("id", id);
      if (error) throw error;
      return novoModo;
    },
    onSuccess: (novoModo) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversas"] });
      toast.success(novoModo === "humano" ? "Você assumiu a conversa! A IA parou de responder." : "IA voltou a responder automaticamente!");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });

  const saveConfig = async () => {
    if (!config) return;
    setSaving(true);
    const { error } = await supabase.from("agente_config")
      .update({ nome_agente: config.nome_agente, system_prompt: config.system_prompt, ativo: config.ativo, updated_at: new Date().toISOString() })
      .eq("id", config.id);
    setSaving(false);
    if (error) toast.error("Erro: " + error.message);
    else { queryClient.invalidateQueries({ queryKey: ["agente-config"] }); toast.success("Configurações salvas!"); }
  };

  const filteredConversas = conversas.filter((c: any) => filterModo === "todos" ? true : c.modo === filterModo);
  const humanasCount = conversas.filter((c: any) => c.modo === "humano").length;
  const totalHoje = conversas.filter((c: any) => new Date(c.ultima_msg).toDateString() === new Date().toDateString()).length;

  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#5850ec] flex items-center gap-2"><Bot size={24} /> Agente IA — Saborosa</h1>
          <p className="text-gray-500 text-sm mt-1">Assistente virtual do WhatsApp com suporte a handoff humano/IA.</p>
        </div>
        <div className="flex items-center gap-3">
          {humanasCount > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 animate-pulse">
              <User size={16} className="text-orange-600" />
              <span className="text-sm font-bold text-orange-700">{humanasCount} aguardando você</span>
            </div>
          )}
          {config && (
            <div className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2">
              <span className="text-sm text-gray-600 font-medium">{config.ativo ? "🟢 Ativa" : "🔴 Pausada"}</span>
              <Switch checked={config.ativo} onCheckedChange={v => { setConfig({ ...config, ativo: v }); }} />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total de contatos", value: conversas.length, icon: MessageCircle, color: "text-[#5850ec]", bg: "bg-[#5850ec]/5" },
          { label: "Ativos hoje", value: totalHoje, icon: Clock, color: "text-green-600", bg: "bg-green-50" },
          { label: "Aguardando você", value: humanasCount, icon: User, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Com IA", value: conversas.filter((c: any) => c.modo === "ia").length, icon: Bot, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon size={20} className={stat.color} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[480px_1fr]">

        {/* Configurações */}
        <div className="space-y-4">
          <Tabs defaultValue="instrucoes">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="instrucoes">Instruções</TabsTrigger>
              <TabsTrigger value="arquivos">📎 Arquivos</TabsTrigger>
              <TabsTrigger value="tecnico">Técnico</TabsTrigger>
            </TabsList>

            <TabsContent value="instrucoes" className="mt-4 space-y-4">
              {loadingConfig ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#5850ec]" size={28} /></div> : config ? (
                <div className="bg-white rounded-2xl border p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-gray-400">Nome da Assistente</label>
                    <input
                      value={config.nome_agente}
                      onChange={e => setConfig({ ...config, nome_agente: e.target.value })}
                      className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-gray-400">Instruções Completas (System Prompt)</label>
                      <span className="text-[10px] text-gray-400">{config.system_prompt?.length ?? 0} chars</span>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex items-start gap-2 text-[11px] text-amber-700">
                      <Info size={13} className="shrink-0 mt-0.5" />
                      O cardápio, endereço, formas de pagamento e dados do sistema são injetados automaticamente em cada conversa.
                    </div>
                    <textarea
                      value={config.system_prompt}
                      onChange={e => setConfig({ ...config, system_prompt: e.target.value })}
                      rows={16}
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#5850ec]/30 resize-none font-mono text-xs leading-relaxed"
                    />
                  </div>

                  <Button onClick={saveConfig} disabled={saving} className="w-full bg-[#5850ec] text-white">
                    {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                    Salvar Instruções
                  </Button>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="arquivos" className="mt-4">
              <AbaArquivos />
            </TabsContent>

            <TabsContent value="tecnico" className="mt-4 space-y-4">
              <div className="bg-white rounded-2xl border p-5 space-y-3">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2"><Settings size={16} className="text-[#5850ec]" /> Webhook Meta</h4>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400">URL de Callback</label>
                  <div className="font-mono text-[11px] bg-gray-50 rounded-xl px-3 py-2.5 border break-all text-gray-700 select-all">
                    {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-agent`}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Verify Token</label>
                  <div className="font-mono text-[11px] bg-gray-50 rounded-xl px-3 py-2.5 border text-gray-700 select-all">
                    saborosamente-webhook-2026
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Campos assinados</label>
                  <div className="font-mono text-[11px] bg-gray-50 rounded-xl px-3 py-2.5 border text-gray-700">
                    messages
                  </div>
                </div>
              </div>

              {/* Handoff */}
              <div className="bg-white rounded-2xl border p-5 space-y-3">
                <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2"><User size={16} className="text-orange-500" /> Sistema de Handoff</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  {[
                    { icon: "🤖", label: "Modo IA", desc: "Saborosa responde automaticamente todas as mensagens" },
                    { icon: "👤", label: "Modo Humano", desc: "IA para de responder — você responde pelo painel" },
                    { icon: "🔄", label: "Alternância", desc: "Clique em 'Assumir' ou 'IA responder' em cada conversa" },
                    { icon: "⚡", label: "Automático", desc: "A IA pode sugerir transferência em casos sensíveis" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-xl">
                      <span className="text-base shrink-0">{item.icon}</span>
                      <div>
                        <p className="font-bold text-gray-800">{item.label}</p>
                        <p className="text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aviso de segurança */}
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 space-y-1">
                <p className="text-xs font-bold text-red-700 flex items-center gap-1.5"><AlertTriangle size={13} /> Segurança</p>
                <p className="text-[11px] text-red-600">
                  Nunca compartilhe o WHATSAPP_TOKEN publicamente. Se exposto, revogue imediatamente em Meta for Developers e gere um novo token permanente.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Conversas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle size={18} className="text-[#5850ec]" /> Conversas
            </h3>
            <div className="flex gap-2">
              {(["todos", "humano", "ia"] as const).map(f => (
                <button key={f} onClick={() => setFilterModo(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterModo === f ? "bg-[#5850ec] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {f === "todos" ? `Todos (${conversas.length})` : f === "humano" ? `👤 Você (${humanasCount})` : `🤖 IA (${conversas.length - humanasCount})`}
                </button>
              ))}
            </div>
          </div>

          {loadingConversas ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#5850ec]" size={28} /></div>
          ) : filteredConversas.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-dashed">
              <MessageCircle size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">Nenhuma conversa ainda.</p>
              <p className="text-xs text-gray-300 mt-1">Mensagens do WhatsApp aparecerão aqui em tempo real.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
              {filteredConversas.map((c: any) => (
                <ConversaCard
                  key={c.id}
                  c={c}
                  onToggleModo={(id, modo) => toggleModoMutation.mutate({ id, modoAtual: modo })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

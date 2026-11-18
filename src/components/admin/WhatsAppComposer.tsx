import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageSquareText, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type RespostaRapida = { id: string; atalho: string; mensagem: string };
type Props = {
  value: string;
  onChange: (next: string) => void;
  onSend: () => void;
  placeholder: string;
  dark: boolean;
  disabled?: boolean;
};

const KEY = ["whatsapp-respostas-rapidas"];
const vazio = { atalho: "", mensagem: "" };

export function WhatsAppComposer({ value, onChange, onSend, placeholder, dark, disabled }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const [gerenciar, setGerenciar] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState(vazio);
  const [selecionada, setSelecionada] = useState(0);
  const [ocultarSugestoes, setOcultarSugestoes] = useState(false);
  const { data: respostas = [], isLoading, isError } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("whatsapp_respostas_rapidas")
        .select("id,atalho,mensagem").order("atalho");
      if (error) throw error;
      return (data ?? []) as RespostaRapida[];
    },
    staleTime: 60_000,
  });

  const termo = value.match(/(^|\s)\/([a-z0-9_-]*)$/i);
  const sugestoes = useMemo(() => {
    if (!termo) return [];
    const busca = termo[2].toLocaleLowerCase("pt-BR");
    return respostas.filter((r) => r.atalho.toLocaleLowerCase("pt-BR").includes(busca)).slice(0, 20);
  }, [respostas, termo?.[2]]);
  const menuAberto = Boolean(termo && !ocultarSugestoes);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.style.height = "auto";
    input.style.height = Math.min(124, Math.max(24, input.scrollHeight)) + "px";
  }, [value]);

  const colocar = (resposta: RespostaRapida) => {
    if (!termo) {
      onChange(value + (value && !value.endsWith("\n") ? "\n" : "") + resposta.mensagem);
    } else {
      const inicio = (termo.index ?? 0) + termo[1].length;
      onChange(value.slice(0, inicio) + resposta.mensagem);
    }
    setOcultarSugestoes(true);
    setSelecionada(0);
    inputRef.current?.focus();
  };

  const handleChange = (texto: string) => {
    onChange(texto);
    setSelecionada(0);
    setOcultarSugestoes(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (menuAberto && sugestoes.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelecionada((atual) => (atual + 1) % sugestoes.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelecionada((atual) => (atual - 1 + sugestoes.length) % sugestoes.length);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        colocar(sugestoes[Math.min(selecionada, sugestoes.length - 1)]);
        return;
      }
    }
    if (e.key === "Escape" && menuAberto) {
      e.preventDefault();
      setOcultarSugestoes(true);
      return;
    }
    // Em teclados touch, Enter quebra linha; enviar pelo botão.
    // Em teclados desktop, Enter envia e Shift+Enter insere nova linha.
    if (e.key === "Enter" && !e.shiftKey &&
        window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  const salvar = useMutation({
    mutationFn: async () => {
      const atalho = form.atalho.trim().toLowerCase().replace(/^\//, "");
      const mensagem = form.mensagem.replace(/\r\n/g, "\n");
      if (!/^[a-z0-9_-]{1,50}$/.test(atalho)) {
        throw new Error("Use um atalho de 1 a 50 caracteres, sem espaços ou acentos.");
      }
      if (!mensagem.trim() || mensagem.length > 4096) {
        throw new Error("Informe uma mensagem de até 4096 caracteres.");
      }
      const query = (supabase as any).from("whatsapp_respostas_rapidas");
      const { error } = editando
        ? await query.update({ atalho, mensagem, updated_at: new Date().toISOString() }).eq("id", editando)
        : await query.insert({ atalho, mensagem });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      setEditando(null);
      setForm(vazio);
      toast.success("Resposta rápida salva.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("whatsapp_respostas_rapidas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      toast.success("Resposta removida.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const painel = dark
    ? "border-[#3b4a54] bg-[#202c33] text-[#e9edef]"
    : "border-[#dfe3e5] bg-white text-[#111b21]";
  const campo = dark
    ? "border-[#54656f] bg-[#111b21] text-[#e9edef]"
    : "border-[#dfe3e5] bg-white text-[#111b21]";

  return (
    <>
      <div className="relative flex-1 min-w-0 flex items-center gap-1">
        {menuAberto && (
          <div className={"absolute bottom-[calc(100%+12px)] left-0 right-0 z-40 max-h-64 overflow-y-auto rounded-xl border shadow-2xl " + painel}>
            <div className="flex items-center justify-between border-b border-current/10 px-3 py-2 text-xs opacity-80">
              <span>Respostas rápidas · digite /atalho</span>
              <button type="button" className="font-semibold text-[#00a884]" onClick={() => setGerenciar(true)}>
                Gerenciar
              </button>
            </div>
            {isLoading ? (
              <div className="p-3 text-xs">Carregando respostas…</div>
            ) : isError ? (
              <div className="p-3 text-xs text-red-400">Erro ao carregar respostas. Tente atualizar a página.</div>
            ) : sugestoes.length ? (
              sugestoes.map((resposta, index) => (
                <button type="button" key={resposta.id}
                  onClick={() => colocar(resposta)}
                  className={"block w-full border-b border-current/5 px-3 py-2 text-left hover:bg-[#00a884]/15 " + (index === selecionada ? "bg-[#00a884]/15" : "")}>
                  <span className="text-sm font-semibold text-[#00a884]">/{resposta.atalho}</span>
                  <span className="mt-0.5 block truncate text-xs opacity-70">{resposta.mensagem}</span>
                </button>
              ))
            ) : (
              <div className="p-3 text-xs opacity-70">Nenhuma resposta com esse atalho.</div>
            )}
          </div>
        )}
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Mensagem do WhatsApp"
          rows={1}
          maxLength={4096}
          disabled={disabled}
          className="min-h-[24px] max-h-[124px] w-full flex-1 resize-none overflow-y-auto bg-transparent py-2 text-sm leading-5 outline-none placeholder:opacity-60 disabled:opacity-50"
        />
        <button type="button" onClick={() => setGerenciar(true)}
          title="Gerenciar respostas rápidas (/)" aria-label="Gerenciar respostas rápidas"
          className="shrink-0 rounded-full p-1 text-[#00a884] hover:bg-black/10">
          <MessageSquareText size={18} />
        </button>
      </div>

      {gerenciar && (
        <div role="dialog" aria-modal="true" aria-label="Gerenciar respostas rápidas"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/65 p-3">
          <div className={"flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border shadow-2xl " + painel}>
            <div className="flex items-center justify-between border-b border-current/10 px-4 py-3">
              <div>
                <p className="text-base font-semibold">Respostas rápidas</p>
                <p className="text-xs opacity-70">Salvas para a equipe. Digite / na conversa para inserir.</p>
              </div>
              <button type="button" title="Fechar" onClick={() => { setGerenciar(false); setEditando(null); setForm(vazio); }}
                className="rounded-full p-2 hover:bg-black/10"><X size={19} /></button>
            </div>
            <div className="space-y-3 overflow-y-auto p-4">
              <div className="space-y-2 rounded-xl border border-current/15 p-3">
                <p className="text-xs font-bold">{editando ? "Editar mensagem" : "Nova mensagem pronta"}</p>
                <label className="block text-xs">
                  Atalho (sem a barra)
                  <input value={form.atalho} maxLength={51} placeholder="campoalegre"
                    onChange={(e) => setForm((p) => ({ ...p, atalho: e.target.value }))}
                    className={"mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none " + campo} />
                </label>
                <label className="block text-xs">
                  Mensagem (preserva quebras de linha e *negrito* do WhatsApp)
                  <textarea rows={5} maxLength={4096} value={form.mensagem}
                    placeholder={"🚛 *Entregas CAMPO ALEGRE*\n📆 *Toda SEXTA*"}
                    onChange={(e) => setForm((p) => ({ ...p, mensagem: e.target.value }))}
                    className={"mt-1 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none " + campo} />
                </label>
                <div className="flex gap-2">
                  <button type="button" disabled={salvar.isPending || !form.atalho.trim() || !form.mensagem.trim()}
                    onClick={() => salvar.mutate()}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#00a884] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                    {salvar.isPending ? <Loader2 size={14} className="animate-spin" /> : editando ? <Save size={14} /> : <Plus size={14} />}
                    {editando ? "Salvar alterações" : "Salvar resposta"}
                  </button>
                  {editando && (
                    <button type="button" onClick={() => { setEditando(null); setForm(vazio); }}
                      className="rounded-lg border border-current/20 px-3 py-2 text-xs">Cancelar edição</button>
                  )}
                </div>
              </div>
              <p className="text-xs font-semibold opacity-70">Mensagens cadastradas ({respostas.length})</p>
              {respostas.map((resposta) => (
                <div key={resposta.id} className="flex items-start gap-3 rounded-xl border border-current/10 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#00a884]">/{resposta.atalho}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-xs opacity-80">{resposta.mensagem}</p>
                  </div>
                  <button type="button" title="Editar" onClick={() => { setEditando(resposta.id); setForm({ atalho: resposta.atalho, mensagem: resposta.mensagem }); }}
                    className="rounded-lg p-1.5 hover:bg-black/10"><Pencil size={16} /></button>
                  <button type="button" title="Excluir" disabled={excluir.isPending}
                    onClick={() => window.confirm("Excluir /" + resposta.atalho + "?") && excluir.mutate(resposta.id)}
                    className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10"><Trash2 size={16} /></button>
                </div>
              ))}
              {!respostas.length && <p className="text-xs opacity-60">Nenhuma resposta cadastrada.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

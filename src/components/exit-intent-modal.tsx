import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { X, MessageCircle, ShieldCheck, Phone, HeartHandshake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAbandonedCartSessionId } from "@/lib/abandoned-cart-session";
import { lerLeadPreCadastro } from "@/lib/lead-pre-cadastro";
import { trackEvent } from "@/lib/analytics";

interface ExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExitIntentModal({ isOpen, onClose }: ExitIntentModalProps) {
  const [telefone, setTelefone] = useState("");
  const [aceite, setAceite] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setErro("");
    const lead = lerLeadPreCadastro();
    if (lead?.telefone) setTelefone(lead.telefone);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !enviando) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, enviando, onClose]);

  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando) return;
    setErro("");
    const digits = telefone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
    if (!/^\d{10,11}$/.test(digits)) {
      setErro("Informe um WhatsApp válido com DDD.");
      return;
    }
    if (!aceite) {
      setErro("Confirme que deseja receber informações sobre o Grupo de Ofertas.");
      return;
    }
    setEnviando(true);
    try {
      const { error } = await (supabase as any).rpc("registrar_whatsapp_grupo_ofertas", {
        p_telefone: digits,
        p_session_id: getAbandonedCartSessionId(),
        p_nome: lerLeadPreCadastro()?.nome ?? null,
        p_aceite: true,
      });
      if (error) throw error;
      setEnviado(true);
      try {
        localStorage.setItem("saborosamente.grupo_ofertas.registrado.v1", "1");
        sessionStorage.setItem("saborosamente.whatsapp_ofertas_telefone", digits);
      } catch {
        // O cadastro no banco já foi concluído.
      }
      void trackEvent("marketing_optin", {
        metadata: { origem: "exit_intent_grupo_ofertas", canal: "whatsapp" },
      });
    } catch {
      setErro("Não conseguimos salvar seu WhatsApp agora. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
        aria-label="Fechar convite do Grupo de Ofertas" onClick={onClose} disabled={enviando} />
      <section role="dialog" aria-modal="true" aria-labelledby="grupo-ofertas-titulo"
        className="relative w-full max-w-[440px] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[24px] bg-[#F8F7EF] shadow-2xl">
        <button type="button" onClick={onClose} disabled={enviando} aria-label="Fechar"
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25">
          <X size={19}/>
        </button>
        <div className="relative overflow-hidden bg-[#064D2F] px-6 pb-7 pt-8 text-center text-white">
          <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 size-44 rounded-full border border-white/10"/>
          <span className="mb-3 inline-flex size-14 items-center justify-center rounded-2xl bg-white/10">
            <MessageCircle size={28} />
          </span>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#CDE7A4]">Grupo de Ofertas SaborosaMente</p>
          <h2 id="grupo-ofertas-titulo" className="text-[25px] font-extrabold leading-tight">Não vá embora ainda!</h2>
          <p className="mx-auto mt-3 max-w-[320px] text-sm leading-relaxed text-[#E3F1E7]">
            Entre em nosso <strong className="text-white">Grupo de Ofertas</strong> e não perca novidades e oportunidades especiais!
          </p>
        </div>

        {enviado ? (
          <div className="space-y-4 px-6 py-8 text-center">
            <ShieldCheck size={40} className="mx-auto text-[#086e45]" />
            <h3 className="text-lg font-bold text-[#064D2F]">Cadastro recebido!</h3>
            <p className="text-sm leading-relaxed text-[#3D5344]">
              Seu WhatsApp foi registrado. Você poderá receber informações e um convite para o nosso Grupo de Ofertas.
            </p>
            <button type="button" onClick={onClose}
              className="w-full rounded-xl bg-[#064D2F] px-4 py-3 font-semibold text-white hover:bg-[#003923]">
              Continuar navegando
            </button>
          </div>
        ) : (
          <form onSubmit={cadastrar} className="space-y-4 px-6 py-6">
            <p className="text-center text-sm text-[#3D5344]">
              Deixe seu WhatsApp com DDD para receber informações do grupo.
            </p>
            <div>
              <label htmlFor="exit-grupo-telefone" className="mb-1.5 block text-sm font-semibold text-[#203B2B]">
                Seu WhatsApp
              </label>
              <div className="relative">
                <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6A8975]"/>
                <input id="exit-grupo-telefone" type="tel" inputMode="tel" autoComplete="tel"
                  required maxLength={18} value={telefone} onChange={(event) => setTelefone(event.target.value)}
                  placeholder="(47) 99999-9999"
                  className="h-12 w-full rounded-xl border border-[#C5D8CA] bg-white pl-11 pr-3 text-base outline-none focus:ring-2 focus:ring-[#8BB924]"/>
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-[#405D4B]">
              <input type="checkbox" checked={aceite} onChange={event => setAceite(event.target.checked)}
                required className="mt-0.5 size-4 shrink-0 accent-[#064D2F]"/>
              <span>Quero receber pelo WhatsApp novidades, ofertas e um convite para o Grupo de Ofertas da SaborosaMente. Posso cancelar quando quiser.</span>
            </label>
            {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
            <button type="submit" disabled={enviando || !aceite}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#064D2F] px-5 py-3.5 font-bold text-white hover:bg-[#003923] disabled:opacity-50">
              <HeartHandshake size={18} />
              {enviando ? "Salvando..." : "Quero participar do Grupo de Ofertas"}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-[#65796B]">
              <ShieldCheck size={14}/> Cadastro gratuito. Sem cupom ou compra obrigatória.
            </p>
            <button type="button" onClick={onClose}
              className="w-full py-1 text-center text-xs font-medium text-[#5A6F60] hover:text-[#064D2F]">
              Agora não, continuar navegando
            </button>
          </form>
        )}
      </section>
    </div>,
    document.body,
  );
}

import { useEffect, useId, useState, type FormEvent } from "react";
import { Gift, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAbandonedCartSessionId } from "@/lib/abandoned-cart-session";
import { lerLeadPreCadastro } from "@/lib/lead-pre-cadastro";
import { trackEvent } from "@/lib/analytics";

/** Opt-in de ofertas, totalmente independente do sorteio e da recuperação do carrinho. */
export function CartMarketingOptin({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const [telefone, setTelefone] = useState("");
  const [aceite, setAceite] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [registrado, setRegistrado] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    try {
      const confirmedPhone = window.sessionStorage.getItem("saborosamente.whatsapp_ofertas_telefone");
      if (confirmedPhone && /^\d{10,11}$/.test(confirmedPhone)) {
        setTelefone(confirmedPhone);
        setRegistrado(true);
        return;
      }
    } catch { /* Storage indisponível: não bloquear formulário. */ }
    const lead = lerLeadPreCadastro();
    if (lead?.telefone) setTelefone(lead.telefone);
  }, []);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!aceite || salvando) return;
    const digits = telefone.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
    if (!/^\d{10,11}$/.test(digits)) {
      setErro("Informe um WhatsApp válido com DDD.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      const { error } = await (supabase as any).rpc("registrar_whatsapp_ofertas_carrinho", {
        p_telefone: digits,
        p_session_id: getAbandonedCartSessionId(),
        p_nome: lerLeadPreCadastro()?.nome ?? null,
      });
      if (error) throw error;
      setRegistrado(true);
      try {
        window.sessionStorage.setItem("saborosamente.whatsapp_ofertas_telefone", digits);
      } catch { /* Sem armazenamento local, o cadastro permanece registrado. */ }
      trackEvent("marketing_optin", { metadata: { origem: "carrinho", canal: "whatsapp" } });
    } catch {
      setErro("Não conseguimos salvar agora. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function cancelar() {
    setSalvando(true);
    setErro("");
    try {
      const { error } = await (supabase as any).rpc("revogar_whatsapp_ofertas_carrinho", {
        p_telefone: telefone,
        p_session_id: getAbandonedCartSessionId(),
      });
      if (error) throw error;
      setRegistrado(false);
      setAceite(false);
      try { window.sessionStorage.removeItem("saborosamente.whatsapp_ofertas_telefone"); } catch {}
    } catch {
      setErro("Não foi possível cancelar agora. Responda PARAR a qualquer mensagem recebida.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="min-w-0 rounded-2xl border border-[#cfe0d1] bg-[#f6faf5] p-3 sm:p-4" aria-label="Ofertas pelo WhatsApp">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#075d3a]">
        <Gift className="size-4 shrink-0" aria-hidden="true" />
        Receba cupons e ofertas no WhatsApp
      </div>
      {registrado ? (
        <div className="mt-2 space-y-2">
          <p className="text-xs leading-relaxed text-[#315440]" role="status">
            Pronto! Seu WhatsApp foi cadastrado para receber ofertas da SaborosaMente.
          </p>
          <button type="button" onClick={cancelar} disabled={salvando}
            className="text-xs font-semibold text-[#075d3a] underline disabled:opacity-50">
            Cancelar autorização
          </button>
          {erro && <p className="text-xs text-red-700" role="alert">{erro}</p>}
        </div>
      ) : (
        <form onSubmit={enviar} className="mt-2 space-y-2">
          <div className={compact ? "flex flex-col gap-2" : "flex flex-col gap-2 sm:flex-row"}>
            <label htmlFor={id} className="sr-only">WhatsApp com DDD para receber cupons</label>
            <input
              id={id} type="tel" inputMode="tel" autoComplete="tel" maxLength={18}
              placeholder="Seu WhatsApp com DDD" value={telefone}
              onChange={(event) => { setTelefone(event.target.value); setErro(""); }}
              className="h-11 min-w-0 w-full flex-1 rounded-xl border border-[#bfcfbe] bg-white px-3 text-base text-[#243e31] outline-none focus:ring-2 focus:ring-[#086e45]/25"
            />
            <button
              type="submit" disabled={!aceite || salvando}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#086e45] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              {salvando ? "Salvando..." : "Quero receber"}
            </button>
          </div>
          <label className="flex cursor-pointer items-start gap-2 text-xs leading-snug text-[#526357]">
            <input type="checkbox" checked={aceite} onChange={(event) => setAceite(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[#086e45]" />
            <span>Quero receber cupons e descontos da SaborosaMente pelo WhatsApp. Posso cancelar quando quiser, respondendo PARAR.</span>
          </label>
          {erro && <p className="text-xs text-red-700" role="alert">{erro}</p>}
        </form>
      )}
    </section>
  );
}

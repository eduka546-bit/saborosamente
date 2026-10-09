import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Gift, X, TicketCheck, Phone, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAbandonedCartSessionId } from "@/lib/abandoned-cart-session";
import { salvarLeadPreCadastro } from "@/lib/lead-pre-cadastro";
import { toast } from "sonner";

const PARTICIPOU_KEY = "saborosamente.sorteio.participou.v1";
const EXIBIDO_KEY = "saborosamente.sorteio.exibido_sessao.v1";

interface MonthlyRafflePopupProps {
  regulamentoUrl?: string;
}

export function MonthlyRafflePopup({ regulamentoUrl }: MonthlyRafflePopupProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [aceitePoliticas, setAceitePoliticas] = useState(false);
  const [sending, setSending] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const openManually = () => { setErro(""); setOpen(true); };
    window.addEventListener("saborosamente:abrir-sorteio", openManually);
    if (window.location.hash === "#participar-sorteio") {
      openManually();
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const visto = window.sessionStorage.getItem(EXIBIDO_KEY) === "1";
    const participou = window.localStorage.getItem(PARTICIPOU_KEY) === "1";
    if (!visto && !participou) {
      timeout = setTimeout(() => {
        window.sessionStorage.setItem(EXIBIDO_KEY, "1");
        setOpen(true);
      }, 7500);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
      window.removeEventListener("saborosamente:abrir-sorteio", openManually);
    };
  }, []);

  const fechar = () => {
    if (sending) return;

    setOpen(false);
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setErro("");
    const digits = telefone.replace(/\D/g, "");
    if (nome.trim().length < 3 || digits.length < 10 || digits.length > 13) {
      setErro("Informe seu nome e um telefone válido com DDD.");
      return;
    }
    if (!aceitePoliticas) {
      setErro("Aceite os termos do sorteio para continuar.");
      return;
    }
    setSending(true);
    try {
      const sessionId = getAbandonedCartSessionId();
      const { data, error } = await supabase.rpc("registrar_lead_sorteio", {
        p_nome: nome.trim(),
        p_telefone: digits,
        p_session_id: sessionId,
        p_aceite_regulamento: aceitePoliticas,
        p_optin_marketing: aceitePoliticas,
        p_optin_carrinho: aceitePoliticas,
      });
      if (error) throw error;
      if (data === "ja_participando") {
        setErro("Este telefone já está participando do sorteio! Não é necessário se cadastrar novamente.");
        return;
      }
      // O visitante pode aproveitar os mesmos dados ao criar sua conta e concluir a compra.
      salvarLeadPreCadastro(nome, digits, sessionId);
      // Este checkbox menciona expressamente marketing e recuperação por WhatsApp.
      window.localStorage.setItem(
        "saborosamente.recovery_whatsapp_consent", "1",
      );
      window.localStorage.setItem(PARTICIPOU_KEY, "1");
      toast.success("Cadastro recebido! Você participará das próximas edições conforme as condições da promoção.");
      window.sessionStorage.setItem(EXIBIDO_KEY, "1");
      setOpen(false);
      // Se já houver produtos no carrinho, salva um snapshot sem esperar 3min.
      window.dispatchEvent(new Event("saborosamente:lead-capturado"));
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "";
      setErro(mensagem.includes("não está disponível")
        ? "As inscrições ainda não estão abertas."
        : mensagem.includes("Sessão inválida")
          ? "Não foi possível identificar a sessão. Atualize a página e tente novamente."
          : "Não foi possível concluir o cadastro. Tente novamente em instantes.");
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
      <button
        type="button" aria-label="Fechar convite do sorteio" onClick={fechar}
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
      />
      <section
        role="dialog" aria-modal="true" aria-labelledby="sorteio-titulo"
        className="relative w-full max-w-[430px] max-h-[94vh] overflow-y-auto rounded-[24px] bg-[#fffef9] shadow-2xl"
      >
        <div className="bg-[#075d3a] text-white px-6 pt-7 pb-6 text-center relative">
          <button onClick={fechar} type="button" aria-label="Fechar"
            className="absolute right-3 top-3 rounded-full p-2 hover:bg-white/10">
            <X size={19}/>
          </button>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 mb-3">
            <Gift size={30}/>
          </div>
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[#d6f0d4]">
            Especial para quem está chegando
          </p>
          <h2 id="sorteio-titulo" className="text-2xl font-bold mt-2 leading-snug">
            Uma semana de marmitas pode ser sua!
          </h2>
          <p className="text-sm text-[#ecf4e8] mt-2 leading-relaxed">
            Cadastre-se para participar do sorteio mensal da SaborosaMente.
          </p>
        </div>
        <form onSubmit={enviar} className="p-5 sm:p-6 space-y-4">
          <p className="text-sm text-[#375244] flex gap-2 items-start">
            <TicketCheck size={18} className="shrink-0 text-[#08764a] mt-0.5"/>
            Cadastre-se uma vez. Se ganhar, volta a participar em janeiro do ano seguinte.
          </p>
          <div>
            <label htmlFor="sorteio-nome" className="block text-sm font-semibold text-[#243e31] mb-1">Nome completo</label>
            <input id="sorteio-nome" autoComplete="name" required maxLength={80}
              value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-[#cbdacc] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#08764a]"/>
          </div>
          <div>
            <label htmlFor="sorteio-telefone" className="block text-sm font-semibold text-[#243e31] mb-1">WhatsApp com DDD</label>
            <div className="relative">
              <Phone size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#547765]"/>
              <input id="sorteio-telefone" autoComplete="tel" type="tel" required
                value={telefone} onChange={e => setTelefone(e.target.value)} maxLength={18}
                placeholder="(47) 99999-9999"
                className="w-full rounded-xl border border-[#cbdacc] bg-white pl-10 pr-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#08764a]"/>
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-[#375244]">
            <input type="checkbox" required checked={aceitePoliticas}
              onChange={e => setAceitePoliticas(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#08764a]"/>
            <span>
              Aceito os termos do sorteio conforme{" "}
              <Link to="/privacidade" hash="regulamento-sorteio" target="_blank"
                className="underline font-semibold">regulamento</Link> e autorizo marketing e recuperação.
            </span>
          </label>
          {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
          <button type="submit" disabled={sending}
            className="w-full rounded-xl bg-[#08764a] hover:bg-[#075e3c] px-5 py-3.5 font-semibold text-white disabled:opacity-60">
            {sending ? "Registrando..." : "Quero participar"}
          </button>
          <p className="text-center text-xs text-[#657368] flex justify-center gap-1 items-center">
            <ShieldCheck size={13}/> Participação gratuita. Uma inscrição por telefone.
          </p>
          <button type="button" onClick={fechar}
            className="w-full text-center text-xs font-medium py-1 text-[#63766a] hover:text-[#075e3c]">
            Agora não, quero ver o cardápio
          </button>
        </form>
      </section>
    </div>
  );
}

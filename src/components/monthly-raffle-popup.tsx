import { useEffect, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { createPortal } from "react-dom";
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
        p_optin_marketing: false,
        p_optin_carrinho: false,
      });
      if (error) throw error;
      if (data === "ja_participando") {
        setErro("Este telefone já está participando do sorteio! Não é necessário se cadastrar novamente.");
        return;
      }
      // O visitante pode aproveitar os mesmos dados ao criar sua conta e concluir a compra.
      salvarLeadPreCadastro(nome, digits, sessionId);
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

  if (!open || typeof document === "undefined") return null;

  // Portal evita que o header ou algum container da página desloque/encubra o modal.
  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5">
      <button type="button" aria-label="Fechar convite do sorteio" onClick={fechar}
        className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" />
      <section role="dialog" aria-modal="true" aria-labelledby="sorteio-titulo"
        className="relative grid w-full max-w-[920px] max-h-[94dvh] overflow-y-auto rounded-[24px] bg-[#fffef9] shadow-2xl md:grid-cols-[0.95fr_1.05fr] md:overflow-hidden">
        <button onClick={fechar} type="button" aria-label="Fechar"
          className="absolute right-3 top-3 z-30 rounded-full p-2 bg-white/90 text-[#075d3a] shadow-sm hover:bg-white">
          <X size={19}/>
        </button>

        <div className="relative flex flex-col justify-center overflow-hidden bg-[#075d3a] px-7 py-9 text-center text-white md:min-h-[490px] md:px-9 md:py-12">
          <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full border border-white/15" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full border border-white/15" />
          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
            <Gift size={32}/>
          </div>
          <p className="relative text-xs font-semibold uppercase tracking-[0.14em] text-[#d8eebf]">
            Sorteio mensal SaborosaMente
          </p>
          <h2 id="sorteio-titulo" className="relative mx-auto mt-3 max-w-[370px] text-[1.75rem] font-semibold leading-[1.2] tracking-[-0.02em] md:text-[2rem]">
            Uma semana de marmitas congeladas gratuitas pra você!
          </h2>
          <p className="relative mx-auto mt-5 max-w-[340px] text-[15px] leading-relaxed text-[#f0f7ee]">
            <strong className="font-semibold text-white">Não precisa comprar nada!</strong> Só de se cadastrar, você já está concorrendo a uma semana de marmitas gratuitas.
          </p>
          <div className="relative mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white">
            <ShieldCheck size={16}/> Participe gratuitamente
          </div>
        </div>

        <form onSubmit={enviar} className="flex flex-col justify-center gap-4 p-5 sm:p-8 md:overflow-y-auto md:px-9 md:py-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6e8655]">Participe do sorteio</p>
            <h3 className="mt-1 text-xl font-bold text-[#075d3a]">Faça sua inscrição</h3>
          </div>
          <p className="flex items-start gap-2 text-sm leading-relaxed text-[#375244]">
            <TicketCheck size={19} className="mt-0.5 shrink-0 text-[#08764a]"/>
            Cadastre-se uma vez e continue elegível nos próximos sorteios previstos, até ser contemplado.
          </p>
          <div>
            <label htmlFor="sorteio-nome" className="mb-1 block text-sm font-semibold text-[#243e31]">Nome completo</label>
            <input id="sorteio-nome" autoComplete="name" required maxLength={80}
              value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Seu nome"
              className="w-full rounded-xl border border-[#cbdacc] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#08764a]"/>
          </div>
          <div>
            <label htmlFor="sorteio-telefone" className="mb-1 block text-sm font-semibold text-[#243e31]">WhatsApp com DDD</label>
            <div className="relative">
              <Phone size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#547765]"/>
              <input id="sorteio-telefone" autoComplete="tel" type="tel" required maxLength={18}
                value={telefone} onChange={e => setTelefone(e.target.value)}
                placeholder="(47) 99999-9999"
                className="w-full rounded-xl border border-[#cbdacc] bg-white py-3 pl-10 pr-4 text-base outline-none focus:ring-2 focus:ring-[#08764a]"/>
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-[#375244]">
            <input type="checkbox" required checked={aceitePoliticas}
              onChange={e => setAceitePoliticas(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#08764a]"/>
            <span>Aceito os termos do sorteio conforme{" "}
              <Link to="/privacidade" hash="regulamento-sorteio" target="_blank"
                className="font-semibold underline">regulamento</Link>.
            </span>
          </label>
          {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
          <button type="submit" disabled={sending}
            className="w-full rounded-xl bg-[#08764a] px-5 py-3.5 font-semibold text-white hover:bg-[#075e3c] disabled:opacity-60">
            {sending ? "Registrando..." : "Quero participar"}
          </button>
          <p className="flex items-center justify-center gap-1 text-center text-xs text-[#657368]">
            <ShieldCheck size={13}/> Participação gratuita. Uma inscrição por telefone.
          </p>
          <button type="button" onClick={fechar}
            className="w-full py-1 text-center text-xs font-medium text-[#63766a] hover:text-[#075e3c]">
            Agora não, quero ver o cardápio
          </button>
        </form>
      </section>
    </div>,
    document.body,
  );
}

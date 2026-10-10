import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAbandonedCartSessionId } from "@/lib/abandoned-cart-session";

interface UseAbandonedCartOptions {
  lines: Array<{
    productId: string;
    quantity: number;
    weight?: string;
    product?: any;
    subtotal?: number;
  }>;
  total: number;
  /** Chamar quando o exit intent for disparado — passa o cupom gerado e o percentual */
  onExitIntent: (coupon: string, discountPercent: number) => void;
}

export function useAbandonedCart({ lines, total, onExitIntent }: UseAbandonedCartOptions) {
  const sessionId = useRef(getAbandonedCartSessionId());
  const dbIdRef = useRef<string | null>(null);
  const couponRef = useRef<string | null>(null);
  const exitFiredRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivitySaveRef = useRef(0);
  const previousHadItemsRef = useRef(false);
  const startedAtRef = useRef(Date.now());
  const EXIT_COOLDOWN_KEY = "saborosamente.exit_intent.last_shown";
  const EXIT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
  const MIN_EXIT_VALUE = 40;
  const MIN_BROWSE_MS = 60 * 1000;
  // Não disparar no painel admin. IMPORTANTE: não fazer early return aqui —
  // os hooks abaixo precisam ser chamados sempre na mesma ordem (regras de
  // hooks do React). A flag isAdmin é usada para desativar a lógica interna.
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const isAdmin = path.startsWith("/admin");
  const isCheckout = path.startsWith("/checkout");
  const hasCart = lines.length > 0 && !isAdmin;

  // ── Salva / atualiza o carrinho no banco ──────────────────────────────────
  const saveToDb = useCallback(
    async (origem: "timeout" | "exit_intent" | "manual" = "timeout") => {
      if (!hasCart) return;

      try {
        // Snapshot dos itens para o banco
        const itens = lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          weight: l.weight,
          nome: l.product?.nome ?? l.productId,
          preco: l.product?.preco ?? 0,
          subtotal: l.subtotal ?? 0,
          imagem: l.product?.imagem_url ?? "",
        }));

        const { data, error } = await supabase.rpc("save_abandoned_cart", {
          p_session_id: sessionId.current,
          p_itens: itens,
          p_valor_total: total,
          p_origem: origem,
        });
        if (error) throw error;
        if (typeof data === "string") dbIdRef.current = data;
      } catch (err) {
        console.warn("[AbandonedCart] erro ao salvar:", err);
      }
    },
    [lines, total, hasCart],
  );

  // Cadastro no sorteio: se o visitante já montou o carrinho, cria/atualiza
  // o snapshot agora. O banco associa o lead pelo ID de sessão, sem login.
  useEffect(() => {
    if (typeof window === "undefined" || !hasCart) return;
    const onLeadCapturado = () => { void saveToDb("manual"); };
    window.addEventListener("saborosamente:lead-capturado", onLeadCapturado);
    return () => window.removeEventListener("saborosamente:lead-capturado", onLeadCapturado);
  }, [hasCart, saveToDb]);

  // ── Marca como convertido quando pedido é finalizado ─────────────────────
  const markConverted = useCallback(async () => {
    try {
      const { error } = await supabase.rpc("update_abandoned_cart_state", {
        p_session_id: sessionId.current,
        p_status: "convertido",
      });
      if (error) throw error;
      dbIdRef.current = null;
      exitFiredRef.current = false;
      // Limpa o cupom guardado para que próxima sessão gere um novo
      if (typeof window !== "undefined") {
        localStorage.removeItem("saborosamente.abandon_coupon");
      }
    } catch {
      /* falha silenciosa: marcar conversão é best-effort */
    }
  }, []);

  const issueCoupon = useCallback(async () => {
    const { data, error } = await supabase.rpc("issue_abandoned_cart_coupon", {
      p_session_id: sessionId.current,
    });
    if (error) throw error;
    const result = data as { codigo?: string; desconto?: number } | null;
    if (!result?.codigo) throw new Error("Cupom não foi gerado");
    if (typeof window !== "undefined") {
      localStorage.setItem("saborosamente.abandon_coupon", result.codigo);
    }
    return { coupon: result.codigo, discountPercent: Number(result.desconto ?? 5) };
  }, []);

  // ── Salva após 1,2 s de pausa na edição, em vez de esperar 3 minutos ───
  useEffect(() => {
    if (!hasCart) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      lastActivitySaveRef.current = Date.now();
      void saveToDb("manual");
    }, 1200);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [lines, total, hasCart, saveToDb]);

  // Se o cliente continua usando a página, mantém o rascunho ativo.
  // No máximo um heartbeat/minuto, mesmo com movimentos de mouse frequentes.
  // No banco, os rascunhos sem atividade há 10 min viram abandonados.
  useEffect(() => {
    if (!hasCart || typeof document === "undefined") return;
    const onActivity = () => {
      if (document.visibilityState === "hidden") return;
      const now = Date.now();
      if (now - lastActivitySaveRef.current < 60_000) return;
      lastActivitySaveRef.current = now;
      void saveToDb("manual");
    };
    document.addEventListener("pointerdown", onActivity, { passive: true });
    document.addEventListener("mousemove", onActivity, { passive: true });
    document.addEventListener("keydown", onActivity);
    document.addEventListener("scroll", onActivity, { passive: true, capture: true });
    document.addEventListener("touchstart", onActivity, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onActivity);
      document.removeEventListener("mousemove", onActivity);
      document.removeEventListener("keydown", onActivity);
      document.removeEventListener("scroll", onActivity, true);
      document.removeEventListener("touchstart", onActivity);
    };
  }, [hasCart, saveToDb]);

  // Saída da página: tentativa de registrar abandono imediatamente.
  // Caso o navegador interrompa a requisição, o cron no banco atua após 10 min.
  useEffect(() => {
    if (!hasCart || isCheckout || typeof window === "undefined") return;
    const onPageHide = () => { void saveToDb("exit_intent"); };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [hasCart, isCheckout, saveToDb]);

  // Não classificar como perdido um carrinho esvaziado pelo visitante.
  // A RPC somente altera rascunhos/abandonados; nunca reverte compra convertida.
  useEffect(() => {
    if (isAdmin) return;
    const hasItems = lines.length > 0;
    if (previousHadItemsRef.current && !hasItems) {
      void supabase.rpc("update_abandoned_cart_state", {
        p_session_id: sessionId.current,
        p_status: "esvaziado",
      });
    }
    previousHadItemsRef.current = hasItems;
  }, [lines.length, isAdmin]);

  // ── Exit intent: mouse sai pela borda superior ────────────────────────────
  useEffect(() => {
    if (!hasCart) return;

    const handleMouseLeave = async (e: MouseEvent) => {
      if (e.clientY > 5) return;
      if (exitFiredRef.current || isCheckout) return;
      if (total < MIN_EXIT_VALUE) return;
      if (Date.now() - startedAtRef.current < MIN_BROWSE_MS) return;

      const lastShown = Number(localStorage.getItem(EXIT_COOLDOWN_KEY) || 0);
      if (lastShown && Date.now() - lastShown < EXIT_COOLDOWN_MS) return;

      exitFiredRef.current = true;
      try {
        await saveToDb("exit_intent");
        const { coupon, discountPercent } = await issueCoupon();
        couponRef.current = coupon;
        localStorage.setItem(EXIT_COOLDOWN_KEY, String(Date.now()));
        onExitIntent(coupon, discountPercent);
      } catch (error) {
        console.warn("[AbandonedCart] erro ao gerar cupom:", error);
        exitFiredRef.current = false;
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [hasCart, saveToDb, issueCoupon, onExitIntent, total, isCheckout]);

  return { markConverted };
}

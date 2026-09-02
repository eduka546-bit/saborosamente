import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Gera ou reutiliza um session_id anônimo no localStorage
function getSessionId(): string {
  const key = "saborosamente.session_id";
  let id = typeof window !== "undefined" ? localStorage.getItem(key) : null;
  if (!id) {
    id = `sess_${crypto.randomUUID().replaceAll("-", "")}`;
    if (typeof window !== "undefined") localStorage.setItem(key, id);
  }
  return id;
}

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
  const sessionId = useRef(getSessionId());
  const dbIdRef = useRef<string | null>(null);
  const couponRef = useRef<string | null>(null);
  const exitFiredRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Não disparar no painel admin. IMPORTANTE: não fazer early return aqui —
  // os hooks abaixo precisam ser chamados sempre na mesma ordem (regras de
  // hooks do React). A flag isAdmin é usada para desativar a lógica interna.
  const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
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

  // ── Auto-save depois de 3 min parado com carrinho ─────────────────────────
  useEffect(() => {
    if (!hasCart) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(
      () => {
        saveToDb("timeout");
      },
      3 * 60 * 1000,
    ); // 3 minutos

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [lines, total, hasCart, saveToDb]);

  // ── Exit intent: mouse sai pela borda superior ────────────────────────────
  useEffect(() => {
    if (!hasCart) return;

    const handleMouseLeave = async (e: MouseEvent) => {
      if (e.clientY > 5) return;
      if (exitFiredRef.current) return;
      exitFiredRef.current = true;

      try {
        await saveToDb("exit_intent");
        const { coupon, discountPercent } = await issueCoupon();
        couponRef.current = coupon;
        onExitIntent(coupon, discountPercent);
      } catch (error) {
        console.warn("[AbandonedCart] erro ao gerar cupom:", error);
        exitFiredRef.current = false;
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [hasCart, saveToDb, issueCoupon, onExitIntent]);

  // ── beforeunload: salva se ainda tiver carrinho ───────────────────────────
  useEffect(() => {
    if (!hasCart) return;

    const handleUnload = () => {
      // Usa sendBeacon para garantir envio mesmo ao fechar aba
      const payload = JSON.stringify({
        session_id: sessionId.current,
        itens: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        valor_total: total,
        status: "abandonado",
        origem: "timeout",
        updated_at: new Date().toISOString(),
      });
      navigator.sendBeacon?.("/api/abandoned-cart", payload);
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [hasCart, lines, total]);

  return { markConverted };
}

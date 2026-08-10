import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Gera ou reutiliza um session_id anônimo no localStorage
function getSessionId(): string {
  const key = "saborosamente.session_id";
  let id = typeof window !== "undefined" ? localStorage.getItem(key) : null;
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    if (typeof window !== "undefined") localStorage.setItem(key, id);
  }
  return id;
}

// Gera cupom único baseado na sessão
export function generateAbandonCoupon(): string {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `VOLTA${suffix}`;
}

interface UseAbandonedCartOptions {
  lines: Array<{ productId: string; quantity: number; weight?: string; product?: any; subtotal?: number }>;
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
  const hasCart = lines.length > 0;

  // ── Salva / atualiza o carrinho no banco ──────────────────────────────────
  const saveToDb = useCallback(
    async (origem: "timeout" | "exit_intent" | "manual" = "timeout") => {
      if (!hasCart) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;

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

        const payload = {
          session_id: sessionId.current,
          user_id: user?.id ?? null,
          email: user?.email ?? null,
          itens,
          valor_total: total,
          status: "abandonado",
          origem,
          updated_at: new Date().toISOString(),
        };

        if (dbIdRef.current) {
          // Atualiza registro existente
          await supabase
            .from("carrinhos_abandonados")
            .update(payload)
            .eq("id", dbIdRef.current);
        } else {
          // Cria novo registro
          const { data } = await supabase
            .from("carrinhos_abandonados")
            .insert(payload)
            .select("id")
            .single();
          if (data?.id) dbIdRef.current = data.id;
        }
      } catch (err) {
        console.warn("[AbandonedCart] erro ao salvar:", err);
      }
    },
    [lines, total, hasCart]
  );

  // ── Marca como convertido quando pedido é finalizado ─────────────────────
  const markConverted = useCallback(async () => {
    if (!dbIdRef.current) return;
    try {
      await supabase
        .from("carrinhos_abandonados")
        .update({ status: "convertido", convertido_em: new Date().toISOString() })
        .eq("id", dbIdRef.current);
      dbIdRef.current = null;
      exitFiredRef.current = false;
    } catch {}
  }, []);

  // ── Salva cupom no banco ──────────────────────────────────────────────────
  const saveCoupon = useCallback(async (cupom: string) => {
    if (!dbIdRef.current) return;
    try {
      await supabase
        .from("carrinhos_abandonados")
        .update({ cupom_oferta: cupom, origem: "exit_intent" })
        .eq("id", dbIdRef.current);
    } catch {}
  }, []);

  // ── Auto-save depois de 3 min parado com carrinho ─────────────────────────
  useEffect(() => {
    if (!hasCart) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveToDb("timeout");
    }, 3 * 60 * 1000); // 3 minutos

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

      const coupon = generateAbandonCoupon();
      couponRef.current = coupon;

      // Busca o percentual configurado no banco
      let discountPercent = 5; // fallback padrão
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("exit_intent_discount")
          .maybeSingle();
        if (data?.exit_intent_discount) {
          discountPercent = Number(data.exit_intent_discount);
        }
      } catch {}

      await saveToDb("exit_intent");
      await saveCoupon(coupon);

      onExitIntent(coupon, discountPercent);
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [hasCart, saveToDb, saveCoupon, onExitIntent]);

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

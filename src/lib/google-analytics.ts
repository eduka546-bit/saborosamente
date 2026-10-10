import { createPageViewDeduper } from "@/lib/page-view-dedupe";

const GA_CONSENT_KEY = "saborosamente.analytics.google_consent";
const GA_SCRIPT_ID = "saborosamente-ga4-script";
const shouldTrackGooglePageView = createPageViewDeduper();

export type GoogleAnalyticsConsent = "granted" | "denied";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: any[]) => void;
    __saborosamenteGaId?: string;
  }
}

export function normalizeGoogleAnalyticsId(value: unknown) {
  const id = String(value ?? "").trim().toUpperCase();
  return /^G-[A-Z0-9]+$/.test(id) ? id : "";
}

export function getGoogleAnalyticsConsent(): GoogleAnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(GA_CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

function applyGoogleAnalyticsConsent(value: GoogleAnalyticsConsent) {
  if (typeof window === "undefined" || !window.gtag) return;

  // A troca de preferência precisa alcançar a tag que já está carregada.
  if (window.__saborosamenteGaId) {
    (window as Window & Record<string, unknown>)[`ga-disable-${window.__saborosamenteGaId}`] =
      value !== "granted";
  }
  window.gtag("consent", "update", {
    analytics_storage: value,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

export function setGoogleAnalyticsConsent(value: GoogleAnalyticsConsent) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GA_CONSENT_KEY, value);
  applyGoogleAnalyticsConsent(value);
  window.dispatchEvent(
    new CustomEvent("saborosamente:analytics-consent", { detail: value }),
  );
}

export function clearGoogleAnalyticsConsent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(GA_CONSENT_KEY);
  applyGoogleAnalyticsConsent("denied");
  window.dispatchEvent(
    new CustomEvent("saborosamente:analytics-consent", { detail: null }),
  );
}

export function initGoogleAnalytics(measurementId: string) {
  if (typeof window === "undefined") return false;
  const id = normalizeGoogleAnalyticsId(measurementId);
  if (!id || getGoogleAnalyticsConsent() !== "granted") return false;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag(...args: any[]) {
      window.dataLayer?.push(args);
    };

  if (window.__saborosamenteGaId !== id) {
    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.__saborosamenteGaId = id;
    applyGoogleAnalyticsConsent("granted");
    window.gtag("js", new Date());
    window.gtag("config", id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
  }

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }

  return true;
}

export function trackGoogleAnalyticsPageView(pathname: string) {
  if (typeof window === "undefined" || getGoogleAnalyticsConsent() !== "granted") return;
  if (!window.gtag || !shouldTrackGooglePageView(pathname)) return;
  window.gtag("event", "page_view", {
    page_path: pathname,
    page_location: window.location.href,
    page_title: document.title,
  });
}

function safePath(value: unknown) {
  if (typeof value !== "string" || !value) return undefined;
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin ? url.pathname : undefined;
  } catch {
    return value.startsWith("/") ? value.split("?")[0] : undefined;
  }
}

export function trackGoogleAnalyticsEvent(
  evento: string,
  options: {
    produtoId?: string | null;
    pedidoId?: string | null;
    valor?: number | null;
    metadata?: Record<string, unknown>;
  } = {},
) {
  if (typeof window === "undefined" || getGoogleAnalyticsConsent() !== "granted") return;
  if (!window.gtag) return;

  const metadata = options.metadata ?? {};

  if (evento === "page_view") {
    trackGoogleAnalyticsPageView(
      typeof metadata.pathname === "string" ? metadata.pathname : window.location.pathname,
    );
    return;
  }

  if (evento === "product_view") {
    window.gtag("event", "view_item", {
      currency: options.valor != null ? "BRL" : undefined,
      value: options.valor != null ? Number(options.valor) : undefined,
      items: [
        {
          item_id: options.produtoId ?? undefined,
          item_variant:
            typeof metadata.gramatura === "string" ? metadata.gramatura.slice(0, 40) : undefined,
        },
      ],
    });
    return;
  }

  if (evento === "add_to_cart") {
    window.gtag("event", "add_to_cart", {
      currency: "BRL",
      value: Number(options.valor ?? 0),
      items: [
        {
          item_id: options.produtoId ?? undefined,
          price: Number(options.valor ?? 0),
          quantity: 1,
          item_variant:
            typeof metadata.gramatura === "string" ? metadata.gramatura.slice(0, 40) : undefined,
        },
      ],
    });
    return;
  }

  if (evento === "product_share") {
    window.gtag("event", "share", {
      method:
        typeof metadata.metodo === "string" ? metadata.metodo.slice(0, 40) : undefined,
      content_type: "product",
      item_id: options.produtoId ?? undefined,
    });
    return;
  }

  if (evento === "size_select") {
    window.gtag("event", "select_content", {
      content_type: "product_size",
      item_id: options.produtoId ?? undefined,
      item_variant:
        typeof metadata.gramatura === "string" ? metadata.gramatura.slice(0, 40) : undefined,
    });
    return;
  }

  if (evento === "checkout_start") {
    window.gtag("event", "begin_checkout", {
      currency: "BRL",
      value: Number(options.valor ?? 0),
      items_count: Number(metadata.itens ?? 0),
    });
    return;
  }

  if (evento === "purchase") {
    window.gtag("event", "purchase", {
      transaction_id: options.pedidoId ?? undefined,
      currency: "BRL",
      value: Number(options.valor ?? 0),
      items_count: Number(metadata.itens ?? 0),
      payment_type:
        typeof metadata.pagamento === "string" ? metadata.pagamento.slice(0, 40) : undefined,
      fulfillment_type:
        typeof metadata.entrega === "string" ? metadata.entrega.slice(0, 40) : undefined,
      city: typeof metadata.cidade === "string" ? metadata.cidade.slice(0, 80) : undefined,
    });
    return;
  }

  if (evento === "ui_click") {
    window.gtag("event", "ui_click", {
      element_type:
        typeof metadata.tag === "string" ? metadata.tag.slice(0, 40) : undefined,
      destination: safePath(metadata.href),
    });
    return;
  }

  if (evento === "navigation_error") {
    window.gtag("event", "navigation_error", {
      error_type:
        typeof metadata.tipo === "string" ? metadata.tipo.slice(0, 60) : "unknown",
    });
    return;
  }

  const safeName = evento
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40);

  if (!safeName) return;
  window.gtag("event", safeName, {
    currency: options.valor != null ? "BRL" : undefined,
    value: options.valor != null ? Number(options.valor) : undefined,
    item_id: options.produtoId ?? undefined,
    transaction_id: options.pedidoId ?? undefined,
  });
}

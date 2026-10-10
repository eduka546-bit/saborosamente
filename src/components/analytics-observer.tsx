import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { getPublicSiteSettings } from "@/lib/site-settings";
import { initMicrosoftClarity, updateClarityConsent } from "@/lib/microsoft-clarity";
import {
  getGoogleAnalyticsConsent,
  initGoogleAnalytics,
  normalizeGoogleAnalyticsId,
  setGoogleAnalyticsConsent,
  trackGoogleAnalyticsPageView,
  type GoogleAnalyticsConsent,
} from "@/lib/google-analytics";

export function AnalyticsObserver({ pathname }: { pathname: string }) {
  const isPrivateArea = useMemo(
    () => pathname.startsWith("/admin") || pathname.startsWith("/cozinha"),
    [pathname],
  );
  const [measurementId, setMeasurementId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [consent, setConsent] = useState<GoogleAnalyticsConsent | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setConsent(getGoogleAnalyticsConsent());

    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<GoogleAnalyticsConsent | null>).detail;
      setConsent(detail ?? getGoogleAnalyticsConsent());
    };
    window.addEventListener("saborosamente:analytics-consent", onConsent);
    return () => window.removeEventListener("saborosamente:analytics-consent", onConsent);
  }, []);

  useEffect(() => {
    if (isPrivateArea) return;
    let active = true;

    getPublicSiteSettings()
      .then((settings) => {
        if (!active) return;
        const params = (settings as any)?.parametros_loja ?? {};
        const id = normalizeGoogleAnalyticsId(params.google_analytics_id);
        setMeasurementId(id);
        setEnabled(Boolean(params.google_analytics_ativo) && Boolean(id));
      })
      .catch(() => {
        if (!active) return;
        setMeasurementId("");
        setEnabled(false);
      })
      .finally(() => {
        if (active) setSettingsLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [isPrivateArea]);

  useEffect(() => {
    if (isPrivateArea) return;
    trackEvent("page_view", { metadata: { pathname } });
  }, [pathname, isPrivateArea]);

  useEffect(() => {
    if (isPrivateArea || !enabled || !measurementId || consent !== "granted") return;
    initGoogleAnalytics(measurementId);
    trackGoogleAnalyticsPageView(pathname);
  }, [pathname, isPrivateArea, enabled, measurementId, consent]);

  useEffect(() => {
    if (!isPrivateArea && consent === "granted") {
      initMicrosoftClarity();
    } else {
      updateClarityConsent("denied");
    }
  }, [isPrivateArea, consent]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onClick = (event: MouseEvent) => {
      if (
        window.location.pathname.startsWith("/admin") ||
        window.location.pathname.startsWith("/cozinha")
      ) {
        return;
      }
      const target =
        event.target instanceof Element
          ? event.target.closest("a,button,[role='button']")
          : null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      const label = (
        target.getAttribute("aria-label") ||
        target.getAttribute("title") ||
        target.textContent ||
        ""
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      const href = target instanceof HTMLAnchorElement ? target.getAttribute("href") : null;
      if (!label && !href) return;
      trackEvent("ui_click", {
        metadata: {
          tag,
          label: label || null,
          href: href || null,
        },
      });
    };

    const onError = () => {
      if (
        window.location.pathname.startsWith("/admin") ||
        window.location.pathname.startsWith("/cozinha")
      ) {
        return;
      }
      trackEvent("navigation_error", { metadata: { tipo: "window_error" } });
    };

    const onUnhandled = () => {
      if (
        window.location.pathname.startsWith("/admin") ||
        window.location.pathname.startsWith("/cozinha")
      ) {
        return;
      }
      trackEvent("navigation_error", { metadata: { tipo: "unhandled_rejection" } });
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandled);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandled);
    };
  }, []);

  if (
    isPrivateArea ||
    !settingsLoaded ||
    !enabled ||
    !measurementId ||
    consent !== null
  ) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-2xl rounded-2xl border border-black/10 bg-white/95 p-4 shadow-2xl backdrop-blur md:bottom-5 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-bold text-gray-900">Cookies de métricas</p>
          <p className="mt-1 text-xs leading-5 text-gray-600">
            Usamos Google Analytics e Microsoft Clarity para entender acessos, cliques e navegação,
            incluindo mapas de calor e gravações com dados sensíveis mascarados. Essas ferramentas
            só são carregadas após sua autorização. Você pode recusar ou mudar sua escolha na Política de Privacidade.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGoogleAnalyticsConsent("denied")}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
          >
            Somente essenciais
          </button>
          <button
            type="button"
            onClick={() => setGoogleAnalyticsConsent("granted")}
            className="rounded-xl bg-[#086e45] px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
          >
            Aceitar métricas
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div
      role="region"
      aria-label="Preferências de cookies"
      className="fixed inset-x-3 bottom-3 z-[100001] mx-auto max-w-2xl rounded-xl border border-[#d7e4d7] bg-white p-3 shadow-xl sm:bottom-4 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm leading-5 text-[#243e31]">
          Nosso site utiliza cookies para melhorar a navegação, você aceita os cookies?{" "}
          <a href="/privacidade#cookies-metricas" className="whitespace-nowrap text-[#075d3a] underline underline-offset-2">
            Política de Privacidade
          </a>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setGoogleAnalyticsConsent("denied")}
            className="min-w-16 rounded-lg border border-[#c9d9cd] bg-white px-4 py-2 text-sm font-semibold text-[#075d3a] hover:bg-[#f3f7f3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075d3a]"
          >
            Não
          </button>
          <button
            type="button"
            onClick={() => setGoogleAnalyticsConsent("granted")}
            className="min-w-16 rounded-lg bg-[#086e45] px-4 py-2 text-sm font-semibold text-white hover:bg-[#075e3c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075d3a]"
          >
            Sim
          </button>
        </div>
      </div>
    </div>
  );
}

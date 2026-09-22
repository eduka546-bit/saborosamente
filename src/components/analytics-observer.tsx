import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export function AnalyticsObserver({ pathname }: { pathname: string }) {
  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/cozinha")) return;
    trackEvent("page_view", { metadata: { pathname } });
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onClick = (event: MouseEvent) => {
      if (window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/cozinha")) return;
      const target = event.target instanceof Element
        ? event.target.closest("a,button,[role='button']")
        : null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      const label = (
        target.getAttribute("aria-label") ||
        target.getAttribute("title") ||
        target.textContent ||
        ""
      ).replace(/\s+/g, " ").trim().slice(0, 80);
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
      if (window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/cozinha")) return;
      trackEvent("navigation_error", { metadata: { tipo: "window_error" } });
    };

    const onUnhandled = () => {
      if (window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/cozinha")) return;
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

  return null;
}

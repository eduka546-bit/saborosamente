import { getGoogleAnalyticsConsent, type GoogleAnalyticsConsent } from "@/lib/google-analytics";

// Código do projeto Clarity fornecido pela SaborosaMente.
// Instalação carregada apenas depois da autorização para métricas.
export const CLARITY_PROJECT_ID = "yvlsty6593";
const CLARITY_SCRIPT_ID = "saborosamente-clarity-script";

declare global {
  interface Window {
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
}

export function updateClarityConsent(consent: GoogleAnalyticsConsent | null) {
  if (typeof window === "undefined" || !window.clarity) return;
  window.clarity("consentv2", {
    ad_Storage: "denied",
    analytics_Storage: consent === "granted" ? "granted" : "denied",
  });
  if (consent !== "granted") window.clarity("consent", false);
}

export function initMicrosoftClarity(): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") return false;
  if (getGoogleAnalyticsConsent() !== "granted") return false;

  // API oficial: enfileira eventos até o script externo carregar.
  if (!window.clarity) {
    const clarity = ((...args: unknown[]) => {
      (clarity.q = clarity.q || []).push(args);
    }) as NonNullable<Window["clarity"]>;
    window.clarity = clarity;
  }
  updateClarityConsent("granted");

  if (!document.getElementById(CLARITY_SCRIPT_ID)) {
    const tag = document.createElement("script");
    tag.id = CLARITY_SCRIPT_ID;
    tag.async = true;
    tag.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
    document.head.appendChild(tag);
  }
  return true;
}

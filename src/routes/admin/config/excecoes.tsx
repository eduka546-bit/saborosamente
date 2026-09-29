import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/config/excecoes")({
  component: LegacyExcecoesRedirect,
});

function LegacyExcecoesRedirect() {
  if (typeof window !== "undefined") {
    window.location.replace("/admin/config/horarios");
  }
  return null;
}

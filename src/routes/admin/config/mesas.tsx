import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/config/mesas")({
  component: LegacyMesasRedirect,
});

function LegacyMesasRedirect() {
  if (typeof window !== "undefined") {
    window.location.replace("/admin/pdv");
  }
  return null;
}

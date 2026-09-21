import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/cashback")({
  component: LegacyCashbackRedirect,
});

function LegacyCashbackRedirect() {
  if (typeof window !== "undefined") {
    window.location.replace("/admin/config/cashback-config");
  }
  return null;
}

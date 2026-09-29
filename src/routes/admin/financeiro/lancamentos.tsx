import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/financeiro/lancamentos")({
  component: LegacyFinanceiroLancamentosRedirect,
});

function LegacyFinanceiroLancamentosRedirect() {
  if (typeof window !== "undefined") {
    window.location.replace("/admin/financeiro");
  }
  return null;
}

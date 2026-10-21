import { createFileRoute } from "@tanstack/react-router";
import { EtiquetasPDFManager } from "@/components/cozinha/EtiquetasPDFManager";

export const Route = createFileRoute("/cozinha/etiquetas")({
  component: EtiquetasManager,
  ssr: false,
});

export function EtiquetasManager() {
  return <EtiquetasPDFManager />;
}

/** Entrada antiga P10 mantida como atalho para a tela única de lançamento. */
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/registrar-p10")({
  component: () => <Navigate to="/admin/pedidos/whatsapp" replace />,
  ssr: false,
});

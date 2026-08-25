import { Outlet, Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  component: function AdminLayoutWrapper() {
    return <AdminLayout />;
  },
  ssr: false,
});

function AdminLayout() {
  // Sem verificação de auth - acesso direto ao painel
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}

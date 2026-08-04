import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-12">
      <h1 className="text-3xl font-bold">Painel Administrativo</h1>
      <p className="mt-4 text-muted-foreground">
        Bem-vindo ao centro de controle da Saborosamente.
      </p>
      
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft flex flex-col items-center justify-center text-center">
          <h3 className="font-semibold text-muted-foreground uppercase text-sm tracking-wider">Pedidos Hoje</h3>
          <p className="mt-2 text-5xl font-bold">0</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft flex flex-col items-center justify-center text-center">
          <h3 className="font-semibold text-muted-foreground uppercase text-sm tracking-wider">Produtos Ativos</h3>
          <p className="mt-2 text-5xl font-bold">0</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-8 shadow-soft flex flex-col items-center justify-center text-center">
          <h3 className="font-semibold text-muted-foreground uppercase text-sm tracking-wider">Receita Mensal</h3>
          <p className="mt-2 text-5xl font-bold text-primary">R$ 0,00</p>
        </div>
      </div>
    </div>
  );
}

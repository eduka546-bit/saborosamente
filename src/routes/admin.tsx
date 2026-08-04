import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw redirect({
        to: "/admin/login" as any,
        search: { } as any, // @ts-ignore
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      await supabase.auth.signOut();
      throw redirect({
        to: "/admin/login" as any,
      });
    }
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Painel Administrativo</h1>
      <p className="mt-4 text-muted-foreground">
        Bem-vindo ao centro de controle da Saborosamente.
      </p>
      
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-semibold text-muted-foreground">Pedidos Hoje</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-semibold text-muted-foreground">Produtos Ativos</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-semibold text-muted-foreground">Receita Mensal</h3>
          <p className="mt-2 text-3xl font-bold text-primary">R$ 0,00</p>
        </div>
      </div>
    </div>
  );
}

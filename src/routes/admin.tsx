import { createFileRoute, redirect, Outlet, useRouter } from "@tanstack/react-router";
import { AdminHeader } from "@/components/admin-header";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const isLoginPage = pathname.includes("/admin/login");

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {!isLoginPage && <AdminHeader />}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}





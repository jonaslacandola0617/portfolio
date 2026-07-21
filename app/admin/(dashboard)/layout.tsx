import { requireAdmin } from "@/lib/services/auth-service";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense-in-depth: middleware.ts already blocked non-admins from
  // reaching here. This is the second, redundant check — see
  // lib/services/auth-service.ts for why it's worth the duplication.
  await requireAdmin();

  return (
    <div>
      <AdminSidebar />
      <main className="lg:pl-[272px]">{children}</main>
    </div>
  );
}

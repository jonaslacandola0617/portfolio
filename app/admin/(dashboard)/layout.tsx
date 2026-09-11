import { requireAdmin } from "@/lib/services/auth-service";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="admin-control-shell">
      <AdminSidebar />
      <AdminMobileNav />
      <main className="admin-control-main lg:pl-[248px]">{children}</main>
    </div>
  );
}

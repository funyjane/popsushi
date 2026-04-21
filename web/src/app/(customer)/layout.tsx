import { requireRole } from "@/lib/auth/role-guard";
import { RoleShell } from "@/components/role-shell";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("customer");
  return (
    <RoleShell
      displayName={user.displayName}
      email={user.email}
      role="customer"
    >
      {children}
    </RoleShell>
  );
}

import { requireRole } from "@/lib/auth/role-guard";
import { RoleShell } from "@/components/role-shell";

export default async function ChefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("chef");
  return (
    <RoleShell displayName={user.displayName} email={user.email} role="chef">
      {children}
    </RoleShell>
  );
}

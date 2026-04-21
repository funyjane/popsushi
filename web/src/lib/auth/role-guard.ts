import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UserRole = "customer" | "chef" | "admin";

// Where each role lands by default.
export const ROLE_HOME: Record<UserRole, string> = {
  customer: "/bookings",
  chef: "/chef/bookings",
  admin: "/", // no admin UI in MVP
};

export type ActiveUser = {
  userId: string;
  email: string | null;
  role: UserRole;
  displayName: string;
};

/**
 * Load the current user + profile. Redirects to /login if unauthenticated,
 * or to the role's default home if the role doesn't match `requiredRole`.
 *
 * Call from Server Components (e.g. route-group layouts) so the redirect
 * happens before any UI renders.
 */
export async function requireRole(requiredRole: UserRole): Promise<ActiveUser> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    // Profile row didn't land — trigger may have failed. Sign out and restart.
    await supabase.auth.signOut();
    redirect("/login?error=profile-missing");
  }

  if (profile.role !== requiredRole) redirect(ROLE_HOME[profile.role as UserRole]);

  return {
    userId: user.id,
    email: user.email ?? null,
    role: profile.role as UserRole,
    displayName: profile.display_name,
  };
}

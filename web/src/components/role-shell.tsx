import Link from "next/link";

type Props = {
  displayName: string;
  email: string | null;
  role: "customer" | "chef";
  children: React.ReactNode;
};

// Shared top-nav + logout POST form. Server Component — no interactivity.
export function RoleShell({ displayName, email, role, children }: Props) {
  const links =
    role === "customer"
      ? [
          { href: "/bookings", label: "My bookings" },
          { href: "/search", label: "Find a chef" },
        ]
      : [
          { href: "/chef/bookings", label: "Requests" },
          { href: "/chef/profile", label: "Profile" },
          { href: "/chef/menu", label: "Menu" },
        ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold tracking-tight">
              PopSushi
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-500 sm:inline">
              {displayName}
              {email ? ` · ${email}` : ""} ·{" "}
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                {role}
              </span>
            </span>
            <form action="/logout" method="POST">
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}

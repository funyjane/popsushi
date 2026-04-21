import { createServerAnonClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type HelloPayload = {
  now: string;
  postgres_version: string;
  postgis: string;
};

export default async function Home() {
  const supabase = createServerAnonClient();
  const { data, error } = await supabase.rpc("hello_rpc");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16 font-mono">
      <h1 className="text-3xl font-semibold tracking-tight">PopSushi</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Phase 0 hello-world. If you&apos;re reading this and the block below
        shows a timestamp, the web container is talking to Postgres through
        kong → postgrest.
      </p>

      {error ? (
        <pre className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {JSON.stringify({ error }, null, 2)}
        </pre>
      ) : (
        <pre className="overflow-x-auto rounded-md border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          {JSON.stringify(data as HelloPayload, null, 2)}
        </pre>
      )}

      <ul className="text-sm text-zinc-500 dark:text-zinc-400">
        <li>
          Studio:{" "}
          <a className="underline" href="http://localhost:54323">
            localhost:54323
          </a>
        </li>
        <li>
          Inbucket:{" "}
          <a className="underline" href="http://localhost:54324">
            localhost:54324
          </a>
        </li>
      </ul>
    </main>
  );
}

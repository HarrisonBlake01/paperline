import { auth, currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
        Welcome{user?.firstName ? `, ${user.firstName}` : ""}.
      </h1>
      <p className="mt-2 text-pl-fg-dim">
        Your workspace is loading. Once Supabase + Clerk are wired, this page will show
        KPI cards, recent uploads, and your activity feed.
      </p>
      <div className="mt-8 rounded-xl border border-pl-border bg-pl-surface p-5 text-sm text-pl-fg-dim">
        <div>Signed in as: <span className="font-mono text-pl-fg">{userId}</span></div>
      </div>
    </main>
  );
}

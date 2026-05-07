import { auth, currentUser } from "@clerk/nextjs/server";
import { UploadDropzone } from "@/components/upload-dropzone";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  return (
    <main className="mx-auto w-full max-w-5xl px-8 py-10">
      <div className="flex items-baseline justify-between">
        <h1 className="font-[var(--font-display)] text-3xl font-semibold tracking-tight">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}.
        </h1>
        <span className="font-mono text-xs text-pl-fg-dim">{userId}</span>
      </div>
      <p className="mt-2 text-pl-fg-dim">
        Drop a document below to extract structured data and chat with it.
      </p>

      <div className="mt-8">
        <UploadDropzone />
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Pages this month", value: "0" },
          { label: "Documents", value: "0" },
          { label: "Tokens used", value: "0" },
          { label: "Est. cost", value: "$0.00" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-pl-border bg-pl-surface p-5"
          >
            <div className="text-[11px] uppercase tracking-wider text-pl-fg-dim">
              {s.label}
            </div>
            <div className="mt-2 font-[var(--font-display)] text-2xl font-semibold">
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

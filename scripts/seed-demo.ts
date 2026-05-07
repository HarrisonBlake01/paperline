// =====================================================================
// Seed a public read-only demo workspace + a few sample documents.
// Run with: pnpm tsx scripts/seed-demo.ts
// =====================================================================

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { randomUUID } from "node:crypto";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("Missing Supabase env. Make sure .env.local is set.");
}
const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_USER_ID = "demo_recruiter_pin";
const DEMO_SLUG = process.env.DEMO_WORKSPACE_SLUG ?? "demo";
const SAMPLES_DIR = join(process.cwd(), "scripts", "samples");
const SAMPLE_FILES: { filename: string; doc_type: "invoice" | "contract" | "resume" | "report" }[] = [
  { filename: "sample-invoice.pdf", doc_type: "invoice" },
  { filename: "sample-contract.pdf", doc_type: "contract" },
  { filename: "sample-resume.pdf", doc_type: "resume" },
  { filename: "sample-report.pdf", doc_type: "report" },
];

async function main() {
  console.log("→ Ensuring demo workspace…");
  const { data: existing } = await sb
    .from("workspaces")
    .select("*")
    .eq("slug", DEMO_SLUG)
    .maybeSingle();

  let workspace = existing;
  if (!workspace) {
    const { data, error } = await sb
      .from("workspaces")
      .insert({
        slug: DEMO_SLUG,
        name: "Paperline Demo",
        plan: "team",
        pages_limit: 1_000_000,
      })
      .select()
      .single();
    if (error) throw error;
    workspace = data;
    console.log(`  created workspace ${workspace.id}`);
  } else {
    console.log(`  reused workspace ${workspace.id}`);
  }

  await sb
    .from("workspace_members")
    .upsert({ workspace_id: workspace.id, user_id: DEMO_USER_ID, role: "owner" });

  console.log("→ Uploading sample documents…");
  const bucket = process.env.SUPABASE_BUCKET_DOCUMENTS ?? "documents";

  for (const sample of SAMPLE_FILES) {
    const localPath = join(SAMPLES_DIR, sample.filename);
    if (!existsSync(localPath)) {
      console.warn(`  ! ${sample.filename} missing at ${localPath} (skipped)`);
      continue;
    }
    const buf = readFileSync(localPath);
    const id = randomUUID();
    const storagePath = `${workspace.id}/${id}/${sample.filename}`;

    const { error: upErr } = await sb.storage
      .from(bucket)
      .upload(storagePath, buf, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (upErr) {
      console.warn(`  ! upload failed for ${sample.filename}: ${upErr.message}`);
      continue;
    }

    await sb.from("documents").insert({
      id,
      workspace_id: workspace.id,
      uploader_id: DEMO_USER_ID,
      filename: sample.filename,
      storage_path: storagePath,
      mime_type: "application/pdf",
      size_bytes: buf.byteLength,
      doc_type: sample.doc_type,
      status: "queued",
    });
    console.log(`  + queued ${sample.filename}`);
  }

  console.log("\n✔ Demo seeded. Now run the processor for each queued document or hit");
  console.log("  POST /api/documents/<id>/process for each.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

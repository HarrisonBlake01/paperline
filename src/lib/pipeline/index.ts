// =====================================================================
// Document ingestion pipeline.
// =====================================================================
// Order of operations for a single document:
//   1. Mark `processing`
//   2. Download from storage → buffer
//   3. Parse PDF → text + per-page text
//   4. Auto-classify (sets doc_type unless overridden)
//   5. Chunk + embed → store in document_chunks
//   6. Mark `ready`, record page usage
//
// Anything that throws sets status=failed and records the error.
// =====================================================================

import { createServiceClient } from "@/lib/supabase/server";
import { recordUsage } from "@/lib/auth/usage";
import { parsePdf, looksLikeScan } from "@/lib/parsing/pdf";
import { parseScannedPdfWithOcr } from "@/lib/parsing/pdf-ocr";
import { parsePlainText } from "@/lib/parsing/text";
import { parseDocx } from "@/lib/parsing/docx";
import { parseImageWithOcr } from "@/lib/parsing/image";
import { chunkPages } from "@/lib/parsing/chunk";
import { embedTexts } from "@/lib/ai/embed";
import { classifyDocument } from "@/lib/ai/classify";
import { getBasicUser } from "@/lib/auth/clerk-users";
import { sendDocumentReadyEmail, sendUsageWarningEmail } from "@/lib/email/send";
import type { DocType } from "@/lib/types";

export interface ProcessOptions {
  documentId: string;
  /**
   * If provided, skip auto-classification and force this doc_type.
   */
  forceDocType?: DocType;
}

function unsupportedDocumentMessage(mimeType: string): string {
  return `Unsupported document type for processing: ${mimeType}`;
}

export async function processDocument(opts: ProcessOptions): Promise<void> {
  const sb = createServiceClient();

  // Load doc
  const { data: doc, error: docErr } = await sb
    .from("documents")
    .select("*")
    .eq("id", opts.documentId)
    .single();
  if (docErr || !doc) throw new Error(`Document not found: ${opts.documentId}`);

  await sb
    .from("documents")
    .update({ status: "processing", error_message: null })
    .eq("id", doc.id);

  try {
    // Download from storage
    const bucket =
      process.env.SUPABASE_BUCKET_DOCUMENTS ?? "documents";
    const { data: file, error: dlErr } = await sb.storage
      .from(bucket)
      .download(doc.storage_path);
    if (dlErr || !file) throw new Error(`Download failed: ${dlErr?.message}`);

    const buf = Buffer.from(await file.arrayBuffer());

    // Parse
    let parsed;
    let ocrMeta: { truncated: boolean; totalPages: number } | null = null;
    if (doc.mime_type === "application/pdf") {
      parsed = await parsePdf(buf);
      if (looksLikeScan(parsed)) {
        const ocrParsed = await parseScannedPdfWithOcr(buf, parsed.pageCount);
        ocrMeta = {
          truncated: ocrParsed.truncated,
          totalPages: ocrParsed.totalPages,
        };
        parsed = ocrParsed;
      }
    } else if (doc.mime_type === "text/plain") {
      parsed = parsePlainText(buf);
    } else if (
      doc.mime_type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      parsed = await parseDocx(buf);
    } else if (
      doc.mime_type === "image/png" ||
      doc.mime_type === "image/jpeg"
    ) {
      parsed = await parseImageWithOcr(buf, doc.mime_type);
    } else {
      throw new Error(unsupportedDocumentMessage(doc.mime_type));
    }

    if (!parsed.text.trim()) {
      throw new Error("No readable text could be extracted from this file.");
    }

    // Classify (unless forced)
    let docType: DocType;
    if (opts.forceDocType) {
      docType = opts.forceDocType;
    } else {
      try {
        docType = await classifyDocument(parsed.text);
      } catch {
        docType = "other";
      }
    }

    // Chunk + embed
    const chunks = chunkPages(parsed.pages);
    const embeddings = chunks.length
      ? await embedTexts(chunks.map((c) => c.text))
      : [];

    if (chunks.length) {
      // Wipe any prior chunks (re-processing case)
      await sb.from("document_chunks").delete().eq("document_id", doc.id);

      const rows = chunks.map((c, i) => ({
        workspace_id: doc.workspace_id,
        document_id: doc.id,
        chunk_index: c.chunkIndex,
        page_number: c.page,
        text: c.text,
        token_count: c.tokenCount,
        embedding: embeddings[i],
      }));

      // Batch insert in 200-row pages
      for (let i = 0; i < rows.length; i += 200) {
        const slice = rows.slice(i, i + 200);
        const { error } = await sb.from("document_chunks").insert(slice);
        if (error) throw error;
      }
    }

    await sb
      .from("documents")
      .update({
        status: "ready",
        page_count: parsed.pageCount,
        text_content: parsed.text.slice(0, 200_000),
        doc_type: docType,
      })
      .eq("id", doc.id);

    await recordUsage({
      workspaceId: doc.workspace_id,
      kind: "pages",
      amount: parsed.pageCount,
      referenceId: doc.id,
    });

    await sb.from("audit_logs").insert({
      workspace_id: doc.workspace_id,
      actor_user_id: doc.uploader_id,
      action: "document.processed",
      target_type: "document",
      target_id: doc.id,
      metadata: {
        page_count: parsed.pageCount,
        doc_type: docType,
        ocr: ocrMeta ?? undefined,
      },
    });

    const uploader = await getBasicUser(doc.uploader_id);
    if (uploader?.email) {
      try {
        await sendDocumentReadyEmail({
          to: uploader.email,
          name: uploader.firstName ?? undefined,
          documentId: doc.id,
          filename: doc.filename,
          docType,
          pageCount: parsed.pageCount,
        });
      } catch {
        // Non-fatal.
      }
    }

    const { data: workspace } = await sb
      .from("workspaces")
      .select("name, pages_used_this_period, pages_limit")
      .eq("id", doc.workspace_id)
      .single();

    if (workspace && workspace.pages_limit > 0 && uploader?.email) {
      const percent = Math.floor(
        (workspace.pages_used_this_period / workspace.pages_limit) * 100,
      );
      if (percent >= 80 && percent < 100) {
        try {
          await sendUsageWarningEmail({
            to: uploader.email,
            workspaceName: workspace.name,
            percent,
          });
        } catch {
          // Non-fatal.
        }
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[pipeline.processDocument] failed", {
      documentId: doc.id,
      mimeType: doc.mime_type,
      detail: message,
    });
    await sb
      .from("documents")
      .update({ status: "failed", error_message: message })
      .eq("id", doc.id);
    throw e;
  }
}

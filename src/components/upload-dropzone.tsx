"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { formatBytes } from "@/lib/utils";

interface UploadedDoc {
  id: string;
  filename: string;
  status: string;
}

export function UploadDropzone({ onUploaded }: { onUploaded?: (doc: UploadedDoc) => void }) {
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      setBusy(true);
      try {
        for (const file of list) {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/documents/upload", {
            method: "POST",
            body: fd,
          });
          if (!res.ok) {
            const detail = await res.text();
            toast.error(`Upload failed: ${file.name}`, { description: detail });
            continue;
          }
          const { document: doc } = await res.json();
          toast.success(`Uploaded ${file.name}`, {
            description: `${formatBytes(file.size)} · queued for processing`,
          });
          onUploaded?.(doc);
        }
      } finally {
        setBusy(false);
      }
    },
    [onUploaded],
  );

  return (
    <div
      className={`rounded-2xl border border-dashed p-10 text-center transition-colors ${
        over ? "border-[var(--pl-accent)] bg-pl-surface-2" : "border-pl-border bg-pl-surface"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files?.length) void upload(e.dataTransfer.files);
      }}
    >
      <UploadCloud
        className="mx-auto h-8 w-8 text-pl-fg-dim"
        strokeWidth={1.5}
      />
      <div className="mt-3 text-sm">
        Drag & drop documents here, or
        <button
          type="button"
          className="ml-1 underline decoration-pl-fg-dim underline-offset-4 hover:text-[var(--pl-accent)]"
          onClick={() => inputRef.current?.click()}
        >
          browse
        </button>
      </div>
      <div className="mt-1 text-xs text-pl-fg-dim">
        PDF, DOCX, TXT, PNG, JPG · up to 25 MB
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
        onChange={(e) => e.target.files && upload(e.target.files)}
      />
      {busy && <div className="mt-4 text-xs text-pl-fg-dim">Uploading…</div>}
    </div>
  );
}

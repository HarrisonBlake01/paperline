const PDF_SIGNATURE = Buffer.from("%PDF-");
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const ZIP_SIGNATURES = [
  Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  Buffer.from([0x50, 0x4b, 0x05, 0x06]),
  Buffer.from([0x50, 0x4b, 0x07, 0x08]),
];

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
]);

export type UploadValidationError =
  | "unsupported_type"
  | "empty_file"
  | "file_too_large"
  | "content_type_mismatch";

function startsWith(buffer: Buffer, signature: Buffer): boolean {
  return buffer.length >= signature.length && buffer.subarray(0, signature.length).equals(signature);
}

function isLikelyUtf8Text(buffer: Buffer): boolean {
  if (buffer.includes(0)) return false;
  const decoded = buffer.toString("utf8");
  if (decoded.includes("\uFFFD")) return false;
  const controls = [...decoded].filter((char) => {
    const code = char.charCodeAt(0);
    return code < 32 && ![9, 10, 12, 13].includes(code);
  }).length;
  return decoded.length === 0 || controls / decoded.length < 0.01;
}

function isLikelyDocx(buffer: Buffer): boolean {
  if (!ZIP_SIGNATURES.some((signature) => startsWith(buffer, signature))) return false;
  // ZIP central-directory filenames are stored in plain text. Requiring both
  // markers rejects generic ZIP files before Mammoth receives them.
  return (
    buffer.includes(Buffer.from("[Content_Types].xml")) &&
    buffer.includes(Buffer.from("word/document.xml"))
  );
}

export function validateUploadContent(input: {
  declaredMime: string;
  buffer: Buffer;
}): UploadValidationError | null {
  const { declaredMime, buffer } = input;
  if (!ALLOWED_UPLOAD_MIME_TYPES.has(declaredMime)) return "unsupported_type";
  if (buffer.length === 0) return "empty_file";
  if (buffer.length > MAX_UPLOAD_BYTES) return "file_too_large";

  const matches =
    declaredMime === "application/pdf"
      ? startsWith(buffer, PDF_SIGNATURE)
      : declaredMime === "image/png"
        ? startsWith(buffer, PNG_SIGNATURE)
        : declaredMime === "image/jpeg"
          ? startsWith(buffer, JPEG_SIGNATURE)
          : declaredMime ===
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ? isLikelyDocx(buffer)
            : isLikelyUtf8Text(buffer);

  return matches ? null : "content_type_mismatch";
}

export function sanitizeUploadFilename(filename: string): {
  displayName: string;
  storageName: string;
} {
  const withoutControls = filename.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  const leaf = withoutControls.split(/[\\/]/).pop() || "document";
  const displayName = leaf.slice(0, 180) || "document";
  const storageName =
    displayName
      .normalize("NFKC")
      .replace(/[^A-Za-z0-9._-]/g, "_")
      .replace(/^\.+/, "")
      .slice(0, 180) || "document";
  return { displayName, storageName };
}

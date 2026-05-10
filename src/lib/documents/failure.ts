export function explainDocumentFailure(
  errorMessage: string | null | undefined,
  mimeType?: string | null,
): { title: string; guidance: string } | null {
  if (!errorMessage) return null;

  if (errorMessage.includes("No readable text could be extracted")) {
    return {
      title: "No readable text found",
      guidance:
        mimeType === "image/jpeg" || mimeType === "image/png"
          ? "Try a sharper image, larger text, or better lighting. If the image truly has no text, this failure is expected."
          : "Try a cleaner file with selectable text, or re-upload a sharper scan.",
    };
  }

  if (errorMessage.includes("Unsupported document type")) {
    return {
      title: "File type not supported",
      guidance:
        "Paperline currently works best with TXT, PDF, DOCX, PNG, and JPG uploads.",
    };
  }

  if (errorMessage.includes("Incorrect API key") || errorMessage.includes("Missing OPENAI_API_KEY")) {
    return {
      title: "AI configuration issue",
      guidance:
        "The OpenAI key for this environment needs attention before processing can finish.",
    };
  }

  return {
    title: "Processing failed",
    guidance:
      "Try re-processing the document or uploading a cleaner version. If it keeps failing, the raw error below should help diagnose it.",
  };
}

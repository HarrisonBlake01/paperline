export type DocumentFailureCode =
  | "no_readable_text"
  | "unsupported_document_type"
  | "ai_configuration_error"
  | "ai_capacity_error"
  | "protected_document"
  | "processing_failed";

export function getDocumentFailureCode(
  errorMessage: string | null | undefined,
): DocumentFailureCode {
  const message = (errorMessage ?? "").toLowerCase();
  if (message === "no_readable_text" || message.includes("no readable text")) {
    return "no_readable_text";
  }
  if (
    message === "unsupported_document_type" ||
    message.includes("unsupported document type")
  ) {
    return "unsupported_document_type";
  }
  if (
    message === "ai_configuration_error" ||
    message.includes("incorrect api key") ||
    message.includes("missing openai_api_key") ||
    message.includes("401")
  ) {
    return "ai_configuration_error";
  }
  if (
    message === "ai_capacity_error" ||
    message.includes("quota") ||
    message.includes("429") ||
    message.includes("rate limit")
  ) {
    return "ai_capacity_error";
  }
  if (
    message === "protected_document" ||
    message.includes("password") ||
    message.includes("encrypted")
  ) {
    return "protected_document";
  }
  return "processing_failed";
}

export function explainDocumentFailure(
  errorMessage: string | null | undefined,
  mimeType?: string | null,
): { title: string; guidance: string; nextSteps: string[] } | null {
  if (!errorMessage) return null;
  const code = getDocumentFailureCode(errorMessage);

  if (code === "no_readable_text") {
    return {
      title: "No readable text found",
      guidance:
        mimeType === "image/jpeg" || mimeType === "image/png"
          ? "Try a sharper image, larger text, or better lighting. If the image truly has no text, this failure is expected."
          : "Try a cleaner file with selectable text, or re-upload a sharper scan.",
      nextSteps: [
        "Open the file locally and confirm the text is readable.",
        "Re-upload a cleaner scan or a version with selectable text.",
        "Use Re-process after replacing environment keys or parser settings.",
      ],
    };
  }

  if (code === "unsupported_document_type") {
    return {
      title: "File type not supported",
      guidance:
        "Paperline currently works best with TXT, PDF, DOCX, PNG, and JPG uploads.",
      nextSteps: [
        "Export the file as PDF, DOCX, TXT, PNG, or JPG.",
        "Upload the converted file from the dashboard.",
      ],
    };
  }

  if (code === "ai_configuration_error") {
    return {
      title: "AI configuration issue",
      guidance:
        "The document-processing service is temporarily unavailable. No document content was lost.",
      nextSteps: [
        "Try Re-process again in a few minutes.",
        "Contact the Paperline owner if the issue continues.",
      ],
    };
  }

  if (code === "ai_capacity_error") {
    return {
      title: "AI usage limit reached",
      guidance:
        "Document processing is temporarily at capacity.",
      nextSteps: [
        "Wait briefly, then click Re-process.",
        "Contact the Paperline owner if the issue continues.",
      ],
    };
  }

  if (code === "protected_document") {
    return {
      title: "Protected document",
      guidance:
        "The parser could not read this file because it appears to be password-protected or encrypted.",
      nextSteps: [
        "Remove the password or export an unlocked copy.",
        "Upload the unlocked file.",
      ],
    };
  }

  return {
    title: "Processing failed",
    guidance:
      "Try re-processing the document or uploading a cleaner version. Paperline keeps provider and parser details private.",
    nextSteps: [
      "Click Re-process to retry the pipeline.",
      "If it fails again, upload a cleaner or smaller copy.",
      "Contact the Paperline owner if the issue continues.",
    ],
  };
}

export function explainDocumentFailure(
  errorMessage: string | null | undefined,
  mimeType?: string | null,
): { title: string; guidance: string; nextSteps: string[] } | null {
  if (!errorMessage) return null;

  if (errorMessage.includes("No readable text could be extracted")) {
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

  if (errorMessage.includes("Unsupported document type")) {
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

  if (
    errorMessage.includes("Incorrect API key") ||
    errorMessage.includes("Missing OPENAI_API_KEY") ||
    errorMessage.includes("401")
  ) {
    return {
      title: "AI configuration issue",
      guidance:
        "The OpenAI key for this environment needs attention before processing can finish.",
      nextSteps: [
        "Check OPENAI_API_KEY in the active environment.",
        "Restart the dev server after changing env values.",
        "Click Re-process once the key is fixed.",
      ],
    };
  }

  if (
    errorMessage.includes("quota") ||
    errorMessage.includes("429") ||
    errorMessage.includes("rate limit")
  ) {
    return {
      title: "AI usage limit reached",
      guidance:
        "The AI provider rejected the request because of quota or rate limits.",
      nextSteps: [
        "Check provider billing and usage limits.",
        "Wait briefly if this is a rate limit.",
        "Click Re-process after capacity is available.",
      ],
    };
  }

  if (
    errorMessage.includes("password") ||
    errorMessage.includes("encrypted")
  ) {
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
      "Try re-processing the document or uploading a cleaner version. If it keeps failing, the raw error below should help diagnose it.",
    nextSteps: [
      "Click Re-process to retry the pipeline.",
      "If it fails again, upload a cleaner or smaller copy.",
      "Use the raw error when debugging the parser or AI call.",
    ],
  };
}

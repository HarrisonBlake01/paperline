import { getOpenAI, MODELS } from "@/lib/openai";

function mimeToDataUrl(mimeType: string, buffer: Buffer): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function extractTextFromImageDataUrl(dataUrl: string): Promise<string> {
  const openai = getOpenAI();
  const resp = await openai.chat.completions.create({
    model: MODELS.extraction,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You perform OCR on document images. Return only the extracted text, preserving line breaks where helpful. Do not summarize.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all readable text from this document image. Return plain text only.",
          },
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
  });

  return (resp.choices[0]?.message?.content ?? "").trim();
}

export async function extractTextFromImageBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  return extractTextFromImageDataUrl(mimeToDataUrl(mimeType, buffer));
}

// =====================================================================
// Shared domain types. These mirror DB rows but stay UI-friendly.
// =====================================================================

export type DocStatus = "queued" | "processing" | "ready" | "failed";
export type DocType = "invoice" | "contract" | "resume" | "report" | "other";
export type ExtractionStatus = "queued" | "processing" | "succeeded" | "failed";
export type Role = "owner" | "admin" | "member";

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  plan: "free" | "pro" | "team" | "enterprise";
  pages_used_this_period: number;
  pages_limit: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRow {
  id: string;
  workspace_id: string;
  folder_id: string | null;
  uploader_id: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  page_count: number | null;
  doc_type: DocType | null;
  status: DocStatus;
  error_message: string | null;
  text_content: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TemplateField {
  name: string;
  type: "text" | "number" | "date" | "currency" | "boolean" | "list";
  required?: boolean;
  description?: string;
}

export interface TemplateSchema {
  fields: TemplateField[];
}

export interface TemplateRow {
  id: string;
  workspace_id: string | null;
  name: string;
  description: string | null;
  doc_type: DocType;
  schema: TemplateSchema;
  is_builtin: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ExtractedField {
  value: unknown;
  confidence: number; // 0-100
}

export interface ExtractionResult {
  fields: Record<string, ExtractedField>;
}

export interface ExtractionRow {
  id: string;
  workspace_id: string;
  document_id: string;
  template_id: string;
  status: ExtractionStatus;
  result: ExtractionResult | null;
  user_corrections: Record<string, unknown> | null;
  model: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  cost_cents: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatCitation {
  chunk_id: string;
  page: number | null;
  snippet: string;
}

export interface ChatMessageRow {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: ChatCitation[] | null;
  created_at: string;
}

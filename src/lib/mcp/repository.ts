import { createServiceClient } from "@/lib/supabase/server";
import type { McpPrincipal } from "@/lib/mcp/auth";

export interface McpDocumentSummary {
  id: string;
  filename: string;
  status: string;
  docType: string | null;
  pageCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface McpCitation {
  chunkId: string;
  page: number | null;
  snippet: string;
}

export interface McpTemplateSummary {
  id: string;
  name: string;
  description: string | null;
  docType: string;
  builtIn: boolean;
  schema: unknown;
}

export interface McpRepository {
  listDocuments(
    principal: McpPrincipal,
    options: { limit: number; offset: number },
  ): Promise<{ documents: McpDocumentSummary[]; nextOffset: number | null }>;
  getDocumentSummary(
    principal: McpPrincipal,
    documentId: string,
  ): Promise<McpDocumentSummary | null>;
  getDocumentCitations(
    principal: McpPrincipal,
    options: { documentId: string; limit: number; offset: number },
  ): Promise<{ documentFound: boolean; citations: McpCitation[]; nextOffset: number | null }>;
  listTemplates(
    principal: McpPrincipal,
    options: { limit: number; offset: number },
  ): Promise<{ templates: McpTemplateSummary[]; nextOffset: number | null }>;
  recordToolAudit(
    principal: McpPrincipal,
    event: { tool: string; outcome: "succeeded" | "failed"; durationMs: number },
  ): Promise<void>;
}

export class McpRepositoryError extends Error {
  constructor(public readonly operation: string) {
    super("Paperline data access failed.");
    this.name = "McpRepositoryError";
  }
}

export function createSupabaseMcpRepository(): McpRepository {
  const client = createServiceClient();

  return {
    async listDocuments(principal, options) {
      const { data, error } = await client
        .from("documents")
        .select("id,filename,status,doc_type,page_count,created_at,updated_at")
        .eq("workspace_id", principal.workspaceId)
        .order("created_at", { ascending: false })
        .range(options.offset, options.offset + options.limit);

      if (error) throw new McpRepositoryError("list_documents");
      const rows = data ?? [];
      return {
        documents: rows.slice(0, options.limit).map(mapDocumentSummary),
        nextOffset: rows.length > options.limit ? options.offset + options.limit : null,
      };
    },

    async getDocumentSummary(principal, documentId) {
      const { data, error } = await client
        .from("documents")
        .select("id,filename,status,doc_type,page_count,created_at,updated_at")
        .eq("id", documentId)
        .eq("workspace_id", principal.workspaceId)
        .maybeSingle();

      if (error) throw new McpRepositoryError("get_document_summary");
      return data ? mapDocumentSummary(data) : null;
    },

    async getDocumentCitations(principal, options) {
      const { data: document, error: documentError } = await client
        .from("documents")
        .select("id")
        .eq("id", options.documentId)
        .eq("workspace_id", principal.workspaceId)
        .eq("status", "ready")
        .maybeSingle();

      if (documentError) throw new McpRepositoryError("get_citations_document");
      if (!document) {
        return { documentFound: false, citations: [], nextOffset: null };
      }

      const { data, error } = await client
        .from("document_chunks")
        .select("id,page_number,text")
        .eq("document_id", options.documentId)
        .eq("workspace_id", principal.workspaceId)
        .order("chunk_index", { ascending: true })
        .range(options.offset, options.offset + options.limit);

      if (error) throw new McpRepositoryError("get_citations");
      const rows = data ?? [];
      return {
        documentFound: true,
        citations: rows.slice(0, options.limit).map((row) => ({
          chunkId: row.id,
          page: row.page_number,
          snippet: String(row.text).slice(0, 500),
        })),
        nextOffset: rows.length > options.limit ? options.offset + options.limit : null,
      };
    },

    async listTemplates(principal, options) {
      const { data, error } = await client
        .from("templates")
        .select("id,name,description,doc_type,is_builtin,schema")
        .or(`workspace_id.is.null,workspace_id.eq.${principal.workspaceId}`)
        .order("is_builtin", { ascending: false })
        .order("name", { ascending: true })
        .range(options.offset, options.offset + options.limit);

      if (error) throw new McpRepositoryError("list_templates");
      const rows = data ?? [];
      return {
        templates: rows.slice(0, options.limit).map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          docType: row.doc_type,
          builtIn: row.is_builtin,
          schema: row.schema,
        })),
        nextOffset: rows.length > options.limit ? options.offset + options.limit : null,
      };
    },

    async recordToolAudit(principal, event) {
      const { error } = await client.from("audit_logs").insert({
        workspace_id: principal.workspaceId,
        actor_user_id: principal.userId,
        action: "mcp.tool.called",
        target_type: "api_key",
        target_id: principal.credentialId,
        metadata: {
          tool: event.tool,
          outcome: event.outcome,
          duration_ms: event.durationMs,
          credential_id: principal.credentialId,
        },
      });
      if (error) {
        console.warn("[mcp.audit] insert failed", {
          credentialId: principal.credentialId,
          tool: event.tool,
          providerCode: error.code,
        });
      }
    },
  };
}

function mapDocumentSummary(row: {
  id: string;
  filename: string;
  status: string;
  doc_type: string | null;
  page_count: number | null;
  created_at: string;
  updated_at: string;
}): McpDocumentSummary {
  return {
    id: row.id,
    filename: row.filename,
    status: row.status,
    docType: row.doc_type,
    pageCount: row.page_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

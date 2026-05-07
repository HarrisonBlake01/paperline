-- =====================================================================
-- Vector search RPC used by the chat layer.
-- =====================================================================
-- Returns the top-k chunks from the given workspace, optionally limited
-- to a set of document ids, ordered by cosine similarity.
-- =====================================================================

create or replace function match_chunks(
  query_embedding vector(3072),
  workspace      uuid,
  document_ids   uuid[] default null,
  match_count    int default 6
)
returns table (
  id           uuid,
  document_id  uuid,
  page_number  int,
  text         text,
  similarity   float
)
language sql
stable
as $$
  select
    c.id,
    c.document_id,
    c.page_number,
    c.text,
    1 - (c.embedding <=> query_embedding) as similarity
  from document_chunks c
  where c.workspace_id = workspace
    and (document_ids is null or c.document_id = any(document_ids))
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

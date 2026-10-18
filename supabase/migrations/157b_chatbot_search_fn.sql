-- ── Fonction de recherche vectorielle ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION chatbot_search_chunks(
  p_chatbot_id uuid,
  p_embedding  vector(1536),
  p_top_k      int     DEFAULT 4,
  p_threshold  float   DEFAULT 0.3
)
RETURNS TABLE (
  id          uuid,
  content     text,
  document_id uuid,
  similarity  float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    c.id,
    c.content,
    c.document_id,
    1 - (c.embedding <=> p_embedding) AS similarity
  FROM chatbot_chunks c
  WHERE c.chatbot_id = p_chatbot_id
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> p_embedding) >= p_threshold
  ORDER BY c.embedding <=> p_embedding
  LIMIT p_top_k;
$$;

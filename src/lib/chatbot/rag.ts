import OpenAI from "openai";
import { createSupabaseAdmin } from "@/lib/supabase-server";

const EMBED_MODEL  = "text-embedding-3-small";
const CHUNK_SIZE   = 800;   // caractères
const CHUNK_OVERLAP = 100;
const TOP_K         = 4;    // chunks récupérés par requête

// ── Découpage en chunks ────────────────────────────────────────────────────────

export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end).trim());
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter(c => c.length > 20);
}

// ── Embedding d'un texte ───────────────────────────────────────────────────────

export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY manquante");
  const client = new OpenAI({ apiKey });
  const res = await client.embeddings.create({
    model: EMBED_MODEL,
    input: text.slice(0, 8000),
  });
  return res.data[0]!.embedding;
}

// ── Embedding de plusieurs textes (batch) ─────────────────────────────────────

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY manquante");
  const client = new OpenAI({ apiKey });
  const res = await client.embeddings.create({
    model: EMBED_MODEL,
    input: texts.map(t => t.slice(0, 8000)),
  });
  return res.data.map(d => d.embedding);
}

// ── Recherche RAG ──────────────────────────────────────────────────────────────

export async function retrieveContext(
  chatbotId: string,
  query:     string,
  topK:      number = TOP_K,
): Promise<string> {
  const admin = createSupabaseAdmin();

  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedText(query);
  } catch {
    return "";
  }

  const { data } = await admin.rpc("chatbot_search_chunks", {
    p_chatbot_id: chatbotId,
    p_embedding:  JSON.stringify(queryEmbedding),
    p_top_k:      topK,
    p_threshold:  0.3,
  }) as { data: { content: string; similarity: number }[] | null };

  if (!data?.length) return "";

  const context = data
    .map((c, i) => `[Source ${i + 1}]\n${c.content}`)
    .join("\n\n");

  return `\n\n--- Base de connaissances ---\n${context}\n---`;
}

// ── Traitement d'un document : chunking + embedding + stockage ────────────────

export async function processDocument(documentId: string, chatbotId: string): Promise<void> {
  const admin = createSupabaseAdmin();

  // Marquer en cours
  await admin.from("chatbot_documents")
    .update({ status: "processing" })
    .eq("id", documentId);

  const { data: doc } = await admin
    .from("chatbot_documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (!doc) throw new Error("Document introuvable");

  let rawText = "";

  if (doc.type === "text") {
    rawText = doc.content as string ?? "";
  } else if (doc.type === "faq") {
    // FAQ stockée en JSON [{q, a}]
    type FaqItem = { q: string; a: string };
    const items: FaqItem[] = JSON.parse(doc.content as string || "[]") as FaqItem[];
    rawText = items.map(item => `Q: ${item.q}\nR: ${item.a}`).join("\n\n");
  } else if (doc.type === "url") {
    const urlRes = await fetch(doc.url as string, {
      headers: { "User-Agent": "DJAMA-Chatbot-Bot/1.0" },
      signal:  AbortSignal.timeout(10000),
    });
    const html = await urlRes.text();
    // Extraction texte basique (sans cheerio)
    rawText = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 20000);
  }

  if (!rawText.trim()) {
    await admin.from("chatbot_documents")
      .update({ status: "error", error_message: "Aucun contenu extrait" })
      .eq("id", documentId);
    return;
  }

  // Supprimer les anciens chunks
  await admin.from("chatbot_chunks").delete().eq("document_id", documentId);

  const chunks = chunkText(rawText);

  // Batch embeddings
  const embeddings = await embedBatch(chunks);

  // Insérer les chunks
  const rows = chunks.map((content, i) => ({
    chatbot_id:  chatbotId,
    document_id: documentId,
    content,
    embedding:   JSON.stringify(embeddings[i]),
    position:    i,
    token_count: Math.ceil(content.length / 4),
  }));

  await admin.from("chatbot_chunks").insert(rows);

  // Màj document
  await admin.from("chatbot_documents")
    .update({ status: "ready", chunk_count: chunks.length })
    .eq("id", documentId);

  // Màj compteur sur chatbot
  const { count } = await admin
    .from("chatbot_documents")
    .select("*", { count: "exact", head: true })
    .eq("chatbot_id", chatbotId)
    .eq("status", "ready");

  await admin.from("chatbots")
    .update({ document_count: count ?? 0, rag_enabled: (count ?? 0) > 0 })
    .eq("id", chatbotId);
}

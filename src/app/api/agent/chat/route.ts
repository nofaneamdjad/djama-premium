import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync } from "@/lib/rate-limit";
import { AGENT_TOOLS, TOOL_LABELS } from "@/lib/agent/tools";
import { executeTool } from "@/lib/agent/executor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ITERATIONS = 3;

const SYSTEM_PROMPT = `Tu es ARIA, l'assistante IA de DJAMA — la plateforme de gestion d'entreprise.

Tu aides le chef d'entreprise à piloter son activité : factures, devis, clients, finances.

RÈGLES ABSOLUES :
- Réponds TOUJOURS dans la langue de l'utilisateur (fr/en/es/ar)
- Sois CONCISE : 2 à 4 phrases maximum — les réponses sont lues à voix haute
- Utilise les outils pour accéder aux données RÉELLES avant de répondre
- Pour les créations (facture/devis), confirme ce que tu vas préparer avant d'agir
- Donne des chiffres précis quand tu as accès aux données
- Termine toujours par une suggestion utile si pertinent

EXEMPLES DE TON :
- "Votre chiffre d'affaires de ce mois est de 4 200 €, avec 2 factures en attente pour 850 €."
- "J'ai préparé le formulaire de devis pour Marc Dupont à 1 500 € HT."
- "Vous avez 3 clients actifs et 2 prospects en cours."`;

type AgentEvent =
  | { type: "status"; text: string }
  | { type: "tool_start"; tool: string; label: string }
  | { type: "tool_done"; tool: string; summary: string }
  | { type: "navigate"; url: string; label: string }
  | { type: "text"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401 });
  }

  const rl = await checkRateLimitAsync(`agent:${user.id}`, 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: "Limite atteinte (20 req/h). Réessayez plus tard." }), {
      status: 429,
    });
  }

  const { messages } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  if (!messages?.length) {
    return new Response(JSON.stringify({ error: "Messages manquants" }), { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Clé API manquante" }), { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (event: AgentEvent) =>
        ctrl.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));

      try {
        const msgHistory: Anthropic.MessageParam[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        send({ type: "status", text: "ARIA réfléchit…" });

        let iteration = 0;

        while (iteration < MAX_ITERATIONS) {
          const response = await client.messages.create({
            model: "claude-sonnet-5-5",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: msgHistory,
            tools: AGENT_TOOLS,
            tool_choice: { type: "auto" },
          });

          if (response.stop_reason !== "tool_use") {
            const textBlocks = response.content.filter((b) => b.type === "text");
            const fullText = textBlocks.map((b) => (b as Anthropic.TextBlock).text).join("");
            send({ type: "text", content: fullText });
            break;
          }

          msgHistory.push({ role: "assistant", content: response.content });

          const toolResults: Anthropic.ToolResultBlockParam[] = [];

          for (const block of response.content) {
            if (block.type !== "tool_use") continue;

            const label = TOOL_LABELS[block.name] ?? block.name;
            send({ type: "tool_start", tool: block.name, label });

            const result = await executeTool(
              block.name,
              block.input as Record<string, unknown>
            );

            if ("navigate" in result && result.navigate) {
              send({ type: "navigate", url: result.url, label: result.label });
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify({ ok: true, navigate_to: result.url }),
              });
              send({ type: "tool_done", tool: block.name, summary: "Formulaire préparé" });
            } else {
              const r = result as { ok: true; data: unknown } | { ok: false; error: string };
              const summary = r.ok ? `Données reçues` : `Erreur : ${r.error}`;
              send({ type: "tool_done", tool: block.name, summary });
              toolResults.push({
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify(r.ok ? r.data : { error: r.error }),
              });
            }
          }

          msgHistory.push({ role: "user", content: toolResults });
          iteration++;
        }

        send({ type: "done" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur interne";
        send({ type: "error", message: msg });
      } finally {
        ctrl.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

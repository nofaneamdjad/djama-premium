// Abstraction AIProvider — ne pas coupler l'architecture à un seul modèle
import Anthropic from "@anthropic-ai/sdk";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AITool {
  name: string;
  description: string;
  input_schema: object;
}

export interface AICallOptions {
  model?: string;
  maxTokens?: number;
  system: string;
  messages: ChatMessage[];
  tools?: AITool[];
  temperature?: number;
}

export interface AIResponse {
  text: string;
  toolCalls?: Array<{ name: string; input: unknown }>;
  usage: { inputTokens: number; outputTokens: number };
}

export interface AIProvider {
  call(opts: AICallOptions): Promise<AIResponse>;
}

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante");
    this.client = new Anthropic({ apiKey });
  }

  async call(opts: AICallOptions): Promise<AIResponse> {
    const model = opts.model ?? "claude-haiku-4-5-20251001";
    const res = await this.client.messages.create({
      model,
      max_tokens: opts.maxTokens ?? 8192,
      system: opts.system,
      messages: opts.messages.map(m => ({ role: m.role, content: m.content })),
      ...(opts.tools && opts.tools.length > 0 ? {
        tools: opts.tools.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema as Anthropic.Tool["input_schema"],
        })),
        tool_choice: { type: "any" as const },
      } : {}),
      ...(opts.temperature !== undefined ? { } : {}),
    });

    let text = "";
    const toolCalls: Array<{ name: string; input: unknown }> = [];

    for (const block of res.content) {
      if (block.type === "text") text += block.text;
      if (block.type === "tool_use") toolCalls.push({ name: block.name, input: block.input });
    }

    return {
      text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
    };
  }
}

// Singleton — une seule instance pour toutes les routes
let _provider: AIProvider | null = null;
export function getAIProvider(): AIProvider {
  if (!_provider) _provider = new AnthropicProvider();
  return _provider;
}

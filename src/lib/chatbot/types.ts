// ── Types — Module Chatbot IA ──────────────────────────────────────────────────

export type ChatbotStatus    = "draft" | "active" | "disabled";
export type ChatbotPersonality = "professional" | "friendly" | "technical" | "formal" | "empathetic";
export type ConversationStatus = "ai_active" | "waiting_agent" | "agent_connected" | "closed";
export type MessageRole      = "user" | "assistant" | "system";

export interface WidgetConfig {
  position:        "bottom-right" | "bottom-left" | "top-right" | "top-left";
  theme_color:     string;
  text_color:      string;
  background_color: string;
  launcher_type:   "bubble" | "button";
  launcher_icon:   string;
  border_radius:   "sm" | "md" | "lg" | "full";
  show_branding:   boolean;
  window_width:    number;
  window_height:   number;
  suggested_questions: string[];
  header_logo_url: string | null;
  avatar_url:      string | null;
  bot_display_name: string;
  show_typing_indicator: boolean;
  sound_enabled:   boolean;
}

export interface Chatbot {
  id:              string;
  public_id:       string;
  user_id:         string;
  name:            string;
  description:     string | null;
  status:          ChatbotStatus;
  language:        string;
  secondary_languages: string[];
  personality:     ChatbotPersonality;
  instructions:    string;
  welcome_message: string;
  fallback_message: string;
  model:           string;
  max_tokens:      number;
  tools_enabled:   string[];
  channels:        string[];
  allowed_domains: string[];
  require_consent: boolean;
  rate_limit_per_hour: number;
  widget_config:   WidgetConfig;
  conversation_count: number;
  message_count:   number;
  // Jalon D
  webhook_url:            string | null;
  webhook_events:         string[];
  business_hours:         import("./schedule").BusinessHours | null;
  monthly_message_count:  number;
  monthly_reset_at:       string;
  created_at:      string;
  updated_at:      string;
}

export interface ChatbotConversation {
  id:              string;
  chatbot_id:      string;
  visitor_id:      string | null;
  visitor_name:    string | null;
  visitor_email:   string | null;
  status:          ConversationStatus;
  channel:         string;
  metadata:        Record<string, unknown>;
  assigned_to:     string | null;
  notes:           string | null;
  last_message_at: string | null;
  closed_at:       string | null;
  created_at:      string;
  updated_at:      string;
  // joined
  chatbot?:        Pick<Chatbot, "id" | "name">;
  message_count?:  number;
}

export interface ChatbotMessage {
  id:              string;
  conversation_id: string;
  chatbot_id:      string;
  role:            MessageRole;
  content:         string;
  tokens_used:     number;
  model:           string | null;
  sources:         Array<{ title: string; url?: string }>;
  is_escalation_request: boolean;
  created_at:      string;
}

export interface ChatbotStats {
  totalConversations: number;
  activeConversations: number;
  closedConversations: number;
  waitingAgent: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  period: "7d" | "30d" | "90d";
  daily: { date: string; conversations: number; messages: number }[];
}

export interface ChatMessage {
  role:    MessageRole;
  content: string;
}

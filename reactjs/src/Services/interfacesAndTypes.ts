// reactjs/src/Services/interfacesAndTypes.ts

// ── Existing (keep) ───────────────────────────────────────────────────────
export type Message = {
  id: string | number;
  text: string;
  type: "user" | "bot"; // UI-internal — maps to role:"user"|"assistant" at API boundary
  timestamp: string;
  provider?: string; // which provider answered (shown in UI as metadata)
  model?: string; // which model answered
};

export interface FeedbackFormType {
  name: string;
  email: string;
  message: string;
}

// ── New ───────────────────────────────────────────────────────────────────
export type Session = {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatConfig = {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
};

export type TulipChatRequest = {
  messages: { role: string; content: string }[];
  session_id?: string;
  provider?: string;
  model?: string;
  task_type?: string;
  temperature?: number;
  max_tokens?: number;
};

export type TulipChatResponse = {
  content: string;
  session_id: string;
  provider: string;
  model: string;
  use_memory: boolean;
};

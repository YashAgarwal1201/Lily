// reactjs/src/Services/interfacesAndTypes.ts

// ── Existing (keep) ───────────────────────────────────────────────────────
export type Message = {
  id: string | number;
  text: string;
  type: "user" | "bot";
  timestamp: string;
  provider?: string;
  model?: string;
  // RAG additions
  ragUsed?: boolean; // true if this bot message used doc context
  isPendingConfirm?: boolean; // true if this is a rag_confirm pause message
  confirmToken?: string; // stored so user can confirm from the message
  ragChunks?: RagChunk[]; // chunk previews shown in the confirm card
};

export interface FeedbackFormType {
  name: string;
  email: string;
  message: string;
}

// ── Existing new ──────────────────────────────────────────────────────────
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
  ragMode: "off" | "ask" | "auto"; // ← new
};

export type TulipChatRequest = {
  messages: { role: string; content: string }[];
  session_id?: string;
  provider?: string;
  model?: string;
  task_type?: string;
  temperature?: number;
  max_tokens?: number;
  rag_mode?: "off" | "ask" | "auto"; // ← new
  confirm_token?: string; // ← new
};

export type TulipChatResponse = {
  content: string | null;
  session_id: string;
  provider: string;
  model: string;
  use_memory: boolean;
  status: "ok" | "rag_confirm"; // ← new
  rag_used: boolean; // ← new
  rag_chunks: RagChunk[] | null; // ← new
  confirm_token: string | null; // ← new
};

// ── RAG ───────────────────────────────────────────────────────────────────
export type RagChunk = {
  source: string;
  score: number;
  preview: string;
};

export type RagDoc = {
  doc_id: string;
  source: string;
  chunk_count: number;
};

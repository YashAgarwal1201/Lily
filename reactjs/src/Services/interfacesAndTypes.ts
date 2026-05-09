// reactjs/src/Services/interfacesAndTypes.ts

export type MessageVersion = {
  versionIndex: number;
  text: string;
  provider?: string;
  model?: string;
  timestamp: string;
  ragUsed?: boolean;
};

export type Message = {
  id: string | number;
  // db_id is the actual backend row id — used for retry upsert.
  // undefined on locally-created messages (user bubbles, pending confirm cards).
  db_id?: number;
  text: string;
  type: "user" | "bot";
  timestamp: string;
  provider?: string;
  model?: string;
  ragUsed?: boolean;
  intent?: "memory" | "document" | "general";
  isPendingConfirm?: boolean;
  confirmToken?: string;
  ragChunks?: RagChunk[];
  // Version history — immutable append-only array, activeVersionIndex is the pointer
  versions?: MessageVersion[];
  activeVersionIndex?: number;
  totalVersions?: number;
};

export interface FeedbackFormType {
  name: string;
  email: string;
  message: string;
}

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
  ragMode: "off" | "ask" | "auto";
};

export type TulipChatRequest = {
  messages: { role: string; content: string }[];
  session_id?: string;
  provider?: string;
  model?: string;
  task_type?: string;
  temperature?: number;
  max_tokens?: number;
  rag_mode?: "off" | "ask" | "auto";
  confirm_token?: string;
  retry_message_id?: number; // ← tells backend to upsert instead of insert
};

export type TulipChatResponse = {
  content: string | null;
  session_id: string;
  provider: string;
  model: string;
  use_memory: boolean;
  status: "ok" | "rag_confirm";
  rag_used: boolean;
  rag_chunks: RagChunk[] | null;
  confirm_token: string | null;
  intent: "memory" | "document" | "general";
};

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

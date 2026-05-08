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
  text: string;
  type: "user" | "bot";
  timestamp: string;
  provider?: string;
  model?: string;
  // RAG
  ragUsed?: boolean;
  isPendingConfirm?: boolean;
  confirmToken?: string;
  ragChunks?: RagChunk[];
  // ── Retry / version history ──────────────────────────────────────
  versionGroupId?: string; // shared UUID across all versions of this response slot
  versionIndex?: number; // 0-based index of this version (0 = first response)
  activeVersionIndex?: number; // which version is currently displayed (starts at versionIndex)
  allVersions?: MessageVersion[]; // up to 3 past versions stored here
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

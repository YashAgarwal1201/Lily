// reactjs/src/Services/messageStore.ts
import { create } from "zustand";
import { Message, Session, ChatConfig } from "./interfacesAndTypes";
import { AVAILABLE_MODELS } from "./constants";

type MessageStore = {
  // ── Existing ─────────────────────────────────────────
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;

  // ── New — session ─────────────────────────────────────
  sessionId: string | null;
  sessions: Session[];
  setSessionId: (id: string | null) => void;
  setSessions: (sessions: Session[]) => void;

  // ── New — config ──────────────────────────────────────
  config: ChatConfig;
  setConfig: (config: Partial<ChatConfig>) => void;

  // ── New — ui state ────────────────────────────────────
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  gatewayOnline: boolean;
  setGatewayOnline: (v: boolean) => void;

  // ── New — load session messages from gateway ──────────
  loadSessionMessages: (
    rawMessages: {
      role: string;
      content: string;
      provider?: string;
      model?: string;
      created_at: string;
    }[],
  ) => void;
};

const defaultModel = AVAILABLE_MODELS[0];

const useMessageStore = create<MessageStore>((set) => ({
  // ── Existing ─────────────────────────────────────────
  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [], sessionId: null }),

  // ── Session ───────────────────────────────────────────
  sessionId: null,
  sessions: [],
  setSessionId: (id) => set({ sessionId: id }),
  setSessions: (sessions) => set({ sessions }),

  // ── Config ────────────────────────────────────────────
  config: {
    provider: defaultModel.provider,
    model: defaultModel.model,
    temperature: 0.7,
    max_tokens: 2048,
  },
  setConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),

  // ── UI state ──────────────────────────────────────────
  isLoading: false,
  setIsLoading: (v) => set({ isLoading: v }),
  gatewayOnline: false,
  setGatewayOnline: (v) => set({ gatewayOnline: v }),

  // ── Load session messages from raw gateway response ───
  // Maps role:"assistant" → type:"bot", role:"user" → type:"user"
  loadSessionMessages: (rawMessages) => {
    const mapped: Message[] = rawMessages.map((m, i) => ({
      id: i,
      text: m.content,
      type: m.role === "assistant" ? "bot" : "user",
      timestamp: m.created_at,
      provider: m.provider,
      model: m.model,
    }));
    set({ messages: mapped });
  },
}));

export default useMessageStore;

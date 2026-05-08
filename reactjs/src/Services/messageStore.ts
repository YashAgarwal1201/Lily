// reactjs/src/Services/messageStore.ts
import { create } from "zustand";
import { Message, Session, ChatConfig } from "./interfacesAndTypes";
import { AVAILABLE_MODELS } from "./constants";

type MessageStore = {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;

  sessionId: string | null;
  sessions: Session[];
  setSessionId: (id: string | null) => void;
  setSessions: (sessions: Session[]) => void;

  config: ChatConfig;
  setConfig: (config: Partial<ChatConfig>) => void;

  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  gatewayOnline: boolean;
  setGatewayOnline: (v: boolean) => void;

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
  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [], sessionId: null }),

  sessionId: null,
  sessions: [],
  setSessionId: (id) => set({ sessionId: id }),
  setSessions: (sessions) => set({ sessions }),

  config: {
    provider: defaultModel.provider,
    model: defaultModel.model,
    temperature: 0.7,
    max_tokens: 2048,
    ragMode: "ask", // default: ask mode — safest for new users
  },
  setConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),

  isLoading: false,
  setIsLoading: (v) => set({ isLoading: v }),
  gatewayOnline: false,
  setGatewayOnline: (v) => set({ gatewayOnline: v }),

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

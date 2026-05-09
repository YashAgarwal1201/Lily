// reactjs/src/Services/messageStore.ts
import { create } from "zustand";
import {
  Message,
  MessageVersion,
  Session,
  ChatConfig,
} from "./interfacesAndTypes";
import { AVAILABLE_MODELS } from "./constants";

const MAX_VERSIONS = 3;

type MessageStore = {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  /**
   * Replaces the last real bot message in-place.
   * Pushes the old version into versions[], caps at MAX_VERSIONS.
   * Returns the db_id of the replaced message (for retry_message_id on the API call).
   */
  replaceLastBotMessage: (
    updated: Pick<
      Message,
      "text" | "provider" | "model" | "timestamp" | "ragUsed" | "intent"
    >,
  ) => number | undefined;
  navigateVersion: (
    messageId: string | number,
    direction: "prev" | "next",
  ) => void;
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
      id?: number;
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

  replaceLastBotMessage: (updated) => {
    let replacedDbId: number | undefined;

    set((state) => {
      const messages = [...state.messages];

      // Find last real bot message (not a pending confirm card)
      let lastBotIdx = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].type === "bot" && !messages[i].isPendingConfirm) {
          lastBotIdx = i;
          break;
        }
      }

      if (lastBotIdx === -1) {
        // No prior bot message — shouldn't happen via retry, but guard
        return { messages };
      }

      const existing = messages[lastBotIdx];
      replacedDbId = existing.db_id;

      // Seed versions array with existing versions (or create from current state)
      const existingVersions: MessageVersion[] = existing.versions ?? [];
      const seeded: MessageVersion[] =
        existingVersions.length === 0
          ? [
              {
                versionIndex: 0,
                text: existing.text,
                provider: existing.provider,
                model: existing.model,
                timestamp: existing.timestamp,
                ragUsed: existing.ragUsed,
              },
            ]
          : existingVersions;

      const newVersionIndex = seeded.length;
      const newVersion: MessageVersion = {
        versionIndex: newVersionIndex,
        text: updated.text,
        provider: updated.provider,
        model: updated.model,
        timestamp: updated.timestamp,
        ragUsed: updated.ragUsed,
      };

      // Immutable append, cap at MAX_VERSIONS
      const allVersions = [...seeded, newVersion].slice(-MAX_VERSIONS);

      messages[lastBotIdx] = {
        ...existing,
        // Sync root fields to newest version (display source of truth)
        text: updated.text,
        provider: updated.provider,
        model: updated.model,
        timestamp: updated.timestamp,
        ragUsed: updated.ragUsed,
        intent: updated.intent ?? existing.intent,
        // Version state
        versions: allVersions,
        activeVersionIndex: newVersionIndex,
        totalVersions: allVersions.length,
      };

      return { messages };
    });

    return replacedDbId;
  },

  navigateVersion: (messageId, direction) =>
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== messageId || !m.versions || m.versions.length <= 1)
          return m;

        const currentActive = m.activeVersionIndex ?? 0;
        const maxIndex = m.versions.length - 1;
        const newActive =
          direction === "prev"
            ? Math.max(0, currentActive - 1)
            : Math.min(maxIndex, currentActive + 1);

        if (newActive === currentActive) return m;

        const target = m.versions.find((v) => v.versionIndex === newActive);
        if (!target) return m;

        return {
          ...m,
          text: target.text,
          provider: target.provider,
          model: target.model,
          timestamp: target.timestamp,
          ragUsed: target.ragUsed,
          activeVersionIndex: newActive,
        };
      }),
    })),

  sessionId: null,
  sessions: [],
  setSessionId: (id) => set({ sessionId: id }),
  setSessions: (sessions) => set({ sessions }),

  config: {
    provider: defaultModel.provider,
    model: defaultModel.model,
    temperature: 0.7,
    max_tokens: 2048,
    ragMode: "ask",
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
      db_id: m.id, // ← preserve backend row id for retry upsert
      text: m.content,
      type: m.role === "assistant" ? "bot" : "user",
      timestamp: m.created_at,
      provider: m.provider,
      model: m.model,
      // Each loaded message starts as a single-version slot
      versions: [
        {
          versionIndex: 0,
          text: m.content,
          provider: m.provider,
          model: m.model,
          timestamp: m.created_at,
        },
      ],
      activeVersionIndex: 0,
      totalVersions: 1,
    }));
    set({ messages: mapped });
  },
}));

export default useMessageStore;

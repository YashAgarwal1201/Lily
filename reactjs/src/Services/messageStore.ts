// reactjs/src/Services/messageStore.ts
import { create } from "zustand";
import {
  Message,
  MessageVersion,
  Session,
  ChatConfig,
} from "./interfacesAndTypes";
import { AVAILABLE_MODELS } from "./constants";

type MessageStore = {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;

  /**
   * Replaces the last bot message with a new version.
   * Pushes the previous version into `versions[]` first, then appends the new one.
   * The new version becomes the active one.
   */
  replaceLastBotMessage: (
    updated: Pick<
      Message,
      "text" | "provider" | "model" | "timestamp" | "ragUsed"
    >,
  ) => void;

  /**
   * Navigates between stored versions on a message.
   * Only updates activeVersionIndex + syncs the root text/provider/model fields.
   * Never mutates `versions[]`.
   */
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

  replaceLastBotMessage: (updated) =>
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
        // No prior bot message — this is a first response, just add it normally
        // (shouldn't happen via retry path, but guard anyway)
        return { messages };
      }

      const existing = messages[lastBotIdx];
      const existingVersions: MessageVersion[] = existing.versions ?? [];

      // If this is the very first time a version was created for this message,
      // seed versions[] with the original response first
      const seededVersions: MessageVersion[] =
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

      // New version index = length of seeded list (0-based, always grows)
      const newVersionIndex = seededVersions.length;

      const newVersion: MessageVersion = {
        versionIndex: newVersionIndex,
        text: updated.text,
        provider: updated.provider,
        model: updated.model,
        timestamp: updated.timestamp,
        ragUsed: updated.ragUsed,
      };

      const allVersions = [...seededVersions, newVersion];

      messages[lastBotIdx] = {
        ...existing,
        // Sync root fields to the new (latest) version
        text: updated.text,
        provider: updated.provider,
        model: updated.model,
        timestamp: updated.timestamp,
        ragUsed: updated.ragUsed,
        // Version state
        versions: allVersions,
        activeVersionIndex: newVersionIndex,
        totalVersions: allVersions.length,
      };

      return { messages };
    }),

  navigateVersion: (messageId, direction) =>
    set((state) => {
      const messages = state.messages.map((m) => {
        if (m.id !== messageId || !m.versions || m.versions.length <= 1)
          return m;

        const currentActive = m.activeVersionIndex ?? 0;
        const maxIndex = m.versions.length - 1;

        const newActive =
          direction === "prev"
            ? Math.max(0, currentActive - 1)
            : Math.min(maxIndex, currentActive + 1);

        if (newActive === currentActive) return m; // already at boundary

        // Find the version snapshot for the new index
        const target = m.versions.find((v) => v.versionIndex === newActive);
        if (!target) return m;

        // Sync root fields to the navigated version — versions[] is untouched
        return {
          ...m,
          text: target.text,
          provider: target.provider,
          model: target.model,
          timestamp: target.timestamp,
          ragUsed: target.ragUsed,
          activeVersionIndex: newActive,
        };
      });

      return { messages };
    }),

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
      text: m.content,
      type: m.role === "assistant" ? "bot" : "user",
      timestamp: m.created_at,
      provider: m.provider,
      model: m.model,
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

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
  // Replaces the last bot message with a new response, preserving version history
  replaceLastBotMessage: (
    updated: Omit<Message, "versionGroupId" | "versionIndex" | "allVersions">,
  ) => void;
  // Navigate ← → between stored versions on a message
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
      // Find the last bot message index
      const lastBotIdx = [...messages]
        .reverse()
        .findIndex((m) => m.type === "bot" && !m.isPendingConfirm);
      if (lastBotIdx === -1) {
        // No existing bot message — just append (first response)
        return {
          messages: [
            ...messages,
            {
              ...updated,
              versionGroupId: crypto.randomUUID(),
              versionIndex: 0,
              activeVersionIndex: 0,
              allVersions: [],
            },
          ],
        };
      }

      const realIdx = messages.length - 1 - lastBotIdx;
      const existing = messages[realIdx];

      // Build the version snapshot of the current displayed text
      const currentDisplayedVersion: MessageVersion = {
        versionIndex: existing.activeVersionIndex ?? existing.versionIndex ?? 0,
        text:
          existing.allVersions?.find(
            (v) => v.versionIndex === (existing.activeVersionIndex ?? 0),
          )?.text ?? existing.text,
        provider: existing.provider,
        model: existing.model,
        timestamp: existing.timestamp,
        ragUsed: existing.ragUsed,
      };

      // Merge with existing history, cap at MAX_VERSIONS
      const prevVersions: MessageVersion[] = existing.allVersions ?? [];
      const alreadyStored = prevVersions.some(
        (v) => v.versionIndex === currentDisplayedVersion.versionIndex,
      );
      const updatedVersions = alreadyStored
        ? prevVersions
        : [...prevVersions, currentDisplayedVersion].slice(-MAX_VERSIONS);

      const newVersionIndex = (existing.versionIndex ?? 0) + 1;

      messages[realIdx] = {
        ...existing,
        // Update displayed content
        text: updated.text,
        provider: updated.provider,
        model: updated.model,
        timestamp: updated.timestamp,
        ragUsed: updated.ragUsed,
        // Version metadata
        versionGroupId: existing.versionGroupId ?? crypto.randomUUID(),
        versionIndex: newVersionIndex,
        activeVersionIndex: newVersionIndex,
        allVersions: updatedVersions,
      };

      return { messages };
    }),

  navigateVersion: (messageId, direction) =>
    set((state) => {
      const messages = state.messages.map((m) => {
        if (m.id !== messageId) return m;

        const allVersions = m.allVersions ?? [];
        const currentActive = m.activeVersionIndex ?? m.versionIndex ?? 0;
        const latestIndex = m.versionIndex ?? 0;

        // Build full version list including the current latest
        const fullList: MessageVersion[] = [
          ...allVersions,
          {
            versionIndex: latestIndex,
            text: m.text,
            provider: m.provider,
            model: m.model,
            timestamp: m.timestamp,
            ragUsed: m.ragUsed,
          },
        ].sort((a, b) => a.versionIndex - b.versionIndex);

        const currentPos = fullList.findIndex(
          (v) => v.versionIndex === currentActive,
        );
        const newPos =
          direction === "prev"
            ? Math.max(0, currentPos - 1)
            : Math.min(fullList.length - 1, currentPos + 1);

        const target = fullList[newPos];

        return {
          ...m,
          text: target.text,
          provider: target.provider,
          model: target.model,
          timestamp: target.timestamp,
          ragUsed: target.ragUsed,
          activeVersionIndex: target.versionIndex,
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
      versionGroupId: crypto.randomUUID(),
      versionIndex: 0,
      activeVersionIndex: 0,
      allVersions: [],
    }));
    set({ messages: mapped });
  },
}));

export default useMessageStore;

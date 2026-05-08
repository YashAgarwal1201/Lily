// reactjs/src/Components/ChatComponent/ChatComponent.tsx
import { Button } from "primereact/button";
import { useState, useEffect, useRef } from "react";
import useMessageStore from "../../Services/messageStore";
import { sendMessage } from "../../Services/tulipApi";
import useToastStore from "../../Services/toastStore";
import RagConfirmCard from "./RagConfirmCard";
import RetryPopover from "./RetryPopover";
import { ModelOption } from "../../Services/constants";

const ChatComponent = () => {
  const {
    messages,
    addMessage,
    replaceLastBotMessage,
    navigateVersion,
    sessionId,
    setSessionId,
    config,
    isLoading,
    setIsLoading,
  } = useMessageStore();
  const showToast = useToastStore((s) => s.showToast);

  const [newMessage, setNewMessage] = useState("");
  const pendingUserText = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Index of the last bot message — used to control retry visibility
  const lastBotMsgId = [...messages]
    .reverse()
    .find((m) => m.type === "bot" && !m.isPendingConfirm)?.id;

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userText = newMessage;
    addMessage({
      id: Date.now(),
      text: userText,
      type: "user",
      timestamp: new Date().toISOString(),
    });
    setNewMessage("");
    setIsLoading(true);
    await dispatchChat(userText, undefined, undefined);
  };

  // Unified dispatch — used for initial send, confirm/skip, AND retry
  const dispatchChat = async (
    userText: string,
    confirmToken: string | undefined,
    modelOverride: ModelOption | undefined,
  ) => {
    const provider = modelOverride?.provider ?? config.provider;
    const model = modelOverride?.model ?? config.model;

    try {
      const res = await sendMessage({
        messages: [{ role: "user", content: userText }],
        session_id: sessionId ?? undefined,
        provider,
        model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        rag_mode: config.ragMode,
        confirm_token: confirmToken,
      });

      if (!sessionId) setSessionId(res.session_id);

      // ── RAG confirm pause ────────────────────────────────────────────
      if (res.status === "rag_confirm" && res.rag_chunks) {
        pendingUserText.current = userText;
        addMessage({
          id: Date.now() + 1,
          text: "",
          type: "bot",
          timestamp: new Date().toISOString(),
          isPendingConfirm: true,
          confirmToken: res.confirm_token ?? undefined,
          ragChunks: res.rag_chunks,
        });
        setIsLoading(false);
        return;
      }

      // ── Normal response (initial send) ───────────────────────────────
      if (!modelOverride) {
        addMessage({
          id: Date.now() + 1,
          text: res.content ?? "",
          type: "bot",
          timestamp: new Date().toISOString(),
          provider: res.provider,
          model: res.model,
          ragUsed: res.rag_used,
          versionGroupId: crypto.randomUUID(),
          versionIndex: 0,
          activeVersionIndex: 0,
          allVersions: [],
        });
      } else {
        // ── Retry response — replace in place, preserve history ──────────
        replaceLastBotMessage({
          id: Date.now() + 1,
          text: res.content ?? "",
          type: "bot",
          timestamp: new Date().toISOString(),
          provider: res.provider,
          model: res.model,
          ragUsed: res.rag_used,
        });
      }
    } catch (err: any) {
      showToast("error", "Gateway Error", err.message ?? "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Retry: re-sends the last user message with an optional model override
  const handleRetry = async (modelOverride: ModelOption) => {
    if (isLoading) return;
    // Find the last user message text
    const lastUserMsg = [...messages].reverse().find((m) => m.type === "user");
    if (!lastUserMsg) return;

    setIsLoading(true);

    // If the current last bot response used RAG, re-trigger it silently (auto mode for retry)
    const lastBotMsg = [...messages]
      .reverse()
      .find((m) => m.type === "bot" && !m.isPendingConfirm);
    const retryRagMode = lastBotMsg?.ragUsed ? "auto" : "off";

    try {
      const res = await sendMessage({
        messages: [{ role: "user", content: lastUserMsg.text }],
        session_id: sessionId ?? undefined,
        provider: modelOverride.provider,
        model: modelOverride.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        rag_mode: retryRagMode,
      });

      if (!sessionId) setSessionId(res.session_id);

      replaceLastBotMessage({
        id: Date.now() + 1,
        text: res.content ?? "",
        type: "bot",
        timestamp: new Date().toISOString(),
        provider: res.provider,
        model: res.model,
        ragUsed: res.rag_used,
      });
    } catch (err: any) {
      showToast("error", "Retry Failed", err.message ?? "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  // RAG confirm / skip handlers (unchanged logic, just updated to pass modelOverride: undefined)
  const handleRagConfirm = async (
    messageId: string | number,
    confirmToken: string,
  ) => {
    if (!pendingUserText.current || isLoading) return;
    useMessageStore.setState((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
    setIsLoading(true);
    await dispatchChat(pendingUserText.current, confirmToken, undefined);
    pendingUserText.current = null;
  };

  const handleRagSkip = async (messageId: string | number) => {
    if (!pendingUserText.current || isLoading) return;
    useMessageStore.setState((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
    setIsLoading(true);
    try {
      const res = await sendMessage({
        messages: [{ role: "user", content: pendingUserText.current! }],
        session_id: sessionId ?? undefined,
        provider: config.provider,
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        rag_mode: "off",
      });
      if (!sessionId) setSessionId(res.session_id);
      addMessage({
        id: Date.now() + 1,
        text: res.content ?? "",
        type: "bot",
        timestamp: new Date().toISOString(),
        provider: res.provider,
        model: res.model,
        ragUsed: false,
        versionGroupId: crypto.randomUUID(),
        versionIndex: 0,
        activeVersionIndex: 0,
        allVersions: [],
      });
    } catch (err: any) {
      showToast("error", "Gateway Error", err.message ?? "Request failed");
    } finally {
      setIsLoading(false);
      pendingUserText.current = null;
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container bg-color3 h-full flex flex-col">
      <div className="messages-list p-3 overflow-auto flex-1 mb-4">
        {messages?.map((message, key) => {
          // ── RAG confirm card ──────────────────────────────────────────
          if (message.isPendingConfirm && message.ragChunks) {
            return (
              <RagConfirmCard
                key={key}
                chunks={message.ragChunks}
                isLoading={isLoading}
                onConfirm={() =>
                  handleRagConfirm(message.id, message.confirmToken!)
                }
                onSkip={() => handleRagSkip(message.id)}
              />
            );
          }

          // ── Message bubble ────────────────────────────────────────────
          const isLastBot =
            message.type === "bot" && message.id === lastBotMsgId;
          const hasVersions =
            message.type === "bot" && (message.allVersions?.length ?? 0) > 0;
          const activeIdx =
            message.activeVersionIndex ?? message.versionIndex ?? 0;
          const latestIdx = message.versionIndex ?? 0;

          // Build the full sorted version list for navigation count
          const totalVersions = hasVersions
            ? (message.allVersions?.length ?? 0) + 1
            : 1;
          // Position within versions (1-based for display)
          const displayPos = hasVersions
            ? (message.allVersions ?? [])
                .concat({
                  versionIndex: latestIdx,
                  text: "",
                  timestamp: "",
                })
                .sort((a, b) => a.versionIndex - b.versionIndex)
                .findIndex((v) => v.versionIndex === activeIdx) + 1
            : 1;

          return (
            <div
              key={key}
              className={`w-full flex ${
                message.type === "bot"
                  ? "flex-row"
                  : "flex-row-reverse justify-start"
              } gap-x-2`}
            >
              <Button
                icon={"pi pi-user"}
                rounded
                className={`w-10 h-10 ${
                  message.type === "bot"
                    ? "bg-color2 text-color5"
                    : "bg-color1 text-color2"
                } shadow-sm`}
              />
              <div
                className={`max-w-[calc(100%-2.5rem)] flex mb-2 sm:mb-3 ${
                  message.type === "bot"
                    ? "flex-row bg-color2 rounded-r-md rounded-bl-md"
                    : "flex-row-reverse bg-color4 rounded-l-md rounded-br-md"
                } relative`}
              >
                <div
                  className={`h-full w-[16px] bg-color3 ${
                    message.type === "bot" ? "rounded-tr-xl" : "rounded-tl-xl"
                  }`}
                />
                <div
                  className={`absolute ${
                    message.type === "bot" ? "right-0" : "left-0"
                  } w-[calc(100%-16px)] h-full bg-color3`}
                />
                <div
                  className={`message w-[calc(100%-16px)] h-full z-10 p-2 shadow-sm ${
                    message.type === "bot"
                      ? "bg-color2 text-color5 rounded-r-md rounded-bl-md"
                      : "bg-color4 text-color5 rounded-l-md rounded-br-md"
                  }`}
                >
                  <strong
                    className={`${
                      message.type === "bot" ? "text-left" : "text-right"
                    } font-subheading capitalize`}
                  >
                    {message.type === "bot" ? "Tulip" : "You"}
                  </strong>

                  <p className="break-words font-content">{message.text}</p>

                  {/* ── Footer row ──────────────────────────────────── */}
                  <div className="flex items-center justify-between mt-1 gap-2 flex-wrap">
                    {/* Left side: version nav (bot only, when history exists) */}
                    <div className="flex items-center gap-1.5">
                      {message.type === "bot" && hasVersions && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigateVersion(message.id, "prev")}
                            disabled={displayPos === 1}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-color3 disabled:opacity-30 transition-opacity"
                            aria-label="Previous version"
                          >
                            <i className="pi pi-chevron-left text-[10px]" />
                          </button>
                          <span className="text-xs font-subheading opacity-50 tabular-nums">
                            {displayPos}/{totalVersions}
                          </span>
                          <button
                            type="button"
                            onClick={() => navigateVersion(message.id, "next")}
                            disabled={displayPos === totalVersions}
                            className="w-5 h-5 flex items-center justify-center rounded hover:bg-color3 disabled:opacity-30 transition-opacity"
                            aria-label="Next version"
                          >
                            <i className="pi pi-chevron-right text-[10px]" />
                          </button>
                        </div>
                      )}
                      <small className="text-color1 font-subheading">
                        {new Date(message.timestamp)?.toLocaleTimeString()}
                      </small>
                    </div>

                    {/* Right side: RAG badge + model badge + retry */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {message.type === "bot" && message.ragUsed && (
                        <small className="text-color1 font-subheading bg-color3 px-1.5 py-0.5 rounded text-xs">
                          📄 From your docs
                        </small>
                      )}
                      {message.type === "bot" && message.model && (
                        <small className="text-color1 font-subheading opacity-60">
                          {message.model}
                        </small>
                      )}
                      {/* Retry — only on last bot message */}
                      {isLastBot && (
                        <RetryPopover
                          currentModel={message.model ?? config.model}
                          isLoading={isLoading}
                          onRetry={handleRetry}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="w-full flex flex-row gap-x-2">
            <Button
              icon={"pi pi-user"}
              rounded
              className="w-10 h-10 bg-color2 text-color5 shadow-sm"
            />
            <div className="flex items-center bg-color2 rounded-r-md rounded-bl-md px-4 py-2">
              <i className="pi pi-spinner pi-spin text-color1" />
              <small className="ml-2 font-subheading text-color1">
                Thinking...
              </small>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="send-message-form flex gap-x-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={isLoading}
          className="input flex-1 bg-color2 py-2 px-4 font-content border-2 border-color1 rounded-full disabled:opacity-50"
          placeholder={isLoading ? "Tulip is thinking..." : "Type a message..."}
        />
        <Button
          disabled={newMessage?.trim()?.length < 1 || isLoading}
          icon={isLoading ? "pi pi-spinner pi-spin" : "pi pi-send"}
          type="submit"
          rounded
          className="send-button bg-color1 text-color2 font-bold py-2 px-4"
        />
      </form>
    </div>
  );
};

export default ChatComponent;

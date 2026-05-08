// reactjs/src/Components/ChatComponent/ChatComponent.tsx
import { Button } from "primereact/button";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useMessageStore from "../../Services/messageStore";
import { sendMessage } from "../../Services/tulipApi";
import useToastStore from "../../Services/toastStore";
import RagConfirmCard from "./RagConfirmCard";

// FIX #4 — simple model label map for the retry popover
const RETRY_MODELS = [
  { provider: "local", model: "llama3.2", label: "Llama 3.2" },
  { provider: "local", model: "mistral", label: "Mistral" },
  { provider: "local", model: "gemma3", label: "Gemma 3" },
];

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
  const [retryMenuOpen, setRetryMenuOpen] = useState(false);
  const pendingUserText = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const retryMenuRef = useRef<HTMLDivElement>(null);

  // FIX #1 — only the last real bot message shows Retry, and only before any retry
  const lastBotMessageId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === "bot" && !messages[i].isPendingConfirm) {
        return messages[i].id;
      }
    }
    return null;
  })();

  // Close retry menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        retryMenuRef.current &&
        !retryMenuRef.current.contains(e.target as Node)
      ) {
        setRetryMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userText = newMessage;
    addMessage({
      id: Date.now(),
      text: userText,
      type: "user",
      timestamp: new Date().toISOString(),
      versions: [
        {
          versionIndex: 0,
          text: userText,
          timestamp: new Date().toISOString(),
        },
      ],
      activeVersionIndex: 0,
      totalVersions: 1,
    });
    setNewMessage("");
    setIsLoading(true);
    await dispatchChat(userText, undefined, undefined, false);
  };

  /**
   * Unified dispatch for all send paths:
   * - isRetry=false → addMessage (new bubble)
   * - isRetry=true  → replaceLastBotMessage (in-place, keeps history)
   */
  const dispatchChat = async (
    userText: string,
    confirmToken: string | undefined,
    modelOverride: { provider: string; model: string } | undefined,
    isRetry: boolean,
  ) => {
    try {
      const res = await sendMessage({
        messages: [{ role: "user", content: userText }],
        session_id: sessionId ?? undefined,
        provider: modelOverride?.provider ?? config.provider,
        model: modelOverride?.model ?? config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        // FIX #5 — retry always uses auto so RAG fires silently without a confirm card
        rag_mode: isRetry ? "auto" : config.ragMode,
        confirm_token: confirmToken,
      });

      if (!sessionId) setSessionId(res.session_id);

      // ── RAG confirm pause (only on non-retry sends) ───────────────────
      if (!isRetry && res.status === "rag_confirm" && res.rag_chunks) {
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

      const botMsg = {
        text: res.content ?? "",
        provider: res.provider,
        model: res.model,
        timestamp: new Date().toISOString(),
        ragUsed: res.rag_used,
      };

      if (isRetry) {
        // FIX #3 — replace in-place, the loading indicator is the existing stub message
        replaceLastBotMessage(botMsg);
      } else {
        addMessage({
          id: Date.now() + 1,
          type: "bot",
          versions: [{ versionIndex: 0, ...botMsg }],
          activeVersionIndex: 0,
          totalVersions: 1,
          ...botMsg,
        });
      }
    } catch (err: any) {
      showToast("error", "Gateway Error", err.message ?? "Request failed");
    } finally {
      setIsLoading(false);
      setRetryMenuOpen(false);
    }
  };

  const handleRetry = async (provider: string, model: string) => {
    if (isLoading) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.type === "user");
    if (!lastUserMsg) return;
    setIsLoading(true);
    await dispatchChat(lastUserMsg.text, undefined, { provider, model }, true);
  };

  const handleRagConfirm = async (
    messageId: string | number,
    confirmToken: string,
  ) => {
    if (!pendingUserText.current || isLoading) return;
    useMessageStore.setState((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));
    setIsLoading(true);
    await dispatchChat(pendingUserText.current, confirmToken, undefined, false);
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
      const botMsg = {
        text: res.content ?? "",
        provider: res.provider,
        model: res.model,
        timestamp: new Date().toISOString(),
        ragUsed: false,
      };
      addMessage({
        id: Date.now() + 1,
        type: "bot",
        versions: [{ versionIndex: 0, ...botMsg }],
        activeVersionIndex: 0,
        totalVersions: 1,
        ...botMsg,
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

          const isLastBot =
            message.type === "bot" && message.id === lastBotMessageId;
          // FIX #6 — version nav reads from versions[] array, activeVersionIndex is the pointer
          const hasVersions = (message.totalVersions ?? 1) > 1;
          const activeIdx = message.activeVersionIndex ?? 0;
          const totalVers = message.totalVersions ?? 1;

          // FIX #1 — Retry only shows on last bot message AND only when not yet retried
          // (once totalVersions > 1, version arrows replace the retry button)
          const showRetry = isLastBot && !hasVersions && !isLoading;

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

                  {/* FIX #4 — Markdown rendering */}
                  <div
                    className="message-body font-content break-words prose prose-sm max-w-none
                    prose-headings:font-subheading prose-headings:text-color5
                    prose-p:text-color5 prose-li:text-color5
                    prose-strong:text-color5 prose-code:text-color1
                    prose-code:bg-color3 prose-code:px-1 prose-code:rounded
                    prose-pre:bg-color3 prose-pre:border prose-pre:border-color1
                    prose-table:text-color5 prose-th:border prose-th:border-color1
                    prose-th:bg-color3 prose-td:border prose-td:border-color1"
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>

                  {/* Footer: timestamp + badges + version nav + retry */}
                  <div className="flex items-center justify-between mt-1 flex-wrap gap-y-1">
                    <small className="text-color1 font-subheading">
                      {new Date(message.timestamp)?.toLocaleTimeString()}
                    </small>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* RAG badge */}
                      {message.type === "bot" && message.ragUsed && (
                        <small className="text-color1 font-subheading bg-color3 px-1.5 py-0.5 rounded text-xs">
                          📄 From your docs
                        </small>
                      )}

                      {/* Model badge */}
                      {message.type === "bot" && message.model && (
                        <small className="text-color1 font-subheading opacity-60">
                          {message.model}
                        </small>
                      )}

                      {/* FIX #6 — Version navigation arrows (appear once retried) */}
                      {message.type === "bot" && hasVersions && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={activeIdx === 0}
                            onClick={() => navigateVersion(message.id, "prev")}
                            className="p-0.5 rounded disabled:opacity-30 hover:bg-color3 transition-colors"
                            aria-label="Previous version"
                          >
                            <i className="pi pi-chevron-left text-xs text-color1" />
                          </button>
                          <small className="text-color1 font-subheading opacity-60 tabular-nums">
                            {activeIdx + 1}/{totalVers}
                          </small>
                          <button
                            type="button"
                            disabled={activeIdx === totalVers - 1}
                            onClick={() => navigateVersion(message.id, "next")}
                            className="p-0.5 rounded disabled:opacity-30 hover:bg-color3 transition-colors"
                            aria-label="Next version"
                          >
                            <i className="pi pi-chevron-right text-xs text-color1" />
                          </button>
                        </div>
                      )}

                      {/* FIX #1 — Retry button: only last bot message, only before first retry */}
                      {showRetry && (
                        <div className="relative" ref={retryMenuRef}>
                          <button
                            type="button"
                            onClick={() => setRetryMenuOpen((v) => !v)}
                            className="flex items-center gap-1 text-xs text-color1 font-subheading opacity-50 hover:opacity-100 transition-opacity"
                            aria-label="Retry response"
                          >
                            <i className="pi pi-refresh text-xs" />
                            <span>Retry</span>
                          </button>

                          {/* FIX #3 — Inline dropdown, no extra libs needed */}
                          {retryMenuOpen && (
                            <div className="absolute bottom-full right-0 mb-1 bg-color2 border border-color1 rounded-md shadow-lg z-20 min-w-[140px] py-1">
                              <p className="text-xs font-subheading opacity-50 px-3 py-1">
                                Retry with
                              </p>
                              {RETRY_MODELS.map((m) => (
                                <button
                                  key={m.model}
                                  type="button"
                                  onClick={() =>
                                    handleRetry(m.provider, m.model)
                                  }
                                  className={`w-full text-left px-3 py-1.5 text-sm font-content hover:bg-color3 transition-colors flex items-center justify-between
                                    ${config.model === m.model ? "text-color1 font-semibold" : "text-color5"}`}
                                >
                                  <span>{m.label}</span>
                                  {config.model === m.model && (
                                    <i className="pi pi-check text-xs" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
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

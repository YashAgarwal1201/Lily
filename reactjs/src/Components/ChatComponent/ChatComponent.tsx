// reactjs/src/Components/ChatComponent/ChatComponent.tsx
import { Button } from "primereact/button";
import { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import useMessageStore from "../../Services/messageStore";
import { sendMessage, ingestFiles } from "../../Services/tulipApi";
import useToastStore from "../../Services/toastStore";
import RagConfirmCard from "./RagConfirmCard";
import RetryPopover from "./RetryPopover";
import { ModelOption } from "../../Services/constants";

const ACCEPT_TYPES = ".pdf,.txt,.md,.docx,.xlsx,.csv,.pptx";

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
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pendingUserText = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // Only the last real bot message shows Retry / version nav
  const lastBotMessageId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].type === "bot" && !messages[i].isPendingConfirm)
        return messages[i].id;
    }
    return null;
  })();

  // ── File upload ───────────────────────────────────────────────────────────
  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (!files.length || uploading) return;
      setUploading(true);
      try {
        const result = await ingestFiles(files);

        // Inject a system-style confirmation bubble into chat for each file
        result.ingested?.forEach((item: { file: string; chunks: number }) => {
          addMessage({
            id: Date.now() + Math.random(),
            type: "bot",
            text: `📎 **${item.file}** added to knowledge base — ${item.chunks} section${item.chunks !== 1 ? "s" : ""} indexed. You can now ask me questions about it.`,
            timestamp: new Date().toISOString(),
            ragUsed: false,
            intent: "general",
            versions: [
              {
                versionIndex: 0,
                text: "",
                timestamp: new Date().toISOString(),
              },
            ],
            activeVersionIndex: 0,
            totalVersions: 1,
          });
        });

        result.errors?.forEach((e: { file: string; error: string }) =>
          showToast("warn", `Skipped: ${e.file}`, e.error),
        );
      } catch (err: any) {
        showToast("error", "Upload Failed", err.message ?? "Unknown error");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [uploading, showToast, addMessage],
  );

  // ── Drag-drop ─────────────────────────────────────────────────────────────
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFileUpload(files);
  };

  // ── Chat send ─────────────────────────────────────────────────────────────
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
   * Unified dispatch for all send paths.
   * isRetry=false → addMessage (new bubble)
   * isRetry=true  → replaceLastBotMessage (in-place, preserves version history)
   */
  const dispatchChat = async (
    userText: string,
    confirmToken: string | undefined,
    modelOverride: ModelOption | undefined,
    isRetry: boolean,
  ) => {
    // For retry, grab the db_id of the last bot message before calling the API
    let retryMessageDbId: number | undefined;
    if (isRetry) {
      const msgs = useMessageStore.getState().messages;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].type === "bot" && !msgs[i].isPendingConfirm) {
          retryMessageDbId = msgs[i].db_id;
          break;
        }
      }
    }

    try {
      const res = await sendMessage({
        messages: [{ role: "user", content: userText }],
        session_id: sessionId ?? undefined,
        provider: modelOverride?.provider ?? config.provider,
        model: modelOverride?.model ?? config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        rag_mode: isRetry ? "auto" : config.ragMode,
        confirm_token: confirmToken,
        retry_message_id: retryMessageDbId, // ← tells backend to upsert
      });

      if (!sessionId) setSessionId(res.session_id);

      // RAG confirm pause (non-retry only)
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
        intent: res.intent ?? ("general" as const),
      };

      if (isRetry) {
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
      // 410: confirm token expired — silent re-trigger
      if (
        err.message?.includes("410") ||
        err.message?.toLowerCase().includes("expired")
      ) {
        showToast("info", "Session refreshed", "Re-scanning your documents...");
        try {
          const res = await sendMessage({
            messages: [{ role: "user", content: userText }],
            session_id: sessionId ?? undefined,
            provider: modelOverride?.provider ?? config.provider,
            model: modelOverride?.model ?? config.model,
            temperature: config.temperature,
            max_tokens: config.max_tokens,
            rag_mode: config.ragMode,
          });
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
          }
        } catch (retryErr: any) {
          showToast(
            "error",
            "Gateway Error",
            retryErr.message ?? "Request failed",
          );
        } finally {
          setIsLoading(false);
        }
        return;
      }
      showToast("error", "Gateway Error", err.message ?? "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (model: ModelOption) => {
    if (isLoading) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.type === "user");
    if (!lastUserMsg) return;
    setIsLoading(true);
    await dispatchChat(lastUserMsg.text, undefined, model, true);
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
        intent: res.intent ?? ("general" as const),
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
    <div
      className="chat-container bg-color3 h-full flex flex-col relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag-drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-color3 bg-opacity-90 border-2 border-dashed border-color1 rounded-lg pointer-events-none">
          <i className="pi pi-cloud-upload text-color1 text-4xl mb-2" />
          <p className="font-subheading text-color1 text-sm">
            Drop files to add to knowledge base
          </p>
          <small className="font-subheading text-color1 opacity-50 mt-1">
            PDF, DOCX, PPTX, XLSX, TXT, MD, CSV
          </small>
        </div>
      )}

      <div className="messages-list p-3 overflow-auto flex-1 mb-4">
        {messages?.map((message, key) => {
          // RAG confirm card
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
          const hasVersions = (message.totalVersions ?? 1) > 1;
          const activeIdx = message.activeVersionIndex ?? 0;
          const totalVers = message.totalVersions ?? 1;
          // Retry popover only appears on last bot bubble, before first retry
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
                icon="pi pi-user"
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

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-1 flex-wrap gap-y-1">
                    <small className="text-color1 font-subheading">
                      {new Date(message.timestamp)?.toLocaleTimeString()}
                    </small>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Memory intent badge */}
                      {message.type === "bot" &&
                        message.intent === "memory" && (
                          <small className="text-color1 font-subheading bg-color3 px-1.5 py-0.5 rounded text-xs">
                            🧠 From memory
                          </small>
                        )}

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

                      {/* Version navigation — replaces Retry once retried */}
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

                      {/* RetryPopover — only on last bot message, before first retry */}
                      {showRetry && (
                        <RetryPopover
                          currentModel={config.model}
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
              icon="pi pi-user"
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

      {/* Input bar */}
      <form
        onSubmit={handleSendMessage}
        className="send-message-form flex gap-x-2 items-center"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_TYPES}
          onChange={(e) => handleFileUpload(Array.from(e.target.files ?? []))}
          className="hidden"
        />

        {/* Paperclip upload button */}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-color2 border-2 border-color1 text-color1 shrink-0 hover:bg-color1 hover:text-color2 transition-colors disabled:opacity-40"
          aria-label="Upload file to knowledge base"
          title="Upload file (PDF, DOCX, TXT, MD, CSV, XLSX, PPTX)"
        >
          {uploading ? (
            <i className="pi pi-spinner pi-spin text-xs" />
          ) : (
            <i className="pi pi-paperclip text-xs" />
          )}
        </button>

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

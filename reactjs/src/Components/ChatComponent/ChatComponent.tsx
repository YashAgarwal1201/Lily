// reactjs/src/Components/ChatComponent/ChatComponent.tsx
import { Button } from "primereact/button";
import { useState, useEffect, useRef } from "react";
import useMessageStore from "../../Services/messageStore";
import { sendMessage } from "../../Services/tulipApi";
import useToastStore from "../../Services/toastStore";
import RagConfirmCard from "./RagConfirmCard";

const ChatComponent = () => {
  const {
    messages,
    addMessage,
    sessionId,
    setSessionId,
    config,
    isLoading,
    setIsLoading,
  } = useMessageStore();
  const showToast = useToastStore((s) => s.showToast);

  const [newMessage, setNewMessage] = useState("");
  // Holds the original user text during a pending rag_confirm so we
  // can re-send it when the user confirms
  const pendingUserText = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userText = newMessage;

    const userMessage = {
      id: Date.now(),
      text: userText,
      type: "user" as const,
      timestamp: new Date().toISOString(),
    };

    addMessage(userMessage);
    setNewMessage("");
    setIsLoading(true);

    await dispatchChat(userText, undefined);
  };

  // Unified dispatch — used for both initial send and confirm/skip follow-ups
  const dispatchChat = async (
    userText: string,
    confirmToken: string | undefined,
  ) => {
    try {
      const res = await sendMessage({
        messages: [{ role: "user", content: userText }],
        session_id: sessionId ?? undefined,
        provider: config.provider,
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        rag_mode: config.ragMode,
        confirm_token: confirmToken,
      });

      if (!sessionId) setSessionId(res.session_id);

      // ── RAG confirm pause ─────────────────────────────────────────────
      if (res.status === "rag_confirm" && res.rag_chunks) {
        // Store pending user text so confirm handler can re-send it
        pendingUserText.current = userText;

        // Add a special "pending confirm" message — RagConfirmCard renders it
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

      // ── Normal response ───────────────────────────────────────────────
      addMessage({
        id: Date.now() + 1,
        text: res.content ?? "",
        type: "bot",
        timestamp: new Date().toISOString(),
        provider: res.provider,
        model: res.model,
        ragUsed: res.rag_used,
      });
    } catch (err: any) {
      showToast("error", "Gateway Error", err.message ?? "Request failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Called when user clicks "Use my docs" on a RagConfirmCard
  const handleRagConfirm = async (
    messageId: string | number,
    confirmToken: string,
  ) => {
    if (!pendingUserText.current || isLoading) return;

    // Remove the confirm card message from the list
    useMessageStore.setState((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }));

    setIsLoading(true);
    await dispatchChat(pendingUserText.current, confirmToken);
    pendingUserText.current = null;
  };

  // Called when user clicks "Skip" — re-sends without token (rag_mode off for this turn)
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
        rag_mode: "off", // skip: force off for this single turn only
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
          // ── RAG confirm card ────────────────────────────────────────
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

          // ── Normal message bubble ───────────────────────────────────
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
                ></div>
                <div
                  className={`absolute ${
                    message.type === "bot" ? "right-0" : "left-0"
                  } w-[calc(100%-16px)] h-full bg-color3`}
                ></div>
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
                  <div className="flex items-center justify-between mt-1">
                    <small className="text-color1 font-subheading">
                      {new Date(message.timestamp)?.toLocaleTimeString()}
                    </small>
                    <div className="flex items-center gap-2">
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

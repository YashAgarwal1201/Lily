import { Button } from "primereact/button";
import React, { useState, useEffect, useRef } from "react";
import { downloadMessages } from "../../Services/common-functions";

type Message = {
  id: string | Number;
  text: string;
  type: string;
  timestamp: string;
};

const ChatComponent = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to handle sending a message
  const handleSendMessage = (event: any) => {
    event.preventDefault();
    if (!newMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: newMessage,
      type: "user",
      timestamp: new Date().toISOString(),
    };

    setMessages((messages) => [...messages, userMessage]);
    simulateBotResponse(newMessage);
    setNewMessage(""); // Clear the input after sending a message
  };

  // Simulate a bot response
  const simulateBotResponse = (userInput: string) => {
    const botMessage = {
      id: messages.length + 2,
      text: `${userInput}`,
      type: "bot",
      timestamp: new Date().toISOString(),
    };

    setTimeout(() => {
      setMessages((messages) => [...messages, botMessage]);
    }, 1000);
  };

  // Scroll to the bottom of the chat list every time messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container bg-color3 h-full flex flex-col">
      <div className="messages-list p-3 overflow-auto flex-1 mb-4 ">
        {messages?.map((message, key) => (
          <div
            className={`w-full flex ${
              message.type === "bot"
                ? "flex-row"
                : " flex-row-reverse justify-start"
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
                key={key}
                className={`message w-[calc(100%-16px)] h-full z-10  p-2 shadow-sm ${
                  message.type === "bot"
                    ? "bg-color2 text-color5 rounded-r-md rounded-bl-md"
                    : "bg-color4 text-color5 rounded-l-md rounded-br-md"
                }`}
              >
                <strong
                  className={`${
                    message.type === "bot" ? "text-left" : "text-right "
                  } capitalize`}
                >
                  {message.type}
                </strong>
                <p className="break-words">{message.text}</p>
                <small className="text-color1">
                  {new Date(message.timestamp)?.toLocaleTimeString()}
                </small>
              </div>
            </div>
          </div>
        ))}
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
          className="input flex-1 bg-color2 py-2 px-4 border-2 border-color1 rounded-full "
          placeholder="Type a message..."
        />
        <Button
          icon={"pi pi-send"}
          type="submit"
          rounded
          className="send-button bg-color1 text-color2 font-bold py-2 px-4"
        />
        <Button
          icon="pi pi-download"
          onClick={() => downloadMessages(messages)}
          rounded
          className="send-button bg-color1 text-color2 font-bold py-2 px-4"
        />
      </form>
    </div>
  );
};

export default ChatComponent;

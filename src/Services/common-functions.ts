export const downloadMessages = (messages: any) => {
  const messagesString = messages
    .map(
      (message: any) =>
        `[${new Date(message.timestamp).toLocaleTimeString()}] ${
          message.type === "bot" ? "Bot" : "User"
        }: ${message.text}`
    )
    .join("\n");

  const blob = new Blob([messagesString], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "chat-messages.txt";
  a.click();
  URL.revokeObjectURL(a.href);
};

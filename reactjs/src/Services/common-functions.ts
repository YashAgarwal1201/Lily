// reactjs/src/Services/common-functions.ts
export const downloadMessages = (messages: any) => {
  const messagesString = messages
    .map(
      (message: any) =>
        `[${new Date(message.timestamp).toLocaleTimeString()}] ${
          message.type === "bot" ? "Tulip" : "You"
        }: ${message.text}`,
    )
    .join("\n");

  const blob = new Blob([messagesString], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `tulip-chat-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
};

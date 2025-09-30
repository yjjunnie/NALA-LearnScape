import { useState, useEffect } from "react";

function Chatbot() {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>(
    []
  );
  const [sendInput, setSendInput] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/chatbot/messages");
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    if (sendInput) {
      fetchMessages();
      setSendInput(false);
    }
  }, []);

  const handleSend = () => {
    setSendInput(true);
  };

  return (
    <div className="chatbot-container p-4 border rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Chatbot</h2>
      <div className="messages mb-4 h-64 overflow-y-auto border p-2 rounded"></div>
    </div>
  );
}

export default Chatbot;

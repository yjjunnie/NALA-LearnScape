import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IconButton } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyIcon from "@mui/icons-material/SmartToy";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
};

export default function ChatbotDemo() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your NALA learning assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const sampleQuestions = [
    "Explain the key concepts from Week 1",
    "What are the main differences between X and Y?",
    "Can you give me an example of Z?",
    "Help me understand this topic better",
  ];

  const handleQuestionClick = (question: string) => {
    const userMessage: Message = {
      id: messages.length + 1,
      text: question,
      sender: "user",
      timestamp: new Date(),
    };

    const botResponses = [
      "Great question! Let me break this down for you. The key concepts include understanding the fundamental principles and how they apply to real-world scenarios. Would you like me to elaborate on any specific aspect?",
      "The main difference lies in their approach and application. X focuses on theoretical foundations while Y emphasizes practical implementation. Both are important for a comprehensive understanding.",
      "Here's a practical example: Imagine you're working on a project where you need to apply these concepts. You would first analyze the requirements, then implement the solution step by step.",
      "I'd be happy to help clarify! This topic builds on previous concepts we've covered. Let's start with the basics and work our way through the more complex ideas.",
    ];

    const botMessage: Message = {
      id: messages.length + 2,
      text: botResponses[Math.floor(Math.random() * botResponses.length)],
      sender: "bot",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage, botMessage]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-primary-dark rounded-xl shadow-lg mb-6 p-4 md:p-6">
        <div className="flex items-center gap-8">
          <IconButton
            onClick={handleBackClick}
            sx={{
              borderRadius: 2.5,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "white",
              p: { xs: 1, sm: 1.5 },
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderColor: "rgba(255, 255, 255, 0.3)",
                transform: "translateY(-1px)",
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            <ArrowBackRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </IconButton>

          <div className="flex items-center gap-3 flex-1">
            <SmartToyIcon
              sx={{ fontSize: { xs: 28, sm: 32 }, color: "white" }}
            />
            <h1 className="text-2xl md:text-3xl font-bold text-white font-family-display">
              Learning Assistant
            </h1>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto">
        <div
          className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"
          style={{ height: "calc(100vh - 200px)" }}
        >
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-[#004aad] scrollbar-track-gray-200">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.sender === "user"
                      ? "bg-[#004aad] text-white"
                      : "bg-[#cddcf7] text-gray-800"
                  }`}
                >
                  <p className="text-sm md:text-base">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === "user"
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Sample Questions */}
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-600 mb-3">
              Try asking:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionClick(question)}
                  className="text-left bg-white rounded-lg px-3 py-2 text-sm text-[#004aad] hover:bg-[#cddcf7] transition-colors border border-gray-200 hover:border-[#004aad]"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type your question here..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:border-[#004aad] focus:ring-2 focus:ring-[#004aad] focus:ring-opacity-20"
                disabled
              />
              <IconButton
                sx={{
                  backgroundColor: "#004aad",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#003a8c",
                  },
                  "&:disabled": {
                    backgroundColor: "#cddcf7",
                    color: "#666",
                  },
                }}
                disabled
              >
                <SendRoundedIcon />
              </IconButton>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Demo mode - Click the sample questions above to see responses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IconButton } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import { calculateOverallBloomLevel } from "../utils/bloom";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
};

type ScenarioMessage = Omit<Message, "id">;

type ScenarioKey = keyof typeof CHAT_SCENARIOS;

const STUDENT_ID = "1";
const BLOOM_LEVEL_SEQUENCE = [
  "Remember",
  "Understand",
  "Apply",
  "Analyze",
  "Evaluate",
  "Create",
] as const;

const CHAT_SCENARIOS = {
  foundations: {
    label: "Matrix Foundations",
    description:
      "Introductory exchange covering the basics of matrices and transformations.",
    file: "app/services/chat_history/newconvohistoryposted.json",
    introMessage:
      "Replaying the Matrix Foundations chat history to mimic an early tutoring session.",
  },
  progression: {
    label: "Advanced Progression",
    description:
      "Later-stage discussion where the student tackles higher Bloom's levels.",
    file: "app/services/chat_history/newlinearalgprogression.json",
    introMessage:
      "Replaying the Advanced Progression chat history to simulate a later mastery check.",
  },
} as const;

const parseMessageText = (payload: unknown): string => {
  if (typeof payload !== "string") {
    return typeof payload === "number" ? String(payload) : "";
  }

  const trimmed = payload.trim();
  if (!trimmed) {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (!item) {
            return "";
          }
          if (typeof item === "string") {
            return item;
          }
          if (typeof item === "object" && "text" in item) {
            const candidate = (item as { text?: string }).text;
            return typeof candidate === "string" ? candidate : "";
          }
          return "";
        })
        .filter(Boolean)
        .join("\n\n")
        .trim();
    }

    if (parsed && typeof parsed === "object" && "text" in parsed) {
      const candidate = (parsed as { text?: string }).text;
      if (typeof candidate === "string") {
        return candidate.trim();
      }
    }
  } catch (error) {
    // Ignore parsing errors and fall back to the raw string
  }

  return trimmed;
};

const transformHistoryToMessages = (history: unknown[]): ScenarioMessage[] => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const text = parseMessageText(record.msg_text);
      if (!text) {
        return null;
      }

      const senderRaw = String(record.msg_sender ?? "assistant").toLowerCase();
      const sender: "user" | "bot" = senderRaw === "user" ? "user" : "bot";

      const timestampRaw = record.msg_timestamp;
      let timestamp = new Date();
      if (typeof timestampRaw === "string") {
        const parsedTimestamp = new Date(timestampRaw);
        if (!Number.isNaN(parsedTimestamp.getTime())) {
          timestamp = parsedTimestamp;
        }
      }

      return {
        text,
        sender,
        timestamp,
      } satisfies ScenarioMessage;
    })
    .filter((message): message is ScenarioMessage => Boolean(message));
};

const determineTopicLevel = (
  counts?: Record<string, number> | null
): { label: string; value: number | null } => {
  if (!counts) {
    return { label: "Not classified", value: null };
  }

  for (let index = BLOOM_LEVEL_SEQUENCE.length - 1; index >= 0; index -= 1) {
    const level = BLOOM_LEVEL_SEQUENCE[index];
    if ((counts[level] ?? 0) > 0) {
      return { label: level, value: index + 1 };
    }
  }

  return { label: "Not classified", value: null };
};

export default function ChatbotDemo() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 1,
      text: "Hello! I'm your NALA learning assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [activeScenario, setActiveScenario] = useState<ScenarioKey | null>(null);
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const [scenarioStatus, setScenarioStatus] = useState<
    | { type: "success" | "error"; message: string }
    | null
  >(null);
  const [bloomSummary, setBloomSummary] = useState<
    Record<string, Record<string, number>> | null
  >(null);

  const moduleForSummary = moduleId ?? "1";

  const sampleQuestions = useMemo(
    () => [
      "Explain the key concepts from Week 1",
      "What are the main differences between X and Y?",
      "Can you give me an example of Z?",
      "Help me understand this topic better",
    ],
    []
  );

  const botResponses = useMemo(
    () => [
      "Great question! Let me break this down for you. The key concepts include understanding the fundamental principles and how they apply to real-world scenarios. Would you like me to elaborate on any specific aspect?",
      "The main difference lies in their approach and application. X focuses on theoretical foundations while Y emphasizes practical implementation. Both are important for a comprehensive understanding.",
      "Here's a practical example: Imagine you're working on a project where you need to apply these concepts. You would first analyze the requirements, then implement the solution step by step.",
      "I'd be happy to help clarify! This topic builds on previous concepts we've covered. Let's start with the basics and work our way through the more complex ideas.",
    ],
    []
  );

  const fetchBloomSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        student_id: STUDENT_ID,
        module_id: moduleForSummary,
      });
      const response = await fetch(`/api/bloom/summary/?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Unable to fetch Bloom summary.");
      }

      const payload = (await response.json()) as {
        bloom_summary?: Record<string, Record<string, number>>;
      };

      setBloomSummary(payload?.bloom_summary ?? {});
    } catch (error) {
      console.error("Failed to load Bloom summary", error);
      setBloomSummary(null);
    }
  }, [moduleForSummary]);

  useEffect(() => {
    fetchBloomSummary();
  }, [fetchBloomSummary]);

  const overallBloom = useMemo(() => {
    if (!bloomSummary) {
      return null;
    }
    return calculateOverallBloomLevel(bloomSummary);
  }, [bloomSummary]);

  const topicBloomDetails = useMemo(() => {
    if (!bloomSummary) {
      return [] as Array<{
        topicId: string;
        label: string;
        value: number | null;
        counts: Record<string, number> | null;
      }>;
    }

    return Object.entries(bloomSummary).map(([topicId, counts]) => {
      const { label, value } = determineTopicLevel(counts);
      return {
        topicId,
        label,
        value,
        counts,
      };
    });
  }, [bloomSummary]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleQuestionClick = useCallback(
    (question: string) => {
      setScenarioStatus(null);
      setActiveScenario(null);
      setMessages((prev) => {
        const lastId = prev.length > 0 ? prev[prev.length - 1].id : 0;
        const userMessage: Message = {
          id: lastId + 1,
          text: question,
          sender: "user",
          timestamp: new Date(),
        };
        const botMessage: Message = {
          id: lastId + 2,
          text:
            botResponses[Math.floor(Math.random() * botResponses.length)],
          sender: "bot",
          timestamp: new Date(),
        };

        return [...prev, userMessage, botMessage];
      });
    },
    [botResponses]
  );

  const handleScenarioLoad = useCallback(
    async (scenarioKey: ScenarioKey) => {
      const scenario = CHAT_SCENARIOS[scenarioKey];
      if (!scenario) {
        return;
      }

      setIsLoadingScenario(true);
      setScenarioStatus(null);

      try {
        const response = await fetch(
          `/api/display-chat-history/?scenario=${scenarioKey}`
        );
        if (!response.ok) {
          throw new Error("Unable to load stored conversation history.");
        }

        const history = (await response.json()) as unknown[];
        const parsedMessages = transformHistoryToMessages(history);

        let idCounter = 1;
        const arrangedMessages: Message[] = [
          {
            id: idCounter++,
            text: scenario.introMessage,
            sender: "bot",
            timestamp: new Date(),
          },
          ...parsedMessages.map((message) => ({
            id: idCounter++,
            text: message.text,
            sender: message.sender,
            timestamp: message.timestamp,
          })),
        ];

        setMessages(arrangedMessages);
        setActiveScenario(scenarioKey);

        const bloomResponse = await fetch(`/api/bloom/initialize/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: STUDENT_ID,
            module_id: moduleForSummary,
            chat_filepath: scenario.file,
          }),
        });

        if (!bloomResponse.ok) {
          throw new Error("Bloom taxonomy classifier could not be triggered.");
        }

        setScenarioStatus({
          type: "success",
          message: `Bloom taxonomy updated using the ${scenario.label} conversation history.`,
        });

        await fetchBloomSummary();
      } catch (error) {
        console.error("Failed to load conversation scenario", error);
        setScenarioStatus({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load stored conversation history.",
        });
      } finally {
        setIsLoadingScenario(false);
      }
    },
    [fetchBloomSummary, moduleForSummary]
  );

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

      {/* Scenario Controls */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#004aad] mb-1">
              Conversation Scenarios
            </h2>
            <p className="text-sm text-gray-600">
              Load a stored chat session to review past discussions and trigger a
              Bloom's taxonomy recalculation that mimics the passage of time.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(Object.entries(CHAT_SCENARIOS) as Array<[
              ScenarioKey,
              (typeof CHAT_SCENARIOS)[ScenarioKey]
            ]>).map(([key, scenario]) => {
              const isActive = activeScenario === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleScenarioLoad(key)}
                  disabled={isLoadingScenario}
                  className={`rounded-xl border transition-all text-left p-4 h-full flex flex-col gap-2 ${
                    isActive
                      ? "border-[#004aad] bg-[#e8efff] shadow-md"
                      : "border-transparent bg-gray-50 hover:border-[#004aad] hover:shadow"
                  } ${isLoadingScenario ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  <div className="text-sm font-semibold text-[#004aad] uppercase tracking-wide">
                    {scenario.label}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {scenario.description}
                  </p>
                  {isActive && (
                    <span className="text-xs font-medium text-[#004aad]">
                      Scenario loaded
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {scenarioStatus && (
            <div
              className={`rounded-lg px-4 py-3 text-sm font-medium ${
                scenarioStatus.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-rose-100 text-rose-700 border border-rose-200"
              }`}
            >
              {scenarioStatus.message}
            </div>
          )}
          {isLoadingScenario && (
            <div className="text-sm text-gray-600">
              Loading conversation history and recalculating Bloom levels...
            </div>
          )}
        </div>
      </div>

      {/* Bloom Summary */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-[#004aad]">
              Bloom's Taxonomy Snapshot
            </h2>
            <p className="text-sm text-gray-600">
              Monitor how the student's mastery evolves as conversations unfold.
            </p>
          </div>
          {overallBloom ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-600">Overall Bloom Level</p>
                  <p className="text-2xl font-bold text-[#004aad]">
                    {overallBloom.level}
                    {overallBloom.level !== "N/A" && overallBloom.dots.length > 0
                      ? ` (${overallBloom.dots.filter(Boolean).length})`
                      : ""}
                  </p>
                  <p className="text-xs text-gray-500 max-w-xl">
                    {overallBloom.description}
                  </p>
                </div>
                {overallBloom.dots.length > 0 && (
                  <div className="flex items-center gap-1">
                    {overallBloom.dots.map((filled, index) => (
                      <span
                        key={index}
                        className={`w-3 h-3 rounded-full ${
                          filled ? "bg-[#004aad]" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              {topicBloomDetails.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {topicBloomDetails.map((topic) => (
                    <div
                      key={topic.topicId}
                      className="border border-gray-200 rounded-lg p-3 bg-slate-50"
                    >
                      <div className="text-xs uppercase text-gray-500 font-semibold">
                        Topic {topic.topicId}
                      </div>
                      <div className="text-lg font-bold text-[#004aad]">
                        {topic.label}
                        {topic.value ? ` (${topic.value})` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No Bloom data recorded yet for this module.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Bloom data could not be retrieved at the moment.
            </p>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto">
        <div
          className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"
          style={{ height: "calc(100vh - 260px)" }}
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
                  <p className="text-sm md:text-base whitespace-pre-line">
                    {message.text}
                  </p>
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
                  disabled={isLoadingScenario}
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
              Demo mode — Use the stored scenarios or sample prompts above to
              explore the assistant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

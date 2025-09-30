import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IconButton } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { calculateOverallBloomLevel } from "../utils/bloom";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
};

type ScenarioMessage = Omit<Message, "id">;

type ScenarioKey = keyof typeof CHAT_SCENARIOS;

type LearningPreferenceSnapshot = {
  breakdown: Record<string, number>;
  style: string | null;
  styleDisplay: string | null;
};

type StudentLearningPreferenceResponse = {
  learningStyleBreakdown?: Record<string, number>;
  learning_style_breakdown?: Record<string, number>;
  learningStyle?: string | null;
  learning_style?: string | null;
  learning_style_display?: string | null;
};

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
      "Replaying the Matrix Foundations chat history to mimic an early conversation exchange.",
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
  const defaultWelcomeMessage: Message = useMemo(
    () => ({
      id: 1,
      text: "Hello! I'm your NALA learning assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    }),
    []
  );
  const [messages, setMessages] = useState<Message[]>(() => [
    defaultWelcomeMessage,
  ]);
  const [activeScenario, setActiveScenario] = useState<ScenarioKey | null>(
    null
  );
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const [scenarioStatus, setScenarioStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [bloomSummary, setBloomSummary] = useState<Record<
    string,
    Record<string, number>
  > | null>(null);
  const [baselineBloomSummary, setBaselineBloomSummary] = useState<
    Record<string, Record<string, number>> | null
  >(null);
  const [, setLearningPreference] =
    useState<LearningPreferenceSnapshot | null>(null);
  const [baselineLearningPreference, setBaselineLearningPreference] =
    useState<LearningPreferenceSnapshot | null>(null);
  const [hasScenarioChanges, setHasScenarioChanges] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  const moduleForSummary = moduleId ?? "1";

  const deepCloneBloomSummary = useCallback(
    (
      summary: Record<string, Record<string, number>>
    ): Record<string, Record<string, number>> =>
      JSON.parse(JSON.stringify(summary)),
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

      const summary = payload?.bloom_summary ?? {};
      setBloomSummary(summary);
      setBaselineBloomSummary((prev) =>
        prev ? prev : deepCloneBloomSummary(summary)
      );
      return summary;
    } catch (error) {
      console.error("Failed to load Bloom summary", error);
      setBloomSummary(null);
      return null;
    }
  }, [moduleForSummary, deepCloneBloomSummary]);

  const createLearningPreferenceSnapshot = useCallback(
    (
      payload: StudentLearningPreferenceResponse
    ): LearningPreferenceSnapshot => ({
      breakdown: JSON.parse(
        JSON.stringify(
          payload.learningStyleBreakdown ??
            payload.learning_style_breakdown ??
            {}
        )
      ),
      style:
        payload.learning_style ?? payload.learningStyle ?? null,
      styleDisplay: payload.learning_style_display ?? null,
    }),
    []
  );

  const fetchLearningPreference = useCallback(async () => {
    try {
      const response = await fetch(`/api/student/${STUDENT_ID}/`);
      if (!response.ok) {
        throw new Error("Unable to fetch learning preference.");
      }

      const payload = (await response.json()) as StudentLearningPreferenceResponse;
      const snapshot = createLearningPreferenceSnapshot(payload);
      setLearningPreference(snapshot);
      setBaselineLearningPreference((prev) => (prev ? prev : snapshot));
      return snapshot;
    } catch (error) {
      console.error("Failed to load learning preference", error);
      setLearningPreference(null);
      return null;
    }
  }, [createLearningPreferenceSnapshot]);

  useEffect(() => {
    fetchBloomSummary();
    fetchLearningPreference();
  }, [fetchBloomSummary, fetchLearningPreference]);

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

  const handleScenarioLoad = useCallback(
    async (scenarioKey: ScenarioKey) => {
      if (isReverting) {
        return;
      }
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
          const bloomError = await bloomResponse.json().catch(() => null);
          const bloomErrorMsg = bloomError?.error || "Bloom taxonomy classifier could not be triggered.";
          throw new Error(bloomErrorMsg);
        }
        
        const bloomResult = await bloomResponse.json();
        console.log("Bloom taxonomy updated:", bloomResult);

        const learningPreferenceResponse = await fetch(
          `/api/learning-preferences/update/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              student_id: STUDENT_ID,
              chat_filepath: scenario.file,
            }),
          }
        );

        if (!learningPreferenceResponse.ok) {
          const errorPayload = await learningPreferenceResponse.json().catch(() => null);
          const message =
            (errorPayload &&
              typeof errorPayload === "object" &&
              "error" in errorPayload &&
              typeof errorPayload.error === "string"
              ? errorPayload.error
              : null) ||
            "Learning preference update failed.";
          throw new Error(message);
        }

        const learningPreferencePayload =
          (await learningPreferenceResponse.json()) as StudentLearningPreferenceResponse;
        const updatedLearningPreference =
          createLearningPreferenceSnapshot(learningPreferencePayload);
        setLearningPreference(updatedLearningPreference);

        await Promise.all([fetchBloomSummary(), fetchLearningPreference()]);

        setHasScenarioChanges(true);
        setScenarioStatus({
          type: "success",
          message: `Bloom taxonomy and learning preferences updated using the ${scenario.label} conversation history.`,
        });

      } catch (error) {
        console.error("Failed to load conversation scenario", error);
        setScenarioStatus({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load stored conversation history.",
        });
        setActiveScenario(null);
      } finally {
        setIsLoadingScenario(false);
      }
    },
    [
      createLearningPreferenceSnapshot,
      fetchBloomSummary,
      fetchLearningPreference,
      isReverting,
      moduleForSummary,
    ]
  );

  const handleRevertChanges = useCallback(async () => {
    if (
      !baselineBloomSummary ||
      !baselineLearningPreference ||
      isReverting
    ) {
      return;
    }

    setIsReverting(true);
    setScenarioStatus(null);

    try {
      const bloomRestoreResponse = await fetch(`/api/bloom/restore/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: STUDENT_ID,
          module_id: moduleForSummary,
          bloom_summary: baselineBloomSummary,
        }),
      });

      if (!bloomRestoreResponse.ok) {
        throw new Error("Unable to restore Bloom taxonomy summary.");
      }

      const learningRestoreResponse = await fetch(
        `/api/learning-preferences/update/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: STUDENT_ID,
            learning_style_breakdown: baselineLearningPreference.breakdown,
            learning_style: baselineLearningPreference.style,
          }),
        }
      );

      if (!learningRestoreResponse.ok) {
        const errorPayload = await learningRestoreResponse
          .json()
          .catch(() => null);
        const message =
          (errorPayload &&
            typeof errorPayload === "object" &&
            "error" in errorPayload &&
            typeof errorPayload.error === "string"
            ? errorPayload.error
            : null) ||
          "Unable to restore learning preference.";
        throw new Error(message);
      }

      setMessages([
        {
          id: 1,
          text: defaultWelcomeMessage.text,
          sender: defaultWelcomeMessage.sender,
          timestamp: new Date(),
        },
      ]);
      setActiveScenario(null);

      await Promise.all([fetchBloomSummary(), fetchLearningPreference()]);

      setHasScenarioChanges(false);
      setScenarioStatus({
        type: "success",
        message:
          "Bloom taxonomy and learning preferences restored to their original values.",
      });
    } catch (error) {
      console.error("Failed to restore student progress", error);
      setScenarioStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to restore previous student progress.",
      });
    } finally {
      setIsReverting(false);
    }
  }, [
    baselineBloomSummary,
    baselineLearningPreference,
    defaultWelcomeMessage,
    fetchBloomSummary,
    fetchLearningPreference,
    isReverting,
    moduleForSummary,
  ]);

  const isRevertDisabled =
    !baselineBloomSummary ||
    !baselineLearningPreference ||
    !hasScenarioChanges ||
    isLoadingScenario ||
    isReverting;

  const activeScenarioLabel =
    activeScenario ? CHAT_SCENARIOS[activeScenario].label : null;

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
            <h1 className="text-2xl md:text-3xl font-bold text-white flex-1 font-family-display">
              NALA Chatbot
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
              Load a stored chat session to review past discussions and trigger
              refreshed Bloom's taxonomy and learning preference calculations.
              Use the scenario buttons in the chat panel to explore different
              checkpoints and simulate student progression.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-600">
              {isLoadingScenario
                ? "Loading conversation history and recalculating progress..."
                : activeScenarioLabel
                ? `Currently viewing: ${activeScenarioLabel}`
                : "Select a stored scenario from the chat footer to begin."}
            </div>
            <button
              type="button"
              onClick={handleRevertChanges}
              disabled={isRevertDisabled}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                isRevertDisabled
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-[#004aad] text-white hover:bg-[#003a8c]"
              }`}
            >
              {isReverting ? "Reverting..." : "Revert to original progress"}
            </button>
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
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto">
        <div
          className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col"
          style={{ height: "calc(100vh - 120px)" }}
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

          {/* Scenario Buttons */}
          <div className="border-t border-gray-200 bg-gray-50 p-3 md:p-4">
            <p className="text-sm font-semibold text-gray-600 mb-3">
              Stored conversation scenarios
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(
                Object.entries(CHAT_SCENARIOS) as Array<
                  [ScenarioKey, (typeof CHAT_SCENARIOS)[ScenarioKey]]
                >
              ).map(([key, scenario]) => {
                const isActive = activeScenario === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleScenarioLoad(key)}
                    disabled={isLoadingScenario || isReverting}
                    className={`text-left rounded-lg border px-3 py-3 text-sm transition-all ${
                      isActive
                        ? "border-[#004aad] bg-[#e8efff] text-[#004aad] shadow-sm"
                        : "border-transparent bg-white text-[#004aad] hover:border-[#004aad] hover:bg-[#eef3ff]"
                    } ${
                      isLoadingScenario || isReverting
                        ? "opacity-70 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <div className="font-semibold uppercase tracking-wide text-xs mb-1">
                      {scenario.label}
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {scenario.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-2 bg-white">
            <div className="flex gap-1">
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
              Demo mode — Use the scenario buttons above to replay stored
              conversations and analyze progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

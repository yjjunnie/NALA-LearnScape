import { useEffect, useMemo, useState } from "react";
import { Tooltip } from "@mui/material";

interface TopicData {
  module: string;
  topic: string;
  bloom_level_counts: Record<string, number>;
}

interface TopicTaxonomyProgressionProps {
  passedModule?: string;
  studentId: string; // Required: student ID for API calls
}

const TopicTaxonomyProgression: React.FC<TopicTaxonomyProgressionProps> = ({
  passedModule,
  studentId,
}) => {
  const [rawData, setRawData] = useState<TopicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [selectedModuleDisplay, setSelectedModuleDisplay] = useState<string | null>(
    passedModule ?? null
  );
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Colors for Bloom's Taxonomy levels
  const bloomColors = {
    Remember: "#E8F1FF",
    Understand: "#B8D4FF",
    Apply: "#B8D4FF",
    Analyze: "#7EA8FF",
    Evaluate: "#7EA8FF",
    Create: "#4C73FF",
  };

  const bloomOrder = useMemo(
    () => ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"],
    []
  );

  const normalizeModuleValue = (value: string) =>
    value.toString().toLowerCase().replace(/[^a-z0-9]+/g, "");

  const descriptions: Record<string, string> = {
    Remember: "You managed to recall those essential facts and definitions!",
    Understand:
      "You're able to explain them in your own words, and make everything click.",
    Apply: "You have taken what you've learned and used it in scenarios",
    Analyze:
      "You are able to break down complex ideas into simple parts, making them easier to grasp.",
    Evaluate:
      "You have assesssed ideas, formed strong judgments, and supported them with solid reasoning.",
    Create:
      "You managed to take ideas and combine them into something totally new and innovative!",
  };

  // Group data by module
  const moduleData = useMemo(
    () =>
      rawData.reduce<Record<string, TopicData[]>>((acc, item) => {
        if (!acc[item.module]) {
          acc[item.module] = [];
        }
        acc[item.module].push(item);
        return acc;
      }, {}),
    [rawData]
  );

  const modules = useMemo(() => Object.keys(moduleData), [moduleData]);

  // Get filtered data
  const filteredModules = selectedModule
    ? { [selectedModule]: moduleData[selectedModule] }
    : moduleData;

  const selectedModuleLabel =
    selectedModuleDisplay ?? selectedModule ?? "All Modules";

  // Fetch data from backend
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    const normalizeCounts = (
      counts: unknown
    ): Record<string, number> | null => {
      if (!counts || typeof counts !== "object") {
        return null;
      }

      const result: Record<string, number> = {};
      let hasValue = false;
      bloomOrder.forEach((level) => {
        const value = Number((counts as Record<string, unknown>)[level]);
        if (!Number.isNaN(value)) {
          result[level] = value;
          if (value > 0) {
            hasValue = true;
          }
        } else {
          result[level] = 0;
        }
      });

      return hasValue || Object.keys(result).length > 0 ? result : null;
    };

    const normalizeEntry = (entry: unknown): TopicData | null => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const source = entry as Record<string, unknown>;
      const moduleName =
        typeof source.module === "string"
          ? source.module
          : typeof source.module_name === "string"
          ? source.module_name
          : typeof source.module_info === "object" && source.module_info !== null
          ? ((source.module_info as Record<string, unknown>).name as string | undefined)
          : undefined;
      const topicName =
        typeof source.topic === "string"
          ? source.topic
          : typeof source.topic_name === "string"
          ? source.topic_name
          : typeof source.name === "string"
          ? source.name
          : undefined;
      const counts =
        normalizeCounts(source.bloom_level_counts) ??
        normalizeCounts(source.counts) ??
        normalizeCounts(source.bloom_levels);

      if (!moduleName || !topicName || !counts) {
        return null;
      }

      return {
        module: moduleName,
        topic: topicName,
        bloom_level_counts: counts,
      };
    };

    const normalizePayload = (payload: unknown): TopicData[] => {
      if (!payload) {
        return [];
      }

      if (Array.isArray(payload)) {
        return payload
          .map(normalizeEntry)
          .filter((item): item is TopicData => Boolean(item));
      }

      if (typeof payload === "object") {
        const source = payload as Record<string, unknown>;
        if (Array.isArray(source.summary)) {
          return normalizePayload(source.summary);
        }
        if (Array.isArray(source.data)) {
          return normalizePayload(source.data);
        }
      }

      return [];
    };

    const fetchData = async () => {
      if (!studentId) {
        setError("Student ID is required");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Build URL with query parameters
        const params = new URLSearchParams({
          student_id: studentId,
        });

        // Add module_id if passedModule is provided
        if (passedModule) {
          params.append('module_id', passedModule);
        }

        const url = `/api/bloom/progression/?${params.toString()}`;
        
        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch topic progression: ${response.status}`);
        }

        const result = await response.json();

        if (ignore) return;

        // Backend returns { data: [...] }
        const fetchedData = result.data || [];
        
        if (fetchedData.length === 0) {
          setError("No progression data available");
        }
        
        setRawData(fetchedData);
      } catch (err) {
        if (ignore) return;
        
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        
        console.error("Failed to fetch bloom progression:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [studentId, passedModule]);

  // Handle passedModule auto-select
  useEffect(() => {
    if (!passedModule) {
      setSelectedModule(null);
      setExpandedModule(null);
      setSelectedModuleDisplay(null);
      return;
    }

    const normalized = normalizeModuleValue(passedModule);
    if (!normalized) {
      setSelectedModuleDisplay(passedModule);
      return;
    }

    const matchedModule = modules.find((module) => {
      const normalizedModule = normalizeModuleValue(module);
      return (
        normalizedModule === normalized ||
        normalizedModule.includes(normalized) ||
        normalized.includes(normalizedModule)
      );
    });

    if (matchedModule) {
      setSelectedModule(matchedModule);
      setExpandedModule(matchedModule);
      setSelectedModuleDisplay(matchedModule);
    }
  }, [modules, passedModule]);

  // Handlers
  const handleModuleClick = (moduleName: string) => {
    setExpandedModule(expandedModule === moduleName ? null : moduleName);
    setExpandedTopic(null);
  };

  const handleTopicClick = (topicName: string) => {
    setExpandedTopic(expandedTopic === topicName ? null : topicName);
  };

  const handleFilterSelect = (module: string | null) => {
    setSelectedModule(module);
    setSelectedModuleDisplay(module);
    setShowFilterMenu(false);
    setExpandedModule(module);
    setExpandedTopic(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="rounded-3xl px-5 py-4 w-full h-full flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f3f6ff 100%)",
          border: "2px solid rgba(76,115,255,0.14)",
        }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#4C73FF] border-t-transparent mb-2"></div>
          <p className="text-sm text-gray-500">Loading progression data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-3xl px-5 py-4 w-full h-full"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f3f6ff 100%)",
          border: "2px solid rgba(76,115,255,0.14)",
        }}
      >
        <div className="p-4 text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // No data state
  if (rawData.length === 0) {
    return (
      <div className="rounded-3xl px-5 py-4 w-full h-full"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f3f6ff 100%)",
          border: "2px solid rgba(76,115,255,0.14)",
        }}
      >
        <div className="p-4 text-center text-sm text-gray-500">
          No topic progression data available
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl px-5 py-4 w-full h-full"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f3f6ff 100%)",
        border: "2px solid rgba(76,115,255,0.14)",
      }}
    >
      {/* HEADER + FILTER */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-[#4C73FF] mb-1">
            Learning Progression
          </h2>
          <h1 className="font-bold font-['Fredoka'] text-3xl text-[#4C73FF]">
            Bloom's Taxonomy
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {selectedModuleLabel === "All Modules"
              ? "Showing all available modules"
              : `Showing module: ${selectedModuleLabel}`}
          </p>
        </div>

        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:bg-[rgba(76,115,255,0.15)]"
            style={{
              backgroundColor: "rgba(76,115,255,0.1)",
              color: "#2D4BB4",
            }}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            {selectedModuleLabel}
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${
                showFilterMenu ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Filter Dropdown */}
          {showFilterMenu && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden shadow-lg z-10"
              style={{
                backgroundColor: "white",
                border: "1px solid rgba(76,115,255,0.2)",
              }}
            >
              <button
                onClick={() => handleFilterSelect(null)}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-[rgba(76,115,255,0.05)]"
                style={{
                  backgroundColor: !selectedModule
                    ? "rgba(76,115,255,0.1)"
                    : "transparent",
                  color: !selectedModule ? "#2D4BB4" : "#4B5563",
                }}
              >
                All Modules
              </button>
              {modules.map((module) => (
                <button
                  key={module}
                  onClick={() => handleFilterSelect(module)}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-[rgba(76,115,255,0.05)]"
                  style={{
                    backgroundColor:
                      selectedModule === module
                        ? "rgba(76,115,255,0.1)"
                        : "transparent",
                    color: selectedModule === module ? "#2D4BB4" : "#4B5563",
                  }}
                >
                  {module}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODULES + TOPICS */}
      <div className="space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100% - 90px)" }}>
        {Object.entries(filteredModules).map(([moduleName, topics]) => {
          const totalModuleQuestions = topics.reduce((sum, topic) => {
            return (
              sum +
              Object.values(topic.bloom_level_counts).reduce((s, c) => s + c, 0)
            );
          }, 0);
          const isModuleExpanded = expandedModule === moduleName;

          return (
            <div key={moduleName} className="space-y-2">
              <button
                onClick={() => handleModuleClick(moduleName)}
                className="w-full text-left rounded-xl px-4 py-3 transition-all duration-200"
                style={{
                  backgroundColor: isModuleExpanded
                    ? "rgba(76,115,255,0.15)"
                    : "rgba(232,241,255,0.5)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg text-[#2D4BB4]">
                      {moduleName}
                    </h2>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {topics.length} topics • {totalModuleQuestions} questions
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-[#4C73FF] transition-transform duration-200 ${
                      isModuleExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {isModuleExpanded && (
                <div className="ml-4 space-y-2">
                  {topics.map((topicData, topicIndex) => {
                    const totalQuestions = Object.values(
                      topicData.bloom_level_counts
                    ).reduce((sum, count) => sum + count, 0);
                    const isTopicExpanded = expandedTopic === topicData.topic;

                    return (
                      <div key={topicIndex} className="space-y-2">
                        <button
                          onClick={() => handleTopicClick(topicData.topic)}
                          className="w-full text-left rounded-xl px-3 py-2 transition-all duration-200 hover:bg-[rgba(76,115,255,0.08)]"
                          style={{
                            backgroundColor: isTopicExpanded
                              ? "rgba(76,115,255,0.12)"
                              : "rgba(232,241,255,0.3)",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-[#2D4BB4]">
                              {topicData.topic}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">
                                {totalQuestions} questions
                              </span>
                              <svg
                                className={`w-4 h-4 text-[#4C73FF] transition-transform duration-200 ${
                                  isTopicExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>
                        </button>

                        {isTopicExpanded && (
                          <div className="space-y-1.5 px-3 pb-2">
                            {bloomOrder.map((level) => {
                              const count =
                                topicData.bloom_level_counts[level] || 0;
                              const percentage =
                                totalQuestions > 0
                                  ? (count / totalQuestions) * 100
                                  : 0;

                              if (count === 0) return null;

                              return (
                                <div key={level} className="space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-xs text-gray-700">
                                      <span>{level}</span>
                                      <Tooltip
                                        title={descriptions[level] || level}
                                        arrow
                                        placement="right"
                                        componentsProps={{
                                          tooltip: {
                                            sx: {
                                              backgroundColor: "rgba(40,72,209,0.95)",
                                              fontSize: "12px",
                                              maxWidth: "250px",
                                              "& .MuiTooltip-arrow": {
                                                color: "rgba(40,72,209,0.95)",
                                              },
                                              padding: "8px 12px",
                                              textAlign: "center",
                                              borderRadius: "8px",
                                            },
                                          },
                                        }}
                                      >
                                        <span className="w-4 h-4 bg-[#e1e9ff] text-[#1b46d1] rounded-full flex items-center justify-center text-xs font-bold cursor-help">
                                          ?
                                        </span>
                                      </Tooltip>
                                    </div>
                                    <span className="text-xs text-gray-600">{count}</span>
                                  </div>

                                  <div className="relative w-full h-5 bg-[rgba(232,241,255,0.4)] rounded-lg overflow-hidden">
                                    <div
                                      className="absolute top-0 left-0 h-full transition-all duration-500 ease-out rounded-lg"
                                      style={{
                                        width: `${percentage}%`,
                                        backgroundColor: bloomColors[level],
                                      }}
                                    />
                                    <div className="absolute inset-0 flex items-center px-2">
                                      <span className="text-xs font-medium text-gray-700 z-10">
                                        {percentage > 0 ? `${Math.round(percentage)}%` : ""}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopicTaxonomyProgression;
import { useEffect, useState } from "react";
import { Tooltip } from '@mui/material';

// Dummy data with proper module structure
const dummyData = {
  summary: [
    {
      module: "Linear Algebra",
      topic: "Introducing the Matrix",
      bloom_level_counts: {
        Remember: 2,
        Understand: 3,
        Apply: 2,
        Analyze: 0,
        Evaluate: 0,
        Create: 1,
      },
    },
    {
      module: "Linear Algebra",
      topic: "Linear Transforms and the Matrix",
      bloom_level_counts: {
        Remember: 0,
        Understand: 1,
        Apply: 5,
        Analyze: 3,
        Evaluate: 1,
        Create: 0,
      },
    },
    {
      module: "Linear Algebra",
      topic: "Manipulating the Matrix",
      bloom_level_counts: {
        Remember: 3,
        Understand: 1,
        Apply: 2,
        Analyze: 5,
        Evaluate: 1,
        Create: 1,
      },
    },
    {
      module: "Linear Algebra",
      topic: "Inverting the Matrix",
      bloom_level_counts: {
        Remember: 3,
        Understand: 2,
        Apply: 3,
        Analyze: 2,
        Evaluate: 0,
        Create: 2,
      },
    },
    {
      module: "Calculus",
      topic: "Limits and Continuity",
      bloom_level_counts: {
        Remember: 4,
        Understand: 2,
        Apply: 1,
        Analyze: 0,
        Evaluate: 0,
        Create: 0,
      },
    },
    {
      module: "Calculus",
      topic: "Derivatives",
      bloom_level_counts: {
        Remember: 1,
        Understand: 3,
        Apply: 4,
        Analyze: 2,
        Evaluate: 1,
        Create: 0,
      },
    },
    {
      module: "Calculus",
      topic: "Integration Techniques",
      bloom_level_counts: {
        Remember: 2,
        Understand: 2,
        Apply: 5,
        Analyze: 3,
        Evaluate: 2,
        Create: 1,
      },
    },
    {
      module: "Probability & Statistics",
      topic: "Probability Fundamentals",
      bloom_level_counts: {
        Remember: 3,
        Understand: 4,
        Apply: 2,
        Analyze: 1,
        Evaluate: 0,
        Create: 0,
      },
    },
    {
      module: "Probability & Statistics",
      topic: "Distributions",
      bloom_level_counts: {
        Remember: 2,
        Understand: 3,
        Apply: 3,
        Analyze: 2,
        Evaluate: 1,
        Create: 0,
      },
    },
    {
      module: "Probability & Statistics",
      topic: "Hypothesis Testing",
      bloom_level_counts: {
        Remember: 1,
        Understand: 2,
        Apply: 4,
        Analyze: 4,
        Evaluate: 3,
        Create: 1,
      },
    },
  ],
};

const TopicTaxonomyProgression = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setRawData(dummyData.summary || []);
      } catch (error) {
        console.error("Failed to fetch topic progression", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Colors for Bloom's Taxonomy levels
  const bloomColors = {
    Remember: "#E8F1FF",
    Understand: "#B8D4FF",
    Apply: "#B8D4FF",
    Analyze: "#7EA8FF",
    Evaluate: "#7EA8FF",
    Create: "#4C73FF",
  };

  const bloomOrder = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

  const descriptions = {
    Remember: "You managed to recall those essential facts and definitions!",
    Understand: "You're able to explain them in your own words, and make everything click.",
    Apply: "You have taken what you've learned and used it in scenarios",
    Analyze: "You are able to break down complex ideas into simple parts, making them easier to grasp.",
    Evaluate: "You have assesssed ideas, formed strong judgments, and supported them with solid reasoning.",
    Create: "You managed to take ideas and combine them into something totally new and innovative!",
  };

  // Group data by module
  const moduleData = rawData.reduce((acc, item) => {
    if (!acc[item.module]) {
      acc[item.module] = [];
    }
    acc[item.module].push(item);
    return acc;
  }, {});

  const modules = Object.keys(moduleData);

  // Get filtered data
  const filteredModules = selectedModule ? { [selectedModule]: moduleData[selectedModule] } : moduleData;

  // Show loading state
  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  // Show no data state
  if (rawData.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        No topic progression data available
      </div>
    );
  }

  const handleModuleClick = (moduleName) => {
    setExpandedModule(expandedModule === moduleName ? null : moduleName);
    if (expandedModule !== moduleName) {
      setExpandedTopic(null);
    }
  };

  const handleTopicClick = (topicName) => {
    setExpandedTopic(expandedTopic === topicName ? null : topicName);
  };

  const handleFilterSelect = (module) => {
    setSelectedModule(module);
    setShowFilterMenu(false);
    setExpandedModule(null);
    setExpandedTopic(null);
  };

  return (
    <div
      className="rounded-3xl px-5 py-4 w-full h-full"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f3f6ff 100%)",
        border: "2px solid rgba(76,115,255,0.14)",
      }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-[#4C73FF] mb-1">
            Learning Progression
          </h2>
          <h1 className="font-bold font-['Fredoka'] text-3xl text-[#4C73FF]">
            Bloom's Taxonomy
          </h1>
        </div>

        {/* Filter Button */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-['GlacialIndifference',sans-serif] font-semibold transition-all duration-200 hover:bg-[rgba(76,115,255,0.15)]"
            style={{
              backgroundColor: 'rgba(76,115,255,0.1)',
              color: '#2D4BB4',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {selectedModule || "All Modules"}
            <svg className={`w-3 h-3 transition-transform duration-200 ${showFilterMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Filter Dropdown */}
          {showFilterMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden shadow-lg z-10"
              style={{
                backgroundColor: 'white',
                border: '1px solid rgba(76,115,255,0.2)',
              }}
            >
              <button
                onClick={() => handleFilterSelect(null)}
                className="w-full text-left px-4 py-2.5 text-sm font-['GlacialIndifference',sans-serif] transition-colors duration-150"
                style={{
                  backgroundColor: !selectedModule ? 'rgba(76,115,255,0.1)' : 'transparent',
                  color: !selectedModule ? '#2D4BB4' : '#4B5563',
                }}
                onMouseEnter={(e) => {
                  if (selectedModule) e.currentTarget.style.backgroundColor = 'rgba(76,115,255,0.05)';
                }}
                onMouseLeave={(e) => {
                  if (selectedModule) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                All Modules
              </button>
              {modules.map((module) => (
                <button
                  key={module}
                  onClick={() => handleFilterSelect(module)}
                  className="w-full text-left px-4 py-2.5 text-sm font-['GlacialIndifference',sans-serif] transition-colors duration-150"
                  style={{
                    backgroundColor: selectedModule === module ? 'rgba(76,115,255,0.1)' : 'transparent',
                    color: selectedModule === module ? '#2D4BB4' : '#4B5563',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedModule !== module) e.currentTarget.style.backgroundColor = 'rgba(76,115,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedModule !== module) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {module}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100% - 90px)' }}>
        {Object.entries(filteredModules).map(([moduleName, topics]) => {
          const totalModuleQuestions = topics.reduce((sum, topic) => {
            return sum + Object.values(topic.bloom_level_counts).reduce((s, c) => s + c, 0);
          }, 0);
          const isModuleExpanded = expandedModule === moduleName;

          return (
            <div key={moduleName} className="space-y-2">
              <button
                onClick={() => handleModuleClick(moduleName)}
                className="w-full text-left rounded-xl px-4 py-3 transition-all duration-200"
                style={{
                  backgroundColor: isModuleExpanded ? 'rgba(76,115,255,0.15)' : 'rgba(232,241,255,0.5)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg text-[#2D4BB4]">
                      {moduleName}
                    </h2>
                    <p className="font-['GlacialIndifference',sans-serif] text-xs text-gray-600 mt-0.5">
                      {topics.length} topics • {totalModuleQuestions} questions
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-[#4C73FF] transition-transform duration-200 ${isModuleExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isModuleExpanded && (
                <div className="ml-4 space-y-2">
                  {topics.map((topicData, topicIndex) => {
                    const totalQuestions = Object.values(topicData.bloom_level_counts).reduce((sum, count) => sum + count, 0);
                    const isTopicExpanded = expandedTopic === topicData.topic;

                    return (
                      <div key={topicIndex} className="space-y-2">
                        <button
                          onClick={() => handleTopicClick(topicData.topic)}
                          className="w-full text-left rounded-xl px-3 py-2 transition-all duration-200 hover:bg-[rgba(76,115,255,0.08)] focus:outline-none focus:ring-2 focus:ring-[#4C73FF] focus:ring-opacity-30"
                          style={{
                            backgroundColor: isTopicExpanded ? 'rgba(76,115,255,0.12)' : 'rgba(232,241,255,0.3)',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-['GlacialIndifference',sans-serif] font-bold text-sm text-[#2D4BB4]">
                              {topicData.topic}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="font-['GlacialIndifference',sans-serif] text-xs text-gray-600">
                                {totalQuestions} questions
                              </span>
                              <svg
                                className={`w-4 h-4 text-[#4C73FF] transition-transform duration-200 ${isTopicExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </button>

                        {isTopicExpanded && (
                          <div className="space-y-1.5 px-3 pb-2">
                            {bloomOrder.map((level) => {
                              const count = topicData.bloom_level_counts[level] || 0;
                              const percentage = totalQuestions > 0 ? (count / totalQuestions) * 100 : 0;

                              if (count === 0) return null;

                              return (
                                <div key={level} className="space-y-0.5">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1 font-['GlacialIndifference',sans-serif] font-medium text-xs text-gray-700">
                                      <span>{level}</span>
                                      <Tooltip
                                        title={descriptions[level] || level}
                                        arrow
                                        placement="right"
                                        componentsProps={{
                                          tooltip: {
                                            sx: {
                                              backgroundColor: 'rgba(40,72,209,0.95)',
                                              fontSize: '12px',
                                              fontFamily: '"GlacialIndifference", sans-serif',
                                              maxWidth: '250px',
                                              '& .MuiTooltip-arrow': {
                                                color: 'rgba(40,72,209,0.95)',
                                              },
                                              padding: '8px 12px',
                                              textAlign: 'center',
                                              borderRadius: '8px',
                                              marginRight: '8px',
                                            },
                                          },
                                        }}
                                      >
                                        <div className="flex-shrink-0 w-4 h-4 bg-[#e1e9ff] text-[#1b46d1] rounded-full flex items-center justify-center text-xs font-['Fredoka',sans-serif] font-bold cursor-help">
                                          ?
                                        </div>
                                      </Tooltip>
                                    </div>
                                    <span className="font-['GlacialIndifference',sans-serif] text-xs text-gray-600">
                                      {count}
                                    </span>
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
                                      <span className="font-['GlacialIndifference',sans-serif] text-xs font-medium text-gray-700 z-10">
                                        {percentage > 0 ? `${Math.round(percentage)}%` : ''}
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
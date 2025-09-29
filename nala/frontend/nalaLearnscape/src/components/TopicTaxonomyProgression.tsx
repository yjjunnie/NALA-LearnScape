import { useEffect, useState } from "react";

// Dummy data 
const dummyData = {
  summary: [
    {
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
  ],
};

const TopicTaxonomyProgression = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        //Will replace with real API call later
        console.log("Full API Response:", dummyData);
        console.log("summary:", dummyData.summary);
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
    "Remember": "#E8F1FF",
    "Understand": "#B8D4FF",
    "Apply": "#7EA8FF",
    "Analyze": "#4C73FF",
    "Evaluate": "#2D4BB4",
    "Create": "#13338C"
  };

  const bloomOrder = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

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

  const handleTopicClick = (topicData) => {
    setSelectedTopic(selectedTopic?.topic === topicData.topic ? null : topicData);
  };

  return (
    <div
      className="rounded-3xl px-5 py-4 w-full h-full"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f3f6ff 100%)",
        border: "2px solid rgba(76,115,255,0.14)",
      }}
    >
      <div className="mb-4">
        <h2 className="text-sm font-bold tracking-wider uppercase text-[#4C73FF] mb-1">
          Learning Progression
        </h2>
        <h1 className="font-bold font-['Fredoka'] text-3xl text-[#4C73FF]">
          Bloom's Taxonomy
        </h1>
      </div>
      
      <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100% - 80px)' }}>
        {rawData.map((topicData, topicIndex) => {
          const totalQuestions = Object.values(topicData.bloom_level_counts).reduce((sum, count) => sum + count, 0);
          const isSelected = selectedTopic?.topic === topicData.topic;
          
          return (
            <div key={topicIndex} className="space-y-2">
              <button
                onClick={() => handleTopicClick(topicData)}
                className="w-full text-left rounded-xl px-3 py-2 transition-all duration-200 hover:bg-[rgba(76,115,255,0.08)] focus:outline-none focus:ring-2 focus:ring-[#4C73FF] focus:ring-opacity-30"
                style={{
                  backgroundColor: isSelected ? 'rgba(76,115,255,0.12)' : 'rgba(232,241,255,0.4)',
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-['GlacialIndifference',sans-serif] font-bold text-xs text-[#2D4BB4]">
                    {topicData.topic}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="font-['GlacialIndifference',sans-serif] text-m text-gray-600">
                      {totalQuestions} questions
                    </span>
                    <svg 
                      className={`w-4 h-4 text-[#4C73FF] transition-transform duration-200 ${isSelected ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>
              
              {isSelected && (
                <div className="space-y-1.5 px-3 pb-2">
                  {bloomOrder.map((level) => {
                    const count = topicData.bloom_level_counts[level] || 0;
                    const percentage = totalQuestions > 0 ? (count / totalQuestions) * 100 : 0;
                    
                    if (count === 0) return null;
                    
                    return (
                      <div key={level} className="space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-['GlacialIndifference',sans-serif] font-medium text-xs text-gray-700">
                            {level}
                          </span>
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
              
              {topicIndex < rawData.length - 1 && !isSelected && (
                <div className="border-t border-[rgba(76,115,255,0.1)]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopicTaxonomyProgression;
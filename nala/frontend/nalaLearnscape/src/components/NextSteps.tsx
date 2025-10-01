import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const NextSteps = ({ studentId = "1" }) => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    performanceStatus: 'good',
    currentStudyMethod: 'Elaboration',
    averageGrade: 82,
    quickestImprovement: {
      topic: 'Data Structures',
      from: 65,
      to: 88,
      dominantLearningStyle: 'Elaboration',
      studyHours: 12.5,
      questionsAttempted: 45,
      taxonomyLevel: 'Apply'
    },
    weakestTopic: {
      name: 'Algorithms',
      currentLevel: 'Understand',
      bloomScore: 2.3
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get(`/api/student/${studentId}/analytics`);
        console.log("Analytics Response:", response.data);
        setAnalytics(response.data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [studentId]);

  const handleQuizClick = () => {
    // Navigate to quiz page with the topic
    navigate(`/quiz/${encodeURIComponent(analytics.weakestTopic.name)}`, {
      state: { 
        topic: analytics.weakestTopic.name,
        currentLevel: analytics.weakestTopic.currentLevel,
        bloomScore: analytics.weakestTopic.bloomScore
      }
    });
  };

  const handleKnowledgeCapsuleClick = () => {
    // Navigate to knowledge capsule page with the topic
    navigate(`/knowledge-capsule/${encodeURIComponent(analytics.weakestTopic.name)}`, {
      state: { 
        topic: analytics.weakestTopic.name,
        currentLevel: analytics.weakestTopic.currentLevel,
        bloomScore: analytics.weakestTopic.bloomScore
      }
    });
  };

  if (loading) {
    return <div className="text-lg">Loading...</div>;
  }

  return (
    <div
      className="rounded-3xl px-6 py-5 md:px-8 md:py-6 w-full h-full flex flex-col"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f3f6ff 100%)",
        border: "2px solid rgba(76,115,255,0.14)",
      }}
    >
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-base font-bold font-family-body tracking-wider uppercase text-[#4C73FF] mb-1">
          Personalized Guidance
        </h2>
        <h1 className="font-bold font-['Fredoka'] text-4xl md:text-4xl text-[#4C73FF]">
          Next Steps
        </h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Performance Status */}
        <div
          className="rounded-2xl px-4 py-3"
          style={{
            background: "rgba(232,241,255,0.6)",
            border: "2px solid rgba(76,115,255,0.14)"
          }}
        >
          <p className="font-['GlacialIndifference',sans-serif] font-bold text-lg mb-1">
            {analytics.performanceStatus === 'good' 
              ? 'Great progress!' 
              : 'Room for improvement'}
          </p>
          <p className="font-['GlacialIndifference',sans-serif] text-base text-gray-700">
            {analytics.performanceStatus === 'good' 
              ? `Your grades are solid (avg: ${analytics.averageGrade}%). Keep using ${analytics.currentStudyMethod} - it's working well for you!`
              : `Your average is ${analytics.averageGrade}%. Consider switching up your study method to see better results.`}
          </p>
        </div>

        {/* Quickest Improvement */}
        <div
          className="rounded-2xl px-4 py-3"
          style={{
            background: "rgba(232,241,255,0.6)",
            border: "2px solid rgba(76,115,255,0.14)"
          }}
        >
          <p className="font-['GlacialIndifference',sans-serif] font-bold text-lg mb-2">
            Quickest Improvement
          </p>
          <div className="bg-white rounded-xl px-3 py-2.5 mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-['GlacialIndifference',sans-serif] font-semibold text-base">
                {analytics.quickestImprovement.topic}
              </span>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-gray-500">{analytics.quickestImprovement.from}%</span>
                <span className="text-gray-400">→</span>
                <span className="text-[#4C73FF] font-bold">{analytics.quickestImprovement.to}%</span>
              </div>
            </div>
            
            {/* What you did then */}
            <div className="pt-3 border-t border-gray-200">
              <p className="font-['GlacialIndifference',sans-serif] text-sm font-semibold text-gray-600 mb-2">
                What you did then:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="font-['GlacialIndifference',sans-serif] text-sm text-gray-500 mb-0.5">
                    Study Method
                  </p>
                  <p className="font-['GlacialIndifference',sans-serif] text-base font-semibold text-[#4C73FF]">
                    {analytics.quickestImprovement.dominantLearningStyle}
                  </p>
                </div>
                <div>
                  <p className="font-['GlacialIndifference',sans-serif] text-sm text-gray-500 mb-0.5">
                    Study Hours
                  </p>
                  <p className="font-['GlacialIndifference',sans-serif] text-base font-semibold text-[#4C73FF]">
                    {analytics.quickestImprovement.studyHours}h/week
                  </p>
                </div>
                <div>
                  <p className="font-['GlacialIndifference',sans-serif] text-sm text-gray-500 mb-0.5">
                    Questions
                  </p>
                  <p className="font-['GlacialIndifference',sans-serif] text-base font-semibold text-[#4C73FF]">
                    {analytics.quickestImprovement.questionsAttempted}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <p className="font-['GlacialIndifference',sans-serif] text-sm text-gray-600">
                  You completed <span className="font-semibold text-[#4C73FF]">{analytics.quickestImprovement.questionsAttempted} questions</span> at the <span className="font-semibold text-[#4C73FF]">{analytics.quickestImprovement.taxonomyLevel}</span> level (Bloom's Taxonomy)
                </p>
              </div>
            </div>
          </div>
          <p className="font-['GlacialIndifference',sans-serif] text-sm text-gray-600">
            This approach worked great - try applying it to other topics!
          </p>
        </div>

        {/* Weakness Area - Action Required */}
        <div
          className="rounded-2xl px-4 py-4"
          style={{
            background: "rgba(232,241,255,0.6)",
            border: "2px solid rgba(76,115,255,0.14)"
          }}
        >
          <p className="font-['GlacialIndifference',sans-serif] font-bold text-lg mb-1">
            Focus Area
          </p>
          <p className="font-['GlacialIndifference',sans-serif] text-base text-gray-700 mb-3">
            Your <span className="font-bold">{analytics.weakestTopic.name}</span> has the lowest Bloom's Taxonomy score ({analytics.weakestTopic.bloomScore}/6). 
            Let's strengthen this foundation!
          </p>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={handleQuizClick}
              className="w-full text-white text-base font-['GlacialIndifference',sans-serif] font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #4C73FF 0%, #2D4BB4 100%)",
                boxShadow: "0 4px 12px rgba(76,115,255,0.3)"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(76,115,255,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(76,115,255,0.3)";
              }}
            >
              Try Practice Questions
            </button>
            
            <button
              onClick={handleKnowledgeCapsuleClick}
              className="w-full bg-white text-base font-['GlacialIndifference',sans-serif] font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 cursor-pointer"
              style={{
                border: "2px solid rgba(76,115,255,0.3)",
                color: "#4C73FF"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(232,241,255,0.5)";
                e.currentTarget.style.borderColor = "rgba(76,115,255,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.borderColor = "rgba(76,115,255,0.3)";
              }}
            >
              Review Knowledge Capsule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextSteps;
import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { IconButton } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ChatIcon from "@mui/icons-material/Chat";
import QuizIcon from "@mui/icons-material/Quiz";
import AssignmentIcon from "@mui/icons-material/Assignment";
import QuizCustomizationModal from "../components/QuizCustomizationModal";
import ThreadMap from "./ThreadMap";

type Topic = {
  id: string;
  name: string;
};

type Module = {
  id: string;
  index: string;
  name: string;
  topics: Topic[];
};

export default function ModuleInfo() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleStartQuiz = (numQuestions: number, selectedLevels: string[]) => {
    const levelsParam = selectedLevels.join(",");
    navigate(
      `/Modules/${moduleId}/quiz?type=custom&questions=${numQuestions}&levels=${levelsParam}`
    );
    setQuizModalOpen(false);
  };

  useEffect(() => {
    const fetchModule = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(`/api/module/${moduleId}/`);
        setModule(response.data);
      } catch (error) {
        console.error("Failed to fetch module", error);
        setError("Failed to load module. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (moduleId) fetchModule();
  }, [moduleId]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;
  if (!module) return <p className="p-6">Module not found</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-primary-dark rounded-xl shadow-lg mb-8 p-4 md:p-6">
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

          <h1 className="text-2xl md:text-3xl font-bold text-white flex-1 font-family-display">
            {module.index}: {module.name}
          </h1>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Knowledge Capsules Column */}
        <div className="flex-1 p-4 w-full md:w-1/2">
          <h2 className="font-['Fredoka'] font-bold text-[#004aad] text-3xl mb-4">
            Knowledge Capsules
          </h2>
          {module.topics && module.topics.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#004aad] scrollbar-track-gray-200">
              <ul>
                {module.topics.map((topic, index) => {
                  const weekNumber = index + 1;
                  return (
                    <Link
                      key={topic.id}
                      to={`/Modules/${moduleId}/Topics/${topic.id}/Notes?week=${weekNumber}`}
                    >
                      <li className="bg-[#cddcf7] rounded-[8px] py-2 pl-4 mb-2 font-bold hover:bg-[#b8cef0] transition-colors">
                        Week {weekNumber}: {topic.name}
                      </li>
                    </Link>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500">
              No topics available for this module.
            </p>
          )}
        </div>

        {/* ThreadMap Column */}
        <div className="flex-1 p-4 w-full md:w-1/2">
          <h2 className="font-['Fredoka'] font-bold text-[#004aad] text-3xl mb-4">
            ThreadMap
          </h2>
          <p className="text-gray-500">ThreadMap visualization placeholder</p>
        </div>
      </div>

      {/* Learning Tools Section */}
      <div className="mt-8 max-w-4xl mx-auto">
        <h2 className="font-['Fredoka'] font-bold text-[#004aad] text-3xl mb-6 text-center">
          Learning Tools
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Talk to Chatbot Button */}
          <button
            onClick={() => navigate(`/Modules/${moduleId}/chatbot`)}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all flex flex-col items-center gap-3 border-2 border-transparent hover:border-[#004aad]"
          >
            <div className="bg-[#cddcf7] rounded-full p-3">
              <ChatIcon sx={{ fontSize: 32, color: "#004aad" }} />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-[#004aad]">
                Talk to Chatbot
              </h3>
              <p className="text-sm text-gray-600">Get instant help</p>
            </div>
          </button>

          {/* Weekly Review Quiz Button */}
          <button
            onClick={() => navigate(`/Modules/${moduleId}/quiz?type=weekly`)}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all flex flex-col items-center gap-3 border-2 border-transparent hover:border-[#004aad]"
          >
            <div className="bg-[#cddcf7] rounded-full p-3">
              <AssignmentIcon sx={{ fontSize: 32, color: "#004aad" }} />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-[#004aad]">
                Weekly Review Quiz
              </h3>
              <p className="text-sm text-gray-600">
                Test your weekly knowledge
              </p>
            </div>
          </button>

          {/* Quiz Yourself Button */}
          <button
            onClick={() => setQuizModalOpen(true)}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all flex flex-col items-center gap-3 border-2 border-transparent hover:border-[#004aad]"
          >
            <div className="bg-[#cddcf7] rounded-full p-3">
              <QuizIcon sx={{ fontSize: 32, color: "#004aad" }} />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-[#004aad]">
                Quiz Yourself
              </h3>
              <p className="text-sm text-gray-600">
                Customize your practice quiz
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Quiz Customization Modal */}
      <QuizCustomizationModal
        open={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        onStartQuiz={handleStartQuiz}
      />
    </div>
  );
}

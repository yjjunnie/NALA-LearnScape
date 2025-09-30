import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  IconButton,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  CircularProgress,
  Alert,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

type QuizQuestion = {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: string;
  bloom_level: string;
};

type QuizData = {
  quiz_history_id: number;
  questions: QuizQuestion[];
  student_answers?: { [key: string]: string };
  score?: number;
  completed: boolean;
};

export default function Quiz() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const quizType = searchParams.get("type"); // "weekly" or "custom"
  const numQuestions = searchParams.get("questions");
  const levels = searchParams.get("levels");

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
        const fetchOrGenerateQuiz = async () => {
          try {
            setLoading(true);
            setError(null);
      
            const studentId = "1"; // Hardcoded student ID
      
            if (quizType === "weekly") {
              // Fetch weekly quiz from database
              const response = await axios.get(`/api/module/${moduleId}/quiz/weekly/`, {
                params: { student_id: studentId } // Pass student ID here
              });
              setQuizData(response.data);
            } else if (quizType === "custom") {
              // Generate custom quiz via LLM
              const bloomLevels = levels ? levels.split(",") : ["Remember", "Understand"];
              const response = await axios.post(`/api/module/${moduleId}/quiz/generate/`, {
                num_questions: parseInt(numQuestions || "10"),
                bloom_levels: bloomLevels,
                student_id: studentId, // Pass student ID here
              });
              setQuizData(response.data);
            }
          } catch (err) {
            console.error("Failed to fetch/generate quiz", err);
            setError("Failed to load quiz. Please try again.");
          } finally {
            setLoading(false);
          }
        };
      
        if (moduleId && quizType) {
          fetchOrGenerateQuiz();
        }
      }, [moduleId, quizType, numQuestions, levels]);
      

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion]: answer,
    }));
  };

  const handleNext = async () => {
    if (!quizData) return;
  
    const studentId = "1"; // Hardcoded
  
    try {
      await axios.patch(`/api/quiz/${quizData.quiz_history_id}/answer/`, {
        question_index: currentQuestion,
        answer: selectedAnswers[currentQuestion],
        student_id: studentId, // Pass student ID
      });
    } catch (err) {
      console.error("Failed to save answer", err);
    }
  
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };
  
  const handleSubmitQuiz = async () => {
    if (!quizData) return;
  
    const studentId = "1"; // Hardcoded
  
    setSubmitting(true);
    try {
      const response = await axios.post(`/api/quiz/${quizData.quiz_history_id}/submit/`, {
        answers: selectedAnswers,
        student_id: studentId, // Pass student ID
      });
      
      setQuizData((prev) => prev ? {
        ...prev,
        score: response.data.score,
        completed: true,
        student_answers: selectedAnswers,
      } : null);
      
      setShowResults(true);
    } catch (err) {
      console.error("Failed to submit quiz", err);
      setError("Failed to submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const calculateScore = () => {
    if (!quizData) return 0;
    let correct = 0;
    quizData.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) {
        correct++;
      }
    });
    return (correct / quizData.questions.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <CircularProgress sx={{ color: "#004aad" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <Alert severity="warning">Quiz not found</Alert>
      </div>
    );
  }

  if (showResults) {
    const score = quizData.score || calculateScore();
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h1 className="font-['Fredoka'] font-bold text-[#004aad] text-3xl mb-6 text-center">
              Quiz Results
            </h1>
            
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-[#004aad] mb-2">
                {score.toFixed(1)}%
              </div>
              <p className="text-gray-600">
                You got {quizData.questions.filter((q, idx) => selectedAnswers[idx] === q.answer).length} out of {quizData.questions.length} correct
              </p>
            </div>

            <div className="space-y-6">
              {quizData.questions.map((q, idx) => {
                const userAnswer = selectedAnswers[idx];
                const isCorrect = userAnswer === q.answer;
                
                return (
                  <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start gap-2 mb-3">
                      {isCorrect ? (
                        <CheckCircleIcon sx={{ color: "green", mt: 0.5 }} />
                      ) : (
                        <CancelIcon sx={{ color: "red", mt: 0.5 }} />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 mb-1">
                          Question {idx + 1}: {q.question}
                        </p>
                        <p className="text-sm text-gray-500">Bloom Level: {q.bloom_level}</p>
                      </div>
                    </div>
                    
                    <div className="ml-8 space-y-2">
                      {Object.entries(q.options).map(([key, value]) => (
                        <div
                          key={key}
                          className={`p-2 rounded ${
                            key === q.answer
                              ? "bg-green-100 border border-green-400"
                              : key === userAnswer && !isCorrect
                              ? "bg-red-100 border border-red-400"
                              : "bg-white"
                          }`}
                        >
                          <span className="font-semibold">{key}:</span> {value}
                          {key === q.answer && " ✓ (Correct)"}
                          {key === userAnswer && !isCorrect && " ✗ (Your answer)"}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                sx={{
                  color: "#004aad",
                  borderColor: "#004aad",
                  "&:hover": { borderColor: "#003580", backgroundColor: "rgba(0, 74, 173, 0.04)" },
                }}
              >
                Back to Module
              </Button>
              <Button
                variant="contained"
                onClick={() => window.location.reload()}
                sx={{
                  backgroundColor: "#004aad",
                  "&:hover": { backgroundColor: "#003580" },
                }}
              >
                Take Another Quiz
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = quizData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[#004aad] rounded-xl shadow-lg mb-6 p-4 md:p-6">
          <div className="flex items-center gap-4 mb-4">
            <IconButton
              onClick={() => navigate(-1)}
              sx={{
                borderRadius: 2.5,
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                },
              }}
            >
              <ArrowBackRoundedIcon />
            </IconButton>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex-1 font-['Fredoka']">
              {quizType === "weekly" ? "Weekly Review Quiz" : "Custom Quiz"}
            </h1>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/30 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white text-sm mt-2">
            Question {currentQuestion + 1} of {quizData.questions.length}
          </p>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
          <div className="mb-4">
            <span className="inline-block bg-[#cddcf7] text-[#004aad] px-3 py-1 rounded-full text-sm font-semibold">
              {question.bloom_level}
            </span>
          </div>
          
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
            {question.question}
          </h2>

          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={selectedAnswers[currentQuestion] || ""}
              onChange={(e) => handleAnswerSelect(e.target.value)}
            >
              {Object.entries(question.options).map(([key, value]) => (
                <FormControlLabel
                  key={key}
                  value={key}
                  control={
                    <Radio
                      sx={{
                        color: "#004aad",
                        "&.Mui-checked": { color: "#004aad" },
                      }}
                    />
                  }
                  label={
                    <div className="py-2">
                      <span className="font-semibold mr-2">{key}.</span>
                      {value}
                    </div>
                  }
                  sx={{
                    border: "2px solid #e5e7eb",
                    borderRadius: 2,
                    mb: 2,
                    px: 2,
                    mx: 0,
                    "&:hover": {
                      backgroundColor: "#f9fafb",
                      borderColor: "#004aad",
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outlined"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            sx={{
              color: "#004aad",
              borderColor: "#004aad",
              "&:hover": { borderColor: "#003580", backgroundColor: "rgba(0, 74, 173, 0.04)" },
              "&:disabled": { borderColor: "#ccc", color: "#ccc" },
            }}
          >
            Previous
          </Button>

          {currentQuestion === quizData.questions.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmitQuiz}
              disabled={submitting || Object.keys(selectedAnswers).length !== quizData.questions.length}
              sx={{
                backgroundColor: "#004aad",
                "&:hover": { backgroundColor: "#003580" },
                "&:disabled": { backgroundColor: "#cddcf7", color: "#888" },
              }}
            >
              {submitting ? <CircularProgress size={24} sx={{ color: "white" }} /> : "Submit Quiz"}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!selectedAnswers[currentQuestion]}
              sx={{
                backgroundColor: "#004aad",
                "&:hover": { backgroundColor: "#003580" },
                "&:disabled": { backgroundColor: "#cddcf7", color: "#888" },
              }}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
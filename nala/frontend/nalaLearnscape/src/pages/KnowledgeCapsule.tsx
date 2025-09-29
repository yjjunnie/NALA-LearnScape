// src/pages/KnowledgeCapsule.tsx
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import IconButton from "@mui/material/IconButton";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import NotesEditor from "../components/editor/NotesEditor";

type Topic = {
  id: number;
  name: string;
  notes?: string;
};

export default function KnowledgeCapsule() {
  const { moduleId, topicId } = useParams<{ moduleId: string, topicId: string }>();
  const [searchParams] = useSearchParams();
  const weekNumber = searchParams.get('week');
  
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleSaveNotes = (content: string) => {
    // Save notes to your backend
    console.log("Saving notes:", content);
    // axios.post(`/api/module/${moduleId}/topic/${topicId}/notes`, { content });
  };

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/module/${moduleId}/topic/${topicId}/notes`);
        setTopic(response.data);
      } catch (err) {
        console.error("Failed to fetch topic", err);
        setError("Failed to load topic. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (moduleId && topicId) fetchTopic();
  }, [moduleId, topicId]);

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
            {loading
              ? "Loading..."
              : error
              ? "Error"
              : topic && weekNumber
              ? `Week ${weekNumber}: ${topic.name}`
              : topic
              ? topic.name
              : "Topic not found"}
          </h1>
        </div>
      </div>

      {/* Editor Body */}
      <div className="max-w-6xl mx-auto">
        {loading && <p className="p-4">Loading topic...</p>}
        {error && <p className="p-4 text-red-500">{error}</p>}
        {!loading && !error && !topic && <p className="p-4">No topic found.</p>}
        
        {!loading && topic && (
          <NotesEditor
            placeholder={topic.notes}
            initialContent={topic.notes}
            onSave={handleSaveNotes}
          />
        )}
      </div>
    </div>
  );
}
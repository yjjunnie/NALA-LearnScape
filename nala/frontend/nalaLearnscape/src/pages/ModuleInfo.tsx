// src/pages/ModuleInfo.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { IconButton } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

type Topic = {
  id: number;
  name: string;
};

type Module = {
  id: number;
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

  const handleBackClick = () => {
    navigate(-1); 
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
          {/* Back Button */}
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

      <div className="flex gap-6">
        {/* Knowledge Capsules Column */}
        <div className="flex-1 bg-[#f0f4ff] p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Knowledge Capsules</h3>
          {module.topics && module.topics.length > 0 ? (
            <ul className="list-disc pl-6">
              {module.topics.map((topic) => (
                <li key={topic.id}>{topic.name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No topics available for this module.</p>
          )}
        </div>

        {/* ThreadMap Column */}
        <div className="flex-1 bg-[#fef9f0] p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">ThreadMap</h3>
          {/* Replace with your ThreadMap component */}
          <p className="text-gray-500">ThreadMap visualization placeholder</p>
        </div>
      </div>
    </div>
  );
}

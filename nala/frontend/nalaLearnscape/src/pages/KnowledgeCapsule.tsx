import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import IconButton from "@mui/material/IconButton";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import NotesEditor from "../components/editor/NotesEditor";

type Concept = { id: string; name: string; description: string; };
type Topic = {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  concepts?: Concept[];
};

function convertTextToLexicalState(text: string): string {
    const lines = text.split("\n");
    const children = lines.map(line => {
      let type: "paragraph" | "heading" = "paragraph";
      let tag: string | undefined = undefined;
  
      if (line.startsWith("## ")) {
        type = "heading";
        tag = "h2"; // <h2> element
        line = line.replace("## ", "").trim();
      }
  
      return {
        type,
        tag, // Lexical expects "h2", "h3", etc.
        children: [
          {
            type: "text",
            text: line,
            detail: 0,
            mode: "normal",
            style: "",
            format: 0,
            version: 1
          }
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        version: 1
      };
    });
  
    return JSON.stringify({ root: { children, type: "root", version: 1, direction: "ltr", format: "", indent: 0 } });
  }
  
function generateTopicNotes(topic: Topic): string {
  let text = topic.description ? `${topic.description}\n\n` : "";
  if (topic.concepts) {
    topic.concepts.forEach((c, i) => {
      text += `## ${c.name}\n${c.description.trim()}\n`;
      if (i < topic.concepts.length - 1) text += "\n";
    });
  }
  return text;
}

export default function KnowledgeCapsule() {
  const { topicId } = useParams<{ topicId: string }>();
  const [searchParams] = useSearchParams();
  const weekNumber = searchParams.get('week');
  const navigate = useNavigate();

  const studentId = "1"; // replace with logged-in user ID
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleBackClick = () => navigate(-1);

  const handleSaveNotes = async (content: string) => {
    try {
      setSaveStatus('saving');
      await axios.post(`/api/student/${studentId}/topic/${topicId}/notes/`, { content });
      setTopic(prev => prev ? { ...prev, notes: content } : prev);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  useEffect(() => {
    const fetchTopic = async () => {
      if (!topicId) return;
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/student/${studentId}/topic/${topicId}/notes/`);
        const topicData: Topic = response.data;
        if (!topicData.notes || topicData.notes.trim() === "") {
          topicData.notes = generateTopicNotes(topicData);
        }
        setTopic(topicData);
      } catch {
        setError("Failed to load topic.");
      } finally {
        setLoading(false);
      }
    };
    fetchTopic();
  }, [topicId]);

  if (loading) return <p className="p-4">Loading topic...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!topic) return <p className="p-4">Topic not found.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 lg:p-8">
      <div className="bg-primary-dark rounded-xl shadow-lg mb-8 p-4 md:p-6 flex items-center gap-8">
        <IconButton onClick={handleBackClick} sx={{ borderRadius: 2.5, border: "1px solid rgba(255, 255, 255, 0.2)", backgroundColor: "rgba(255, 255, 255, 0.1)", color: "white", p: 1.5 }}>
          <ArrowBackRoundedIcon />
        </IconButton>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {weekNumber ? `Week ${weekNumber}: ${topic.name}` : topic.name}
          </h1>
          {saveStatus !== 'idle' && (
            <p className="text-sm mt-2 text-white/80">
              {saveStatus === 'saving' && '💾 Saving notes...'}
              {saveStatus === 'saved' && '✅ Notes saved successfully'}
              {saveStatus === 'error' && '❌ Failed to save notes'}
            </p>
          )}
        </div>
      </div>
      <div className="max-w-6xl mx-auto">
        <NotesEditor
          initialContent={convertTextToLexicalState(topic.notes || '')}
          onSave={handleSaveNotes}
          placeholder="Start taking notes..."
        />
      </div>
    </div>
  );
}

import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const normalize = (value?: string | null) => value?.trim().toLowerCase() ?? "";

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

interface KnowledgeCapsuleProps {
  topicIdOverride?: string;
  weekOverride?: string | null;
  hideBackButton?: boolean;
  focusedConceptName?: string;
}

export default function KnowledgeCapsule({
  topicIdOverride,
  weekOverride,
  hideBackButton = false,
  focusedConceptName,
}: KnowledgeCapsuleProps = {}) {
  const params = useParams<{ topicId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const topicId = topicIdOverride ?? params.topicId;
  const weekNumber = useMemo(() => {
    if (typeof weekOverride !== "undefined") {
      return weekOverride;
    }
    return searchParams.get("week");
  }, [searchParams, weekOverride]);

  const studentId = "1"; // replace with logged-in user ID
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentEditableRef = useRef<HTMLDivElement | null>(null);
  const normalizedFocusedConcept = useMemo(
    () => normalize(focusedConceptName),
    [focusedConceptName]
  );

  const handleBackClick = () => navigate(-1);

  const handleSaveNotes = async (content: string) => {
    try {
      setSaveStatus('saving');
      if (!topicId) {
        return;
      }
      await axios.post(`/api/student/${studentId}/topic/${topicId}/notes/`, {
        content,
      });
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

  const findScrollContainer = useCallback(() => {
    const attribute = "[data-knowledge-popup-scroll-container]";
    const fromContent = contentEditableRef.current?.closest(attribute);
    if (fromContent instanceof HTMLDivElement) {
      return fromContent;
    }

    const fromRoot = containerRef.current?.closest(attribute);
    if (fromRoot instanceof HTMLDivElement) {
      return fromRoot;
    }

    return containerRef.current;
  }, []);

  useEffect(() => {
    if (!hideBackButton) {
      return;
    }

    const container = findScrollContainer();
    if (!container) {
      return;
    }

    if (!topic || !normalizedFocusedConcept) {
      container.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    let found = false;

    const attemptScroll = () => {
      if (found) {
        return;
      }

      const tryMatch = (elements?: NodeListOf<HTMLElement>) => {
        elements?.forEach((element) => {
          if (found) {
            return;
          }
          const text = normalize(element.textContent);
          if (text && text === normalizedFocusedConcept) {
            const containerRect = container.getBoundingClientRect();
            const targetRect = element.getBoundingClientRect();
            const offset =
              targetRect.top - containerRect.top + container.scrollTop - 24;
            container.scrollTo({
              top: Math.max(offset, 0),
              behavior: "auto",
            });
            found = true;
          }
        });
      };

      const headings = contentEditableRef.current?.querySelectorAll<HTMLElement>(
        "h1, h2, h3, h4, h5, h6"
      );
      tryMatch(headings);

      if (!found) {
        const paragraphs = contentEditableRef.current?.querySelectorAll<HTMLElement>(
          "p"
        );
        tryMatch(paragraphs);
      }
    };

    const frameId = window.requestAnimationFrame(() => {
      attemptScroll();
    });

    const timeouts: number[] = [
      window.setTimeout(attemptScroll, 150),
      window.setTimeout(attemptScroll, 350),
      window.setTimeout(attemptScroll, 600),
      window.setTimeout(() => {
        if (!found) {
          container.scrollTo({ top: 0, behavior: "auto" });
        }
      }, 750),
    ];

    return () => {
      window.cancelAnimationFrame(frameId);
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [
    findScrollContainer,
    hideBackButton,
    normalizedFocusedConcept,
    topic,
    topic?.notes,
  ]);

  if (!topicId) {
    return <p className="p-4">Topic not found.</p>;
  }

  if (loading) return <p className="p-4">Loading topic...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!topic) return <p className="p-4">Topic not found.</p>;

  const containerClass = hideBackButton
    ? "h-full bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 lg:p-8 overflow-y-auto"
    : "min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 lg:p-8";
  const headerClass = hideBackButton
    ? "bg-primary-dark rounded-xl shadow-lg mb-4 p-4 md:p-6 flex items-center gap-6"
    : "bg-primary-dark rounded-xl shadow-lg mb-8 p-4 md:p-6 flex items-center gap-8";

  return (
    <div className={containerClass} ref={containerRef}>
      <div className={headerClass}>
        {!hideBackButton && (
          <IconButton
            onClick={handleBackClick}
            sx={{
              borderRadius: 2.5,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "white",
              p: 1.5,
            }}
          >
            <ArrowBackRoundedIcon />
          </IconButton>
        )}
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
          contentEditableRef={contentEditableRef}
        />
      </div>
    </div>
  );
}

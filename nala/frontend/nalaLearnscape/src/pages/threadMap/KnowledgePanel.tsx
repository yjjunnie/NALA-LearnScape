import React, { useEffect, useMemo, useRef, useState } from "react";

import KnowledgeCapsule from "../KnowledgeCapsule";

interface Concept {
  id: string;
  name: string;
  description?: string;
}

interface Topic {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  concepts?: Concept[];
}

interface KnowledgePanelProps {
  topicId?: string;
  conceptName?: string;
}

const STUDENT_ID = "1";

const normalize = (value?: string) => value?.trim().toLowerCase() ?? "";

const extractTextFromNode = (node: any): string => {
  if (!node) {
    return "";
  }

  if (typeof node.text === "string") {
    return node.text;
  }

  if (Array.isArray(node.children)) {
    return node.children.map(extractTextFromNode).join("");
  }

  return "";
};

const extractConceptNotesFromPlainText = (
  notes: string,
  conceptName: string
): string[] => {
  const target = normalize(conceptName);
  const lines = notes.split(/\r?\n/);
  const collected: string[] = [];
  let capturing = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (capturing && collected.length > 0) {
        break;
      }
      continue;
    }

    const normalizedLine = normalize(line.replace(/[:\-]+$/, ""));

    if (!capturing) {
      if (
        normalizedLine === target ||
        normalizedLine.includes(target)
      ) {
        capturing = true;
      }
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      break;
    }

    collected.push(line);
  }

  if (collected.length > 0) {
    return collected;
  }

  return notes
    .split(/\r?\n{2,}/)
    .map((block) => block.replace(/\r?\n/g, " ").trim())
    .filter((block) => block.length > 0)
    .slice(0, 3);
};

const extractConceptNotes = (notes: string, conceptName: string): string[] => {
  const trimmed = notes.trim();
  if (!trimmed) {
    return [];
  }

  const looksLikeJson = trimmed.startsWith("{") || trimmed.startsWith("[");

  if (!looksLikeJson) {
    return extractConceptNotesFromPlainText(trimmed, conceptName);
  }

  try {
    const parsed = JSON.parse(trimmed);
    const children: any[] = parsed?.root?.children ?? [];
    const target = normalize(conceptName);
    const collected: string[] = [];
    let capturing = false;

    for (const child of children) {
      if (child.type === "heading") {
        const headingText = normalize(extractTextFromNode(child));
        if (headingText === target) {
          capturing = true;
          continue;
        }

        if (capturing) {
          break;
        }
      }

      if (capturing) {
        const text = extractTextFromNode(child).trim();
        if (text) {
          collected.push(text);
        }
      }
    }

    if (collected.length > 0) {
      return collected;
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      console.warn("Failed to parse structured notes for concept preview", error);
    }
  }

  return extractConceptNotesFromPlainText(trimmed, conceptName);
};

const KnowledgePanel: React.FC<KnowledgePanelProps> = ({ topicId, conceptName }) => {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const showConceptView = Boolean(conceptName);

  useEffect(() => {
    if (!showConceptView) {
      setTopic(null);
      setLoading(false);
      setError(null);
      return;
    }

    let ignore = false;

    const fetchTopic = async () => {
      if (!topicId) {
        setTopic(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/student/${STUDENT_ID}/topic/${topicId}/notes/`
        );
        if (!response.ok) {
          throw new Error(`Failed to load topic ${topicId}`);
        }

        const topicData = (await response.json()) as Topic;

        if (!ignore) {
          setTopic(topicData);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load topic notes", err);
          setError("Unable to load knowledge capsule content.");
          setTopic(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchTopic();

    return () => {
      ignore = true;
    };
  }, [showConceptView, topicId]);

  const focusedConcept = useMemo(() => {
    if (!conceptName || !topic?.concepts) {
      return null;
    }

    return (
      topic.concepts.find(
        (concept) => normalize(concept.name) === normalize(conceptName)
      ) ?? null
    );
  }, [conceptName, topic?.concepts]);

  const conceptNotes = useMemo(() => {
    if (!conceptName || !topic?.notes) {
      return [];
    }

    return extractConceptNotes(topic.notes, conceptName);
  }, [conceptName, topic?.notes]);

  const panelTitle = conceptName ?? topic?.name ?? "Knowledge capsule";

  useEffect(() => {
    if (!scrollContainerRef.current) {
      return;
    }

    scrollContainerRef.current.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [showConceptView, topicId, conceptName, topic?.id, topic?.notes]);

  if (!topicId) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontStyle: "italic",
          fontFamily: "'GlacialIndifference', sans-serif",
        }}
      >
        Select a node to preview its knowledge capsule content.
      </div>
    );
  }

  if (showConceptView && loading) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          fontFamily: "'GlacialIndifference', sans-serif",
        }}
      >
        Loading knowledge capsule...
      </div>
    );
  }

  if (showConceptView && error) {
    return (
      <div
        style={{
          padding: "16px",
          color: "#dc2626",
          fontFamily: "'GlacialIndifference', sans-serif",
        }}
      >
        {error}
      </div>
    );
  }

  if (showConceptView && !topic) {
    return (
      <div
        style={{
          padding: "16px",
          color: "#64748b",
          fontFamily: "'GlacialIndifference', sans-serif",
        }}
      >
        No knowledge capsule content available.
      </div>
    );
  }

  if (!showConceptView) {
    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          overflow: "auto",
        }}
        ref={scrollContainerRef}
      >
        <KnowledgeCapsule topicIdOverride={topicId} hideBackButton />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "'GlacialIndifference', sans-serif",
        color: "#0f172a",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "rgba(15, 23, 42, 0.6)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: "6px",
          }}
        >
          Knowledge Capsule
        </div>
        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>{panelTitle}</h3>
      </div>

      {showConceptView ? (
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            overflowY: "auto",
            maxHeight: "100%",
          }}
          ref={scrollContainerRef}
        >
          {focusedConcept ? (
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                border: "1px solid #dbeafe",
                padding: "14px",
                boxShadow: "0 10px 24px rgba(148, 163, 184, 0.18)",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "15px" }}>
                Concept overview
              </div>
              {focusedConcept.description ? (
                <p style={{ marginTop: "8px", fontSize: "13px", lineHeight: 1.6 }}>
                  {focusedConcept.description}
                </p>
              ) : (
                <p style={{ marginTop: "8px", fontSize: "13px", color: "#64748b" }}>
                  No concept description available.
                </p>
              )}
            </div>
          ) : (
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                border: "1px dashed #d6d3f0",
                padding: "16px",
                color: "#64748b",
                fontStyle: "italic",
              }}
            >
              This concept is not documented in the knowledge capsule yet.
            </div>
          )}

          {conceptNotes.length > 0 && (
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                border: "1px solid #cbd5f5",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "14px" }}>
                Notes from knowledge capsule
              </div>
              {conceptNotes.map((paragraph, index) => (
                <p key={index} style={{ margin: 0, fontSize: "13px", lineHeight: 1.6 }}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {conceptNotes.length === 0 && focusedConcept && (
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                border: "1px dashed #d6d3f0",
                padding: "16px",
                color: "#64748b",
                fontSize: "12.5px",
              }}
            >
              The notes for this concept are empty. Visit the full knowledge capsule to add
              more details.
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            background: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            overflowY: "auto",
            maxHeight: "100%",
          }}
        >
          {topic.description && (
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                border: "1px solid #dbeafe",
                padding: "16px",
                boxShadow: "0 10px 24px rgba(148, 163, 184, 0.18)",
                fontSize: "13px",
                lineHeight: 1.6,
              }}
            >
              {topic.description}
            </div>
          )}

          {topic.concepts && topic.concepts.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "14px" }}>
                Concepts in this topic
              </div>
              {topic.concepts.map((concept) => (
                <div
                  key={concept.id}
                  style={{
                    background: "#fff",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{concept.name}</div>
                  <div style={{ fontSize: "12.5px", color: "#475569" }}>
                    {concept.description || "No description yet."}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!topic.description && (!topic.concepts || topic.concepts.length === 0) && (
            <div
              style={{
                background: "#fff",
                borderRadius: "10px",
                border: "1px dashed #d6d3f0",
                padding: "16px",
                color: "#64748b",
                fontStyle: "italic",
                fontSize: "12.5px",
              }}
            >
              This topic has not been documented yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgePanel;


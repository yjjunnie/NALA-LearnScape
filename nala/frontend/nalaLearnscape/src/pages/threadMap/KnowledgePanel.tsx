import React, { useEffect, useMemo, useRef, useState } from "react";

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

interface KnowledgeBlock {
  type: "heading" | "paragraph";
  text: string;
  tag?: string;
}

const parsePlainTextNotes = (notes: string): KnowledgeBlock[] => {
  const lines = notes.split(/\r?\n/);
  const blocks: KnowledgeBlock[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) {
      return;
    }

    const paragraphText = paragraphBuffer.join(" ").trim();
    paragraphBuffer = [];

    if (paragraphText.length === 0) {
      return;
    }

    blocks.push({ type: "paragraph", text: paragraphText });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      const [, hashes, headingText] = headingMatch;
      blocks.push({
        type: "heading",
        text: headingText.trim(),
        tag: `h${Math.min(hashes.length, 6)}`,
      });
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();

  return blocks;
};

const parseStructuredNotes = (notes: string): KnowledgeBlock[] => {
  try {
    const parsed = JSON.parse(notes);
    const children: any[] = parsed?.root?.children ?? [];

    const blocks: KnowledgeBlock[] = [];

    const addBlock = (block: KnowledgeBlock) => {
      if (!block.text || block.text.trim().length === 0) {
        return;
      }
      blocks.push({ ...block, text: block.text.trim() });
    };

    for (const child of children) {
      if (!child) {
        continue;
      }

      if (child.type === "heading") {
        addBlock({
          type: "heading",
          text: extractTextFromNode(child),
          tag: typeof child.tag === "string" ? child.tag : undefined,
        });
      } else if (child.type === "paragraph") {
        addBlock({
          type: "paragraph",
          text: extractTextFromNode(child),
        });
      } else if (Array.isArray(child.children)) {
        child.children.forEach((nested: any) => {
          if (nested?.type === "heading") {
            addBlock({
              type: "heading",
              text: extractTextFromNode(nested),
              tag: typeof nested.tag === "string" ? nested.tag : undefined,
            });
          } else if (nested?.type === "paragraph") {
            addBlock({
              type: "paragraph",
              text: extractTextFromNode(nested),
            });
          }
        });
      }
    }

    return blocks;
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      console.warn("Failed to parse structured knowledge capsule notes", error);
    }
    return parsePlainTextNotes(notes);
  }
};

const parseTopicNotes = (notes?: string | null): KnowledgeBlock[] => {
  if (!notes) {
    return [];
  }

  const trimmed = notes.trim();
  if (!trimmed) {
    return [];
  }

  const looksLikeJson = trimmed.startsWith("{") || trimmed.startsWith("[");
  return looksLikeJson
    ? parseStructuredNotes(trimmed)
    : parsePlainTextNotes(trimmed);
};

const KnowledgePanel: React.FC<KnowledgePanelProps> = ({
  topicId,
  conceptName,
}) => {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);

  const showConceptView = Boolean(conceptName);

  useEffect(() => {
    let ignore = false;

    const fetchTopic = async () => {
      if (!topicId) {
        setTopic(null);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
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
  }, [topicId]);

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

  const knowledgeBlocks = useMemo(() => {
    const parsed = parseTopicNotes(topic?.notes);

    if (parsed.length > 0) {
      return parsed;
    }

    const fallback: KnowledgeBlock[] = [];

    if (topic?.description) {
      fallback.push({ type: "paragraph", text: topic.description });
    }

    if (topic?.concepts) {
      topic.concepts.forEach((concept) => {
        fallback.push({ type: "heading", text: concept.name, tag: "h3" });
        if (concept.description) {
          fallback.push({ type: "paragraph", text: concept.description });
        }
      });
    }

    return fallback;
  }, [topic?.concepts, topic?.description, topic?.notes]);

  const focusBlockIndex = useMemo(() => {
    if (!showConceptView || !conceptName) {
      return 0;
    }

    const target = normalize(conceptName);
    const index = knowledgeBlocks.findIndex((block) => {
      if (block.type !== "heading") {
        return false;
      }

      return normalize(block.text) === target;
    });

    return index >= 0 ? index : 0;
  }, [conceptName, knowledgeBlocks, showConceptView]);

  useEffect(() => {
    blockRefs.current = [];
  }, [knowledgeBlocks]);

  const panelTitle = conceptName ?? topic?.name ?? "Knowledge capsule";

  useEffect(() => {
    if (!scrollContainerRef.current) {
      return;
    }
    const container = scrollContainerRef.current;

    if (showConceptView) {
      const target = blockRefs.current[focusBlockIndex];
      if (target) {
        const top = target.offsetTop;
        container.scrollTo({
          top: Math.max(top - 12, 0),
          left: 0,
          behavior: "auto",
        });
        return;
      }
    }

    container.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [
    conceptName,
    focusBlockIndex,
    knowledgeBlocks,
    showConceptView,
    topic?.id,
    topicId,
  ]);

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

  if (loading) {
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

  if (error) {
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

  if (!topic) {
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

  return (
    <div
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "'GlacialIndifference', sans-serif",
        color: "#0f172a",
        height: "100%",
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
        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
          {panelTitle}
        </h3>
      </div>

      {showConceptView && (
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            border: "1px solid #dbeafe",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            boxShadow: "0 12px 28px rgba(30, 64, 175, 0.12)",
          }}
        >
          <div style={{ fontSize: "17px", fontWeight: 700 }}>
            {focusedConcept?.name ?? conceptName}
          </div>
          <div style={{ fontSize: "13px", color: "#1e3a8a", fontWeight: 600 }}>
            Concept focus
          </div>
          <div style={{ fontSize: "13px", lineHeight: 1.6 }}>
            {focusedConcept?.description ||
              "No description available for this concept."}
          </div>
        </div>
      )}

      <div
        style={{
          background: "#f8fafc",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          overflowY: "auto",
          maxHeight: "100%",
        }}
        ref={scrollContainerRef}
      >
        {knowledgeBlocks.length === 0 && (
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              border: "1px dashed #d6d3f0",
              padding: "16px",
              color: "#64748b",
              fontSize: "12.5px",
              fontStyle: "italic",
            }}
          >
            This knowledge capsule does not have any saved notes yet.
          </div>
        )}

        {knowledgeBlocks.map((block, index) => {
          const isFocus = showConceptView && index === focusBlockIndex;

          if (block.type === "heading") {
            return (
              <div
                key={`${block.type}-${index}-${block.text}`}
                ref={(element) => {
                  blockRefs.current[index] = element;
                }}
                style={{
                  padding: isFocus ? "14px 12px" : "0",
                  borderRadius: isFocus ? "10px" : undefined,
                  background: isFocus ? "rgba(191, 219, 254, 0.35)" : undefined,
                  border: isFocus
                    ? "1px solid rgba(59, 130, 246, 0.35)"
                    : undefined,
                  scrollMarginTop: "12px",
                }}
              >
                <div
                  style={{
                    fontSize:
                      block.tag === "h1"
                        ? "22px"
                        : block.tag === "h2"
                        ? "20px"
                        : "18px",
                    fontWeight: 700,
                    color: isFocus ? "#1d4ed8" : "#0f172a",
                  }}
                >
                  {block.text}
                </div>
              </div>
            );
          }

          return (
            <div
              key={`${block.type}-${index}-${block.text.slice(0, 24)}`}
              ref={(element) => {
                blockRefs.current[index] = element;
              }}
              style={{
                fontSize: "13px",
                lineHeight: 1.6,
                color: "#1f2937",
                background: isFocus ? "rgba(191, 219, 254, 0.15)" : undefined,
                borderRadius: isFocus ? "8px" : undefined,
                padding: isFocus ? "10px 12px" : "0",
                scrollMarginTop: "12px",
              }}
            >
              {block.text}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KnowledgePanel;

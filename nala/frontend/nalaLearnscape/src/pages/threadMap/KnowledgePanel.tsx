import React, { useEffect } from "react";
import KnowledgeCapsule from "../KnowledgeCapsule";

interface KnowledgePanelProps {
  topicId?: string;
  conceptName?: string;
  scrollContainer?: HTMLDivElement | null;
}

const normalize = (value?: string) => value?.trim().toLowerCase() ?? "";

const KnowledgePanel: React.FC<KnowledgePanelProps> = ({
  topicId,
  conceptName,
  scrollContainer,
}) => {
  useEffect(() => {
    const container = scrollContainer;
    if (!container) {
      return;
    }

    if (!topicId) {
      container.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    if (!conceptName) {
      container.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    const target = normalize(conceptName);
    let animationFrame: number | null = null;
    let observer: MutationObserver | null = null;
    let attempts = 0;
    const maxAttempts = 30;

    const scrollToHeading = () => {
      if (!container) {
        return false;
      }

      const headings = Array.from(
        container.querySelectorAll<HTMLElement>(
          "h1, h2, h3, h4, h5, h6"
        )
      );

      const match = headings.find((element) => {
        const text = normalize(element.textContent ?? "");
        return text === target;
      });

      if (!match) {
        return false;
      }

      const containerRect = container.getBoundingClientRect();
      const elementRect = match.getBoundingClientRect();
      const offset =
        elementRect.top - containerRect.top + container.scrollTop - 16;

      container.scrollTo({
        top: Math.max(offset, 0),
        left: 0,
        behavior: "auto",
      });

      return true;
    };

    const attemptScroll = () => {
      if (scrollToHeading()) {
        return;
      }

      if (attempts >= maxAttempts) {
        return;
      }

      attempts += 1;
      animationFrame = requestAnimationFrame(attemptScroll);
    };

    if (!scrollToHeading()) {
      attemptScroll();

      observer = new MutationObserver(() => {
        if (scrollToHeading()) {
          observer?.disconnect();
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
      observer?.disconnect();
    };
  }, [conceptName, scrollContainer, topicId]);

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
          textAlign: "center",
          padding: "24px",
        }}
      >
        Select a node to preview its knowledge capsule content.
      </div>
    );
  }

  return (
    <KnowledgeCapsule topicIdOverride={topicId} hideBackButton useExternalScroll />
  );
};

export default KnowledgePanel;

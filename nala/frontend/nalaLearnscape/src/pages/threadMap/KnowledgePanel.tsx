import React from "react";
import KnowledgeCapsule from "../KnowledgeCapsule";

interface KnowledgePanelProps {
  topicId?: string;
  conceptName?: string;
}

const KnowledgePanel: React.FC<KnowledgePanelProps> = ({
  topicId,
  conceptName,
}) => {
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
          padding: "16px",
        }}
      >
        Select a node to preview its knowledge capsule content.
      </div>
    );
  }

  return (
    <div style={{ height: "100%" }}>
      <KnowledgeCapsule
        topicIdOverride={topicId}
        hideBackButton
        focusedConceptName={conceptName}
      />
    </div>
  );
};

export default KnowledgePanel;

import React, { useEffect, useMemo, useState } from "react";

import type { DatabaseNode } from "./types";

interface EdgeInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (firstNodeId: string, secondNodeId: string, relationshipType: string) => void;
  availableNodes: DatabaseNode[];
  initialFirstNodeId?: string;
  initialSecondNodeId?: string;
  initialRelationshipType?: string;
}

const EdgeInputModal: React.FC<EdgeInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  availableNodes,
  initialFirstNodeId,
  initialSecondNodeId,
  initialRelationshipType = "",
}) => {
  const [firstNodeId, setFirstNodeId] = useState<string>("");
  const [secondNodeId, setSecondNodeId] = useState<string>("");
  const [relationshipType, setRelationshipType] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFirstNodeId(initialFirstNodeId ?? "");
    setSecondNodeId(initialSecondNodeId ?? "");
    setRelationshipType(initialRelationshipType ?? "");
  }, [
    initialFirstNodeId,
    initialRelationshipType,
    initialSecondNodeId,
    isOpen,
  ]);

  const sortedNodes = useMemo(
    () =>
      [...availableNodes].sort((a, b) => a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      })),
    [availableNodes]
  );

  const handleSave = () => {
    const trimmedType = relationshipType.trim();
    const sourceId = firstNodeId.trim();
    const targetId = secondNodeId.trim();

    if (!sourceId || !targetId || sourceId === targetId) {
      return;
    }

    onSave(sourceId, targetId, trimmedType);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "24px",
          borderRadius: "12px",
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.35)",
          minWidth: "420px",
          maxWidth: "92vw",
          maxHeight: "80vh",
          overflowY: "auto",
          fontFamily: "'GlacialIndifference', sans-serif",
          color: "#0f172a",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
          Add New Relationship
        </h3>
        <p style={{ marginTop: "8px", fontSize: "12.5px", color: "#64748b" }}>
          Define the nodes you want to connect and the relationship type.
        </p>

        <div style={{ marginTop: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            First node *
          </label>
          <select
            value={firstNodeId}
            onChange={(event) => setFirstNodeId(event.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5f5",
              fontSize: "14px",
            }}
          >
            <option value="">Select a node</option>
            {sortedNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Second node *
          </label>
          <select
            value={secondNodeId}
            onChange={(event) => setSecondNodeId(event.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5f5",
              fontSize: "14px",
            }}
          >
            <option value="">Select a node</option>
            {sortedNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
          {firstNodeId && secondNodeId && firstNodeId === secondNodeId && (
            <div style={{ color: "#dc2626", fontSize: "11.5px", marginTop: "6px" }}>
              Please choose two different nodes.
            </div>
          )}
        </div>

        <div style={{ marginTop: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "6px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Relationship type
          </label>
          <input
            type="text"
            value={relationshipType}
            onChange={(event) => setRelationshipType(event.target.value)}
            placeholder="e.g. depends on, reinforces"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #cbd5f5",
              fontSize: "14px",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "#e2e8f0",
              color: "#0f172a",
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!firstNodeId || !secondNodeId || firstNodeId === secondNodeId}
            style={{
              border: "none",
              background:
                !firstNodeId || !secondNodeId || firstNodeId === secondNodeId
                  ? "#94a3b8"
                  : "#2563eb",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: "8px",
              fontWeight: 600,
              cursor:
                !firstNodeId || !secondNodeId || firstNodeId === secondNodeId
                  ? "not-allowed"
                  : "pointer",
              boxShadow:
                !firstNodeId || !secondNodeId || firstNodeId === secondNodeId
                  ? "none"
                  : "0 12px 26px rgba(37, 99, 235, 0.35)",
            }}
          >
            Save edge
          </button>
        </div>
      </div>
    </div>
  );
};

export default EdgeInputModal;


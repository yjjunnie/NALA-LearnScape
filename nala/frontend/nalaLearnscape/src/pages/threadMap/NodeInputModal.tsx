import React, { useEffect, useState } from "react";

import type { DatabaseNode, NodeModule } from "./types";

type NodeType = "concept" | "topic";

interface NodeInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    nodeName: string,
    nodeType: NodeType,
    nodeDescription: string,
    moduleId: string,
    parentNodeId?: string
  ) => void;
  availableNodes: DatabaseNode[];
  availableModules: NodeModule[];
}

const NodeInputModal: React.FC<NodeInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  availableNodes,
  availableModules,
}) => {
  const [nodeName, setNodeName] = useState<string>("");
  const [nodeType, setNodeType] = useState<NodeType>("concept");
  const [nodeDescription, setNodeDescription] = useState<string>("");
  const [moduleId, setModuleId] = useState<string>("");
  const [parentNodeId, setParentNodeId] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setNodeName("");
    setNodeDescription("");
    setParentNodeId("");

    const defaultModuleId = availableModules[0]?.module_id ?? "";
    setModuleId(defaultModuleId);
  }, [isOpen, availableModules]);

  const handleSave = () => {
    const trimmedName = nodeName.trim();
    const trimmedDescription = nodeDescription.trim();
    const selectedModuleId = moduleId || availableModules[0]?.module_id || "";

    if (!trimmedName || !selectedModuleId) {
      return;
    }

    if (nodeType === "concept" && parentNodeId) {
      const parentNode = availableNodes.find((node) => node.id === parentNodeId);
      if (parentNode && parentNode.module_id !== selectedModuleId) {
        return;
      }
    }

    onSave(
      trimmedName,
      nodeType,
      trimmedDescription,
      selectedModuleId,
      parentNodeId || undefined
    );
    setNodeName("");
    setNodeDescription("");
    setParentNodeId("");
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  const topicNodes = availableNodes.filter(
    (node) => node.type === "topic" && (!moduleId || node.module_id === moduleId)
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          minWidth: "400px",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "bold" }}
        >
          Add New Node
        </h3>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Node Name *
          </label>
          <input
            type="text"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            placeholder="Enter node name"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
            onKeyDown={handleKeyPress}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Node Description
          </label>
          <textarea
            value={nodeDescription}
            onChange={(e) => setNodeDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Node Type
          </label>
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value as NodeType)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            <option value="concept">Concept Node</option>
            <option value="topic">Topic Node</option>
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Module
          </label>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            {availableModules.map((module) => (
              <option key={module.module_id} value={module.module_id}>
                {module.module_name || `Module ${module.module_id}`} (
                {module.module_index || module.module_id})
              </option>
            ))}
          </select>
        </div>

        {nodeType === "concept" && (
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Parent Node (Optional)
            </label>
            <select
              value={parentNodeId}
              onChange={(e) => setParentNodeId(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              <option value="">No parent</option>
              {topicNodes.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              backgroundColor: "white",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 16px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "#4caf50",
              color: "white",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Save Node
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeInputModal;

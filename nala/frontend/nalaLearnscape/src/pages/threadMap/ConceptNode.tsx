import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";

import type { NodeData } from "./types";
import { nodeModules } from "./mockData";

interface ConceptNodeProps {
  data: NodeData;
  selected?: boolean;
}

const ConceptNode: React.FC<ConceptNodeProps> = ({ data, selected = false }) => {
  const size = data.node_type === "topic" ? 120 : 80;
  const fontSize = data.node_type === "topic" ? "16px" : "14px";

  const moduleInfo = nodeModules.find((m) => m.module_id === data.node_module_id);
  const moduleNumber = data.node_module_id.replace(/\D/g, "");

  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);

  const handleStyleBase: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: "6px",
    background: "transparent",
    border: "none",
    opacity: 0,
    pointerEvents: "auto",
    transition: "opacity 0.2s ease",
    cursor: "crosshair",
  };

  const getHandleStyle = (extra: React.CSSProperties): React.CSSProperties => ({
    ...handleStyleBase,
    ...extra,
  });

  const renderHandle = (
    id: string,
    type: "target" | "source",
    position: Position,
    extraStyle: React.CSSProperties,
    label: string
  ) => (
    <React.Fragment key={id}>
      <Handle
        id={id}
        type={type}
        position={position}
        style={getHandleStyle(extraStyle)}
        onMouseEnter={() => setHoveredHandle(id)}
        onMouseLeave={() => setHoveredHandle((prev) => (prev === id ? null : prev))}
      />
      <div
        style={{
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "26px",
          height: "26px",
          borderRadius: "6px",
          background: "rgba(0, 0, 0, 0.65)",
          color: "#fff",
          fontSize: "16px",
          fontWeight: 700,
          opacity: hoveredHandle === id ? 1 : 0,
          pointerEvents: "none",
          transition: "opacity 0.2s ease",
          ...extraStyle,
        }}
      >
        {label}
      </div>
    </React.Fragment>
  );

  return (
    <div className="relative">
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          backgroundColor: data.color || "#00bcd4",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: fontSize,
          fontWeight: "bold",
          textAlign: "center",
          cursor: "pointer",
          border: selected
            ? "3px solid #ff6b35"
            : "2px solid rgba(255,255,255,0.2)",
          boxShadow: selected
            ? "0 0 20px rgba(255,107,53,0.5)"
            : "0 4px 12px rgba(0,0,0,0.15)",
          transition: "all 0.2s ease",
          padding: "8px",
        }}
        title={`${data.node_name}${
          data.node_description ? "\n" + data.node_description : ""
        }\nModule: ${moduleInfo?.module_name || data.node_module_id}`}
      >
        <div
          style={{
            fontSize: data.node_type === "topic" ? "24px" : "18px",
            marginBottom: "4px",
          }}
        >
          {moduleNumber || "?"}
        </div>

        <div
          style={{
            fontSize: data.node_type === "topic" ? "11px" : "10px",
            lineHeight: "1.2",
            maxWidth: "90%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {data.node_name}
        </div>
        {renderHandle("target-top", "target", Position.Top, {
          top: 0,
          left: "35%",
          transform: "translate(-50%, -50%)",
        }, "+")}
        {renderHandle("target-bottom", "target", Position.Bottom, {
          bottom: 0,
          left: "35%",
          transform: "translate(-50%, 50%)",
        }, "+")}
        {renderHandle("target-left", "target", Position.Left, {
          left: 0,
          top: "35%",
          transform: "translate(-50%, -50%)",
        }, "+")}
        {renderHandle("target-right", "target", Position.Right, {
          right: 0,
          top: "35%",
          transform: "translate(50%, -50%)",
        }, "+")}
        {renderHandle("source-top", "source", Position.Top, {
          top: 0,
          right: "35%",
          transform: "translate(50%, -50%)",
        }, "+")}
        {renderHandle("source-bottom", "source", Position.Bottom, {
          bottom: 0,
          right: "35%",
          transform: "translate(50%, 50%)",
        }, "+")}
        {renderHandle("source-left", "source", Position.Left, {
          left: 0,
          bottom: "35%",
          transform: "translate(-50%, 50%)",
        }, "+")}
        {renderHandle("source-right", "source", Position.Right, {
          right: 0,
          bottom: "35%",
          transform: "translate(50%, 50%)",
        }, "+")}
      </div>
    </div>
  );
};

export default ConceptNode;

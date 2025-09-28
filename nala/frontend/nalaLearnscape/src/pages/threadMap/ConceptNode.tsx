import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";

import type { NodeData } from "./types";
import { nodeModules } from "./mockData";

interface ConceptNodeProps {
  data: NodeData;
  selected?: boolean;
}

const ConceptNode: React.FC<ConceptNodeProps> = ({
  data,
  selected = false,
}) => {
  const size = data.node_type === "topic" ? 120 : 80;
  const fontSize = data.node_type === "topic" ? "16px" : "14px";

  const moduleInfo = nodeModules.find(
    (m) => m.module_id === data.node_module_id
  );
  const moduleNumber = moduleInfo?.module_id;

  // State to track which handle is hovered
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
        onMouseLeave={() =>
          setHoveredHandle((prev) => (prev === id ? null : prev))
        }
      />
      <div
        style={{
          fontFamily: "GlacialIndifference, sans-serif",
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

  const circleSize = `${size}px`;
  const nameStyles: React.CSSProperties = {
    marginTop: "10px",
    textAlign: "center",
    color: "#1f2937",
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: data.node_type === "topic" ? 700 : 600,
    fontSize: data.node_type === "topic" ? "16px" : "13px",
    lineHeight: 1.25,
    maxWidth: circleSize,
    wordBreak: "normal", // Avoid breaking words
    overflowWrap: "break-word", // Allow wrapping of long words when necessary
    whiteSpace: "normal", // Allow text to wrap to the next line if needed
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: "50%",
          backgroundColor: data.color || "#00bcd4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: fontSize,
          fontWeight: "bold",
          textAlign: "center",
          cursor: "pointer",
          borderStyle: "solid",
          borderWidth: 3,
          borderColor: selected ? "#ff6b35" : "rgba(255,255,255,0.35)",
          boxShadow: selected
            ? "0 0 20px rgba(255,107,53,0.4)"
            : "0 4px 12px rgba(0,0,0,0.15)",
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
        }}
        title={`${data.node_name}${
          data.node_description
            ? "\n Description: " + data.node_description
            : ""
        }\nModule: ${moduleInfo?.module_name || data.node_module_id}`}
      >
        <div
          style={{
            padding: "12px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              fontSize: data.node_type === "topic" ? "24px" : "18px",
              fontWeight: 700,
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
          ></div>
        </div>
        {renderHandle(
          "target-top",
          "target",
          Position.Top,
          {
            top: 0,
            left: "50%",
            transform: "translate(-50%, -50%)",
          },
          "+"
        )}
        {renderHandle(
          "target-bottom",
          "target",
          Position.Bottom,
          {
            bottom: 0,
            left: "50%",
            transform: "translate(-50%, 50%)",
          },
          "+"
        )}
        {renderHandle(
          "target-left",
          "target",
          Position.Left,
          {
            left: 0,
            top: "50%",
            transform: "translate(-50%, -50%)",
          },
          "+"
        )}
        {renderHandle(
          "target-right",
          "target",
          Position.Right,
          {
            right: 0,
            top: "50%",
            transform: "translate(50%, -50%)",
          },
          "+"
        )}
        {renderHandle(
          "source-top",
          "source",
          Position.Top,
          {
            top: 0,
            left: "50%",
            transform: "translate(-50%, -50%)",
          },
          "+"
        )}
        {renderHandle(
          "source-bottom",
          "source",
          Position.Bottom,
          {
            bottom: 0,
            left: "50%",
            transform: "translate(-50%, 50%)",
          },
          "+"
        )}
        {renderHandle(
          "source-left",
          "source",
          Position.Left,
          {
            left: 0,
            top: "50%",
            transform: "translate(-50%, -50%)",
          },
          "+"
        )}
        {renderHandle(
          "source-right",
          "source",
          Position.Right,
          {
            right: 0,
            top: "50%",
            transform: "translate(50%, -50%)",
          },
          "+"
        )}
      </div>
      <div style={nameStyles}>{data.node_name}</div>
    </div>
  );
};

export default ConceptNode;

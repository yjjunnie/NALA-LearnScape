import React, { useState } from "react";
import { Handle, Position } from "@xyflow/react";

import { CONCEPT_NODE_DIAMETER, TOPIC_NODE_DIAMETER } from "./constants";
import type { NodeData } from "./types";

interface ConceptNodeProps {
  data: NodeData;
  selected?: boolean;
}

const ConceptNode: React.FC<ConceptNodeProps> = ({
  data,
  selected = false,
}) => {
  const isTopic = data.node_type === "topic";
  const diameter = isTopic ? TOPIC_NODE_DIAMETER : CONCEPT_NODE_DIAMETER;
  const fontSize = isTopic ? "18px" : "14px";

  const bloomLevelNumber =
    typeof data.bloom_level_numeric === "number"
      ? data.bloom_level_numeric
      : null;
  const bloomLevelLabel =
    typeof data.bloom_level_label === "string"
      ? data.bloom_level_label
      : null;
  const showModuleBadge = isTopic;

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

  const circleSize = `${diameter}px`;
  const topicNameStyles: React.CSSProperties = {
    marginTop: "10px",
    textAlign: "center",
    color: "#1f2937",
    fontFamily: '"Fredoka", sans-serif',
    fontWeight: isTopic ? 700 : 600,
    fontSize: isTopic ? "20px" : "14px",
    lineHeight: 1.3,
    maxWidth: circleSize,
    wordBreak: "normal", // Avoid breaking words
    overflowWrap: "break-word", // Allow wrapping of long words when necessary
    whiteSpace: "normal", // Allow text to wrap to the next line if needed
  };
  const conceptLabelContainerStyles: React.CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    color: "#ffffff",
    fontFamily: '"GlacialIndifference", sans-serif',
    fontWeight: 600,
    fontSize: "14px",
    lineHeight: 1.35,
    textAlign: "center",
    pointerEvents: "none",
  };
  const conceptLabelTextStyles: React.CSSProperties = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 4,
    WebkitBoxOrient: "vertical",
    width: "100%",
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
          borderColor: selected ? "#ef4444" : "rgba(255,255,255,0.35)",
          transition:
            "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
          boxShadow: selected
            ? "0 0 0 3px rgba(239, 68, 68, 0.45), 0 16px 30px rgba(15, 23, 42, 0.22)"
            : "0 12px 22px rgba(15, 23, 42, 0.12)",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          padding: 0,
        }}
        title={`${data.node_name}${
          data.node_description
            ? "\n Description: " + data.node_description
            : ""
        }\nModule: ${data.node_module_name || data.node_module_id}${
          isTopic
            ? `\nBloom level: ${
                bloomLevelLabel
                  ? `${bloomLevelLabel} (${bloomLevelNumber ?? "?"})`
                  : "Unclassified"
              }`
            : ""
        }`}
      >
        {showModuleBadge ? (
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
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              {bloomLevelNumber ?? "?"}
            </div>
          </div>
        ) : (
          <div style={conceptLabelContainerStyles} title={data.node_name}>
            <span style={conceptLabelTextStyles}>{data.node_name}</span>
          </div>
        )}
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
      {isTopic && (
        <div style={topicNameStyles}>
          <div>{data.node_name}</div>
          <div
            style={{
              fontSize: "14px",
              color: "#475569",
              fontWeight: 500,
              marginTop: "4px",
            }}
          >
            {bloomLevelLabel
              ? `${bloomLevelLabel} (${bloomLevelNumber ?? "?"})`
              : "Not classified"}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConceptNode;

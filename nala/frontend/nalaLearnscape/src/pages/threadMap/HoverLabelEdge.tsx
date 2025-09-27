import React, { useMemo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getStraightPath,
  useReactFlow,
} from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";

const HoverLabelEdge: React.FC<EdgeProps> = (props) => {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style,
    markerEnd,
    data,
  } = props;

  const { getEdges } = useReactFlow();
  const edges = getEdges();

  const parallelEdges = useMemo(
    () =>
      edges.filter(
        (edge) =>
          (edge.source === source && edge.target === target) ||
          (edge.source === target && edge.target === source)
      ),
    [edges, source, target, sourceX, sourceY, targetX, targetY]
  );

  const parallelIndex = parallelEdges.findIndex((edge) => edge.id === id);
  const offsetStep = 18;
  const offsetAmount =
    parallelEdges.length > 1
      ? (parallelIndex - (parallelEdges.length - 1) / 2) * offsetStep
      : 0;

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.hypot(dx, dy) || 1;

  const offsetX = (-dy / length) * offsetAmount;
  const offsetY = (dx / length) * offsetAmount;

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX: sourceX + offsetX,
    sourceY: sourceY + offsetY,
    targetX: targetX + offsetX,
    targetY: targetY + offsetY,
  });

  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <BaseEdge path={edgePath} style={style} markerEnd={markerEnd} />
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {isHovered &&
        typeof data?.label === "string" &&
        data.label.trim() !== "" && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                pointerEvents: "none",
                background: "rgba(0, 0, 0, 0.75)",
                color: "#fff",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "10px",
                whiteSpace: "nowrap",
              }}
            >
              {data.label}
            </div>
          </EdgeLabelRenderer>
        )}
    </>
  );
};

export default HoverLabelEdge;

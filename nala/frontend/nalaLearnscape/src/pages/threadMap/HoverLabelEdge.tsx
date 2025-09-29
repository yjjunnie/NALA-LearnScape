import React, { useMemo, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  Position,
  useReactFlow,
} from "@xyflow/react";
import type { EdgeProps, XYPosition } from "@xyflow/react";
import type { FlowEdge, FlowNode } from "./types";

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

  const { getEdges, getNode } = useReactFlow<FlowNode, FlowEdge>();
  const edges = getEdges();

  const sourceNode = getNode(source);
  const targetNode = getNode(target);

  type ExtendedNode = FlowNode & {
    width?: number | null;
    height?: number | null;
    position?: XYPosition;
    positionAbsolute?: XYPosition;
    measured?: {
      width?: number;
      height?: number;
    };
  };

  const getNodeMetrics = (node?: FlowNode | null) => {
    if (!node) {
      return null;
    }

    const extended = node as ExtendedNode;
    const measured = extended.measured;
    const width = (measured?.width ?? extended.width ?? 0) as number;
    const height = (measured?.height ?? extended.height ?? 0) as number;
    const position = (extended.positionAbsolute ??
      extended.position ?? { x: 0, y: 0 }) as {
      x: number;
      y: number;
    };

    const centerX = position.x + width / 2;
    const centerY = position.y + height / 2;
    const radius = Math.min(width, height) / 2;

    return { centerX, centerY, radius };
  };

  const sourceMetrics = getNodeMetrics(sourceNode);
  const targetMetrics = getNodeMetrics(targetNode);

  const getCircleAnchor = (
    metrics: ReturnType<typeof getNodeMetrics>,
    otherMetrics: ReturnType<typeof getNodeMetrics>,
    fallbackX: number,
    fallbackY: number
  ) => {
    if (!metrics || !otherMetrics || metrics.radius === 0) {
      return { x: fallbackX, y: fallbackY };
    }

    const dx = otherMetrics.centerX - metrics.centerX;
    const dy = otherMetrics.centerY - metrics.centerY;
    const distance = Math.hypot(dx, dy);

    if (!distance) {
      return { x: metrics.centerX, y: metrics.centerY };
    }

    const ratio = metrics.radius / distance;

    return {
      x: metrics.centerX + dx * ratio,
      y: metrics.centerY + dy * ratio,
    };
  };

  const rawSourcePoint = getCircleAnchor(
    sourceMetrics,
    targetMetrics,
    sourceX,
    sourceY
  );
  const rawTargetPoint = getCircleAnchor(
    targetMetrics,
    sourceMetrics,
    targetX,
    targetY
  );

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
  const offsetStep = 26;
  const offsetAmount =
    parallelEdges.length > 1
      ? (parallelIndex - (parallelEdges.length - 1) / 2) * offsetStep
      : 0;

  const dx = rawTargetPoint.x - rawSourcePoint.x;
  const dy = rawTargetPoint.y - rawSourcePoint.y;
  const length = Math.hypot(dx, dy) || 1;

  const offsetX = (-dy / length) * offsetAmount;
  const offsetY = (dx / length) * offsetAmount;

  const dominantAxisIsHorizontal = Math.abs(dx) >= Math.abs(dy);
  const sourcePosition = dominantAxisIsHorizontal
    ? dx >= 0
      ? Position.Right
      : Position.Left
    : dy >= 0
    ? Position.Bottom
    : Position.Top;
  const targetPosition = dominantAxisIsHorizontal
    ? dx >= 0
      ? Position.Left
      : Position.Right
    : dy >= 0
    ? Position.Top
    : Position.Bottom;

  const curvature = Math.min(0.6, 0.35 + Math.abs(offsetAmount) / 160);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: rawSourcePoint.x + offsetX,
    sourceY: rawSourcePoint.y + offsetY,
    sourcePosition,
    targetX: rawTargetPoint.x + offsetX,
    targetY: rawTargetPoint.y + offsetY,
    targetPosition,
    curvature,
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

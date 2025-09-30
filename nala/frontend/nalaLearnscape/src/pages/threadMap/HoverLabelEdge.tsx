import React, { useMemo, useState } from "react";
import { BaseEdge, EdgeLabelRenderer, useReactFlow } from "@xyflow/react";
import type { EdgeProps, XYPosition } from "@xyflow/react";

import { CONCEPT_BASE_RADIUS, TOPIC_BASE_RADIUS } from "./constants";
import type { FlowEdge, FlowNode, NodeData } from "./types";

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
    markerStart,
    data,
    selected,
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
    const nodeData = (extended.data ?? null) as NodeData | null;
    const measuredRadius = Math.min(width, height) / 2;
    const fallbackRadius =
      nodeData?.node_type === "topic" ? TOPIC_BASE_RADIUS : CONCEPT_BASE_RADIUS;
    const radius = Math.max(measuredRadius, fallbackRadius);

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
    [edges, source, target]
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

  const startPoint = {
    x: rawSourcePoint.x + offsetX,
    y: rawSourcePoint.y + offsetY,
  };
  const endPoint = {
    x: rawTargetPoint.x + offsetX,
    y: rawTargetPoint.y + offsetY,
  };

  const edgePath = `M ${startPoint.x},${startPoint.y} L ${endPoint.x},${endPoint.y}`;
  const labelX = (startPoint.x + endPoint.x) / 2;
  const labelY = (startPoint.y + endPoint.y) / 2;

  const [isHovered, setIsHovered] = useState(false);

  const showLabelFromNodeHover =
    typeof data === "object" && data !== null
      ? Boolean((data as { showLabel?: boolean }).showLabel)
      : false;
  const labelText =
    typeof data?.label === "string"
      ? data.label
      : typeof data?.label === "number"
      ? String(data.label)
      : "";
  const hasLabel = labelText.trim() !== "";
  const shouldRenderLabel =
    hasLabel && (isHovered || showLabelFromNodeHover || Boolean(selected));

  return (
    <>
      <BaseEdge
        path={edgePath}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
        interactionWidth={48}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {shouldRenderLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
              background: "rgba(15, 23, 42, 0.92)",
              color: "#f8fafc",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              whiteSpace: "nowrap",
              boxShadow: "0 8px 16px rgba(15, 23, 42, 0.3)",
              fontFamily: '"GlacialIndifference", sans-serif',
            }}
          >
            {labelText}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default HoverLabelEdge;

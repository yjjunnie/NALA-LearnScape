import type { XYPosition } from "@xyflow/react";

import {
  CLUSTER_GAP,
  CLUSTER_MAX_OFFSET,
  CONCEPT_BASE_RADIUS,
  TOPIC_BASE_RADIUS,
} from "./constants";
import type { FlowNode } from "./types";

export const getNodeRadius = (node: FlowNode): number => {
  const type = node.data?.node_type;
  return type === "topic" ? TOPIC_BASE_RADIUS : CONCEPT_BASE_RADIUS;
};

export const estimateNodeLabelSize = (node: FlowNode) => {
  const label = node.data?.node_name ?? "";
  const sanitized = label.trim();
  if (!sanitized) {
    return { width: 96, height: 56 };
  }

  const words = sanitized.split(/\s+/);
  const maxCharsPerLine = 14;
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    if (!currentLine) {
      currentLine = word;
      return;
    }

    const candidate = `${currentLine} ${word}`;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  const longestLine = lines.reduce(
    (max, line) => Math.max(max, line.length),
    0
  );
  const width = Math.min(240, Math.max(110, longestLine * 8.2 + 32));
  const height = Math.min(220, Math.max(60, lines.length * 24 + 36));

  return { width, height };
};

export const getNodeLayoutRadius = (node: FlowNode): number => {
  const baseRadius = getNodeRadius(node);
  if (node.data?.node_type !== "topic") {
    return baseRadius;
  }

  const labelSize = estimateNodeLabelSize(node);
  const labelPadding = Math.max(48, labelSize.height * 0.75);
  return baseRadius + labelPadding;
};

const centerNodesAroundCentroid = (
  nodes: FlowNode[],
  center: XYPosition = { x: 0, y: 0 }
): FlowNode[] => {
  if (nodes.length === 0) {
    return nodes;
  }

  const sum = nodes.reduce(
    (acc, node) => {
      const x = node.position?.x ?? 0;
      const y = node.position?.y ?? 0;
      return { x: acc.x + x, y: acc.y + y };
    },
    { x: 0, y: 0 }
  );

  const centroid = {
    x: sum.x / nodes.length,
    y: sum.y / nodes.length,
  };

  if (
    Math.abs(centroid.x - center.x) < 1 &&
    Math.abs(centroid.y - center.y) < 1
  ) {
    return nodes;
  }

  return nodes.map((node) => {
    const position = node.position ?? { x: 0, y: 0 };
    return {
      ...node,
      position: {
        x: position.x - centroid.x + center.x,
        y: position.y - centroid.y + center.y,
      },
    };
  });
};

export const resolveNodeCollisions = (
  nodes: FlowNode[],
  lockedNodeId?: string
): FlowNode[] => {
  const resolvedNodes = nodes.map((node) => ({
    ...node,
    position: {
      x: node.position?.x ?? 0,
      y: node.position?.y ?? 0,
    },
  }));

  const maxIterations = 6;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    let moved = false;

    for (let i = 0; i < resolvedNodes.length; i += 1) {
      for (let j = i + 1; j < resolvedNodes.length; j += 1) {
        const nodeA = resolvedNodes[i];
        const nodeB = resolvedNodes[j];

        const ax = nodeA.position?.x ?? 0;
        const ay = nodeA.position?.y ?? 0;
        const bx = nodeB.position?.x ?? 0;
        const by = nodeB.position?.y ?? 0;

        const dx = bx - ax;
        const dy = by - ay;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const labelSizeA = estimateNodeLabelSize(nodeA);
        const labelSizeB = estimateNodeLabelSize(nodeB);
        const effectiveRadiusA = Math.max(
          getNodeLayoutRadius(nodeA) + 16,
          labelSizeA.width / 2 + 20,
          labelSizeA.height / 2 + 20
        );
        const effectiveRadiusB = Math.max(
          getNodeLayoutRadius(nodeB) + 16,
          labelSizeB.width / 2 + 20,
          labelSizeB.height / 2 + 20
        );
        const minDistance = effectiveRadiusA + effectiveRadiusB;

        if (distance === 0) {
          const jitter = 0.5;
          resolvedNodes[i] = {
            ...nodeA,
            position: { x: ax - jitter, y: ay - jitter },
          };
          resolvedNodes[j] = {
            ...nodeB,
            position: { x: bx + jitter, y: by + jitter },
          };
          moved = true;
          continue;
        }

        if (distance >= minDistance) {
          continue;
        }

        const overlap = (minDistance - distance) / 2;
        const normX = dx / distance;
        const normY = dy / distance;

        if (lockedNodeId) {
          if (nodeA.id === lockedNodeId && nodeB.id !== lockedNodeId) {
            resolvedNodes[j] = {
              ...nodeB,
              position: {
                x: bx + normX * overlap * 2,
                y: by + normY * overlap * 2,
              },
            };
            moved = true;
            continue;
          }

          if (nodeB.id === lockedNodeId && nodeA.id !== lockedNodeId) {
            resolvedNodes[i] = {
              ...nodeA,
              position: {
                x: ax - normX * overlap * 2,
                y: ay - normY * overlap * 2,
              },
            };
            moved = true;
            continue;
          }
        }

        resolvedNodes[i] = {
          ...nodeA,
          position: {
            x: ax - normX * overlap,
            y: ay - normY * overlap,
          },
        };
        resolvedNodes[j] = {
          ...nodeB,
          position: {
            x: bx + normX * overlap,
            y: by + normY * overlap,
          },
        };
        moved = true;
      }
    }

    if (!moved) {
      break;
    }
  }

  return resolvedNodes;
};

export const keepConceptsNearParent = (nodes: FlowNode[]): FlowNode[] => {
  const nodeLookup = new Map(nodes.map((node) => [node.id, node]));

  return nodes.map((node) => {
    if (node.data?.node_type !== "concept" || !node.data.parent_node_id) {
      return node;
    }

    const parent = nodeLookup.get(String(node.data.parent_node_id));
    if (!parent) {
      return node;
    }

    const parentPosition = parent.position ?? { x: 0, y: 0 };
    const nodePosition = node.position ?? { x: 0, y: 0 };

    const dx = nodePosition.x - parentPosition.x;
    const dy = nodePosition.y - parentPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;

    const parentRadius = getNodeLayoutRadius(parent);
    const minDistance = parentRadius + CONCEPT_BASE_RADIUS + CLUSTER_GAP;
    const maxDistance = parentRadius + CONCEPT_BASE_RADIUS + CLUSTER_MAX_OFFSET;

    if (distance >= minDistance && distance <= maxDistance) {
      return node;
    }

    const clampedDistance = Math.min(Math.max(distance, minDistance), maxDistance);
    const scale = clampedDistance / distance;

    return {
      ...node,
      position: {
        x: parentPosition.x + dx * scale,
        y: parentPosition.y + dy * scale,
      },
    };
  });
};

export const adjustNodePositions = (
  nodes: FlowNode[],
  options: { lockedNodeId?: string; center?: XYPosition } = {}
): FlowNode[] => {
  const withoutCollisions = resolveNodeCollisions(nodes, options.lockedNodeId);
  const clustered = keepConceptsNearParent(withoutCollisions);
  return centerNodesAroundCentroid(clustered, options.center);
};


import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  applyNodeChanges,
} from "@xyflow/react";
import type {
  OnConnect,
  NodeMouseHandler,
  ReactFlowInstance,
  XYPosition,
  OnMove,
  Viewport,
  EdgeMouseHandler,
  OnConnectStart,
  OnConnectEnd,
  NodeChange,
  OnNodeDrag,
} from "@xyflow/react";
import * as d3 from "d3";
import {
  ChevronDown,
  ChevronUp,
  Hand,
  Info,
  Maximize2,
  Minimize2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import "@xyflow/react/dist/style.css";
import "../App.css";
import type {
  FlowNode,
  FlowEdge,
  NodeData,
  DatabaseNode,
  DatabaseRelationship,
  HoverNode,
} from "./threadMap/types";
import {
  getColorForModule,
  getTopicColor,
  generateDistinctTopicColor,
} from "./threadMap/colorUtils";
import ConceptNode from "./threadMap/ConceptNode";
import NodeInputModal from "./threadMap/NodeInputModal";
import HoverLabelEdge from "./threadMap/HoverLabelEdge";
import AddNodeHover from "./threadMap/AddNodeHover";
import TopicTaxonomyProgression from "../components/TopicTaxonomyProgression";
import { useThreadMapData } from "./threadMap/hooks/useThreadMapData";
import {
  CLUSTER_GAP,
  CLUSTER_MAX_OFFSET,
  CONCEPT_BASE_RADIUS,
  TOPIC_BASE_RADIUS,
} from "./threadMap/constants";

type RawDatabaseNode = {
  id: number | string;
  type?: string | null;
  name?: string | null;
  summary?: string | null;
  related_topic?: number | string | null;
  module_id?: number | string | null;
};

type RawDatabaseRelationship = {
  id: number | string;
  first_node?: number | string | null;
  second_node?: number | string | null;
  rs_type?: string | null;
};

type RawModuleResponse = {
  id?: number | string | null;
  index?: number | string | null;
  name?: string | null;
};

interface ThreadMapProps {
  module_id?: string;
}

const LONG_PRESS_MS = 320;

const getNodeRadius = (node: FlowNode): number => {
  const type = node.data?.node_type;
  return type === "topic" ? TOPIC_BASE_RADIUS : CONCEPT_BASE_RADIUS;
};

const estimateNodeLabelSize = (node: FlowNode) => {
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

const resolveNodeCollisions = (
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
          getNodeRadius(nodeA) + 16,
          labelSizeA.width / 2 + 20,
          labelSizeA.height / 2 + 20
        );
        const effectiveRadiusB = Math.max(
          getNodeRadius(nodeB) + 16,
          labelSizeB.width / 2 + 20,
          labelSizeB.height / 2 + 20
        );
        const minDistance = effectiveRadiusA + effectiveRadiusB;
        0;

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

const keepConceptsNearParent = (nodes: FlowNode[]): FlowNode[] => {
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

    const parentRadius = getNodeRadius(parent);
    const minDistance = parentRadius + CONCEPT_BASE_RADIUS + CLUSTER_GAP;
    const maxDistance = parentRadius + CONCEPT_BASE_RADIUS + CLUSTER_MAX_OFFSET;

    if (distance >= minDistance && distance <= maxDistance) {
      return node;
    }

    const clampedDistance = Math.min(
      Math.max(distance, minDistance),
      maxDistance
    );
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

const adjustNodePositions = (
  nodes: FlowNode[],
  options: { lockedNodeId?: string; center?: XYPosition } = {}
): FlowNode[] => {
  const withoutCollisions = resolveNodeCollisions(nodes, options.lockedNodeId);
  const clustered = keepConceptsNearParent(withoutCollisions);
  return centerNodesAroundCentroid(clustered, options.center);
};

const ThreadMap: React.FC<ThreadMapProps> = ({ module_id }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const activeModuleId = useMemo(() => {
    if (module_id && module_id.trim().length > 0) {
      return module_id.trim();
    }

    const urlModuleId =
      searchParams.get("module_id") ?? searchParams.get("module") ?? "";
    return urlModuleId;
  }, [module_id, searchParams]);
  const nodeTypes = useMemo(
    () => ({ conceptNode: ConceptNode, topicNode: ConceptNode }),
    []
  );
  const edgeTypes = useMemo(() => ({ hoverLabel: HoverLabelEdge }), []);
  const [nodes, setNodes, _onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const {
    dbNodes,
    setDbNodes,
    dbRelationships,
    setDbRelationships,
    moduleLookup,
    setModuleLookup,
    availableModules,
    err,
  } = useThreadMapData(activeModuleId);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  //const [showEdges, setShowEdges] = useState<boolean>(false);
  const [controlPosition, setControlPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 24, y: 24 });
  const [isDraggingControl, setIsDraggingControl] = useState(false);

  const [activePopup, setActivePopup] = useState<{
    nodeId: string;
    expanded: boolean;
  } | null>(null);
  const [hoverNode, setHoverNode] = useState<HoverNode>({
    flowPosition: { x: 0, y: 0 },
    screenPosition: { x: 0, y: 0 },
    visible: false,
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [interactionMode, setInteractionMode] = useState<"cursor" | "add-node">(
    "cursor"
  );
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);
  const [pendingNodePosition, setPendingNodePosition] =
    useState<XYPosition | null>(null);
  const [reactFlowInstance, setReactFlowInstanceState] =
    useState<ReactFlowInstance<FlowNode, FlowEdge> | null>(null);
  const reactFlowInstanceRef = useRef<ReactFlowInstance<
    FlowNode,
    FlowEdge
  > | null>(null);
  const fitViewRafRef = useRef<number | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [isAddingEdge, setIsAddingEdge] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const isStandaloneView = useMemo(
    () => location.pathname.toLowerCase().includes("threadmap"),
    [location.pathname]
  );
  const deleteSelectionLabel = selectedNode
    ? "Delete Selected Node"
    : selectedEdge
    ? "Delete Selected Edge"
    : "";
  const editToggleLabel = isEditMode
    ? "Switch to move mode"
    : "Switch to edit mode";
  const [showConceptParentEdges, setShowConceptParentEdges] =
    useState<boolean>(true);
  const [edgeTypeFilter, setEdgeTypeFilter] = useState<string>("all");
  const edgeTypeOptions = useMemo(() => {
    const types = new Set<string>();
    dbRelationships.forEach((relationship) => {
      const type = relationship.rs_type?.trim();
      if (type) {
        types.add(type);
      }
    });
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  }, [dbRelationships]);
  const displayedEdges = useMemo(() => {
    const baseEdges =
      edgeTypeFilter === "all"
        ? edges
        : edges.filter((edge) => {
            const rsType =
              typeof edge.data === "object" && edge.data !== null
                ? (edge.data as Record<string, unknown>).rsType
                : undefined;
            if (typeof rsType !== "string" || rsType.trim().length === 0) {
              return true;
            }
            return rsType.trim() === edgeTypeFilter;
          });

    if (showConceptParentEdges) {
      return baseEdges;
    }

    const nodeLookup = new Map(nodes.map((node) => [node.id, node]));

    return baseEdges.filter((edge) => {
      const sourceNode = nodeLookup.get(edge.source);
      const targetNode = nodeLookup.get(edge.target);
      if (!sourceNode || !targetNode) {
        return true;
      }

      const sourceType = sourceNode.data?.node_type;
      const targetType = targetNode.data?.node_type;
      const sourceParent = sourceNode.data?.parent_node_id;
      const targetParent = targetNode.data?.parent_node_id;

      const isConceptParentConnection =
        (sourceType === "topic" &&
          targetType === "concept" &&
          targetParent === sourceNode.id) ||
        (targetType === "topic" &&
          sourceType === "concept" &&
          sourceParent === targetNode.id);

      if (isConceptParentConnection) {
        return false;
      }

      if (edge.id.startsWith("topic-concept-")) {
        return false;
      }

      return true;
    });
  }, [edgeTypeFilter, edges, nodes, showConceptParentEdges]);
  const activeModuleInfo = activeModuleId
    ? moduleLookup[activeModuleId]
    : undefined;
  const taxonomyModuleFilter = useMemo(() => {
    if (!isStandaloneView || !activeModuleId) {
      return undefined;
    }

    if (activeModuleInfo?.module_name) {
      return activeModuleInfo.module_name;
    }

    if (activeModuleInfo?.module_id) {
      return activeModuleInfo.module_id;
    }

    return activeModuleId;
  }, [activeModuleId, activeModuleInfo, isStandaloneView]);
  const taxonomyModuleDisplay = useMemo(() => {
    if (!isStandaloneView || !activeModuleId) {
      return null;
    }

    if (!activeModuleInfo) {
      return activeModuleId;
    }

    const parts: string[] = [];
    if (activeModuleInfo.module_index) {
      parts.push(String(activeModuleInfo.module_index));
    }
    if (activeModuleInfo.module_name) {
      parts.push(activeModuleInfo.module_name);
    }

    const composed = parts.join(" • ").trim();
    if (composed) {
      return composed;
    }

    return (
      activeModuleInfo.module_name ??
      activeModuleInfo.module_id ??
      activeModuleId
    );
  }, [activeModuleId, activeModuleInfo, isStandaloneView]);
  const [isTaxonomyCollapsed, setIsTaxonomyCollapsed] = useState(true);
  const [taxonomyPosition, setTaxonomyPosition] = useState({ x: 24, y: 120 });
  const [isDraggingTaxonomy, setIsDraggingTaxonomy] = useState(false);

  const handleInit = useCallback(
    (instance: ReactFlowInstance<FlowNode, FlowEdge>) => {
      reactFlowInstanceRef.current = instance;
      setReactFlowInstanceState(instance);

      if (fitViewRafRef.current) {
        cancelAnimationFrame(fitViewRafRef.current);
      }

      fitViewRafRef.current = requestAnimationFrame(() => {
        instance.fitView({ padding: 0.35, duration: 400 });
        fitViewRafRef.current = null;
      });
    },
    []
  );

  // Popup state for drag and resize
  const [popupPosition, setPopupPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [popupSize, setPopupSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [isDraggingPopup, setIsDraggingPopup] = useState(false);
  const [isResizingPopup, setIsResizingPopup] = useState(false);
  const [dragStart, setDragStart] = useState<{
    x: number;
    y: number;
    popupX: number;
    popupY: number;
  } | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // Refs for simulation management
  const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null); // Holds the D3 simulation instance for managing node layout with forces
  const containerRef = useRef<HTMLDivElement>(null); // A reference to the DOM element that contains the flowchart
  const pendingNodePositionRef = useRef<XYPosition | null>(null); // Holds the pending position for a new node (before it’s added)
  const shouldRunSimulationRef = useRef<boolean>(false); //A flag indicating whether the D3 simulation should run to adjust node positions
  const controlDragStartRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const controlDraggedRef = useRef<boolean>(false);
  const dragContextRef = useRef<{
    nodeId: string;
    offsets: Map<string, { dx: number; dy: number }>;
  } | null>(null);
  const taxonomyDragStartRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const pointerPressRef = useRef<{ nodeId: string | null; time: number }>({
    nodeId: null,
    time: 0,
  });
  const allowNodeDragRef = useRef<boolean>(false);

  const getLayoutCenter = useCallback((): XYPosition => {
    const width = containerRef.current?.clientWidth ?? 800;
    const height = containerRef.current?.clientHeight ?? 600;
    return { x: width / 2, y: height / 2 };
  }, []);

  const adjacencyMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    edges.forEach((edge) => {
      const { source, target } = edge;
      if (!map.has(source)) {
        map.set(source, new Set());
      }
      if (!map.has(target)) {
        map.set(target, new Set());
      }
      map.get(source)!.add(target);
      map.get(target)!.add(source);
    });
    return map;
  }, [edges]);

  useEffect(() => {
    dragContextRef.current = null;
  }, [edges]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const nodeElement = target?.closest(".react-flow__node");
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute("data-id");
        pointerPressRef.current = {
          nodeId,
          time: Date.now(),
        };
      } else {
        pointerPressRef.current = { nodeId: null, time: 0 };
      }
    };

    const handlePointerUp = () => {
      pointerPressRef.current = { nodeId: null, time: 0 };
      allowNodeDragRef.current = false;
    };

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointerleave", handlePointerUp);

    return () => {
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointerleave", handlePointerUp);
    };
  }, []);

  const popupNode = useMemo(
    // Calculate and memoize the node that is associated with the activePopup
    () =>
      activePopup
        ? nodes.find((node) => node.id === activePopup.nodeId) ?? null
        : null,
    [activePopup, nodes]
  );

  const popupLayout = useMemo(() => {
    if (!activePopup || !reactFlowInstance || !containerRef.current)
      return null;

    const nodeInternals = reactFlowInstance.getNode(activePopup.nodeId); // Retrieve information about the node in the flowchart
    if (!nodeInternals) return null;

    const bounds = containerRef.current.getBoundingClientRect();
    const measured = (nodeInternals as any).measured;
    const nodeWidth = measured?.width ?? nodeInternals.width ?? 0;
    const nodeHeight = measured?.height ?? nodeInternals.height ?? 0;
    const absolutePosition = (nodeInternals as any).positionAbsolute ??
      nodeInternals.position ?? { x: 0, y: 0 };

    const centerX = absolutePosition.x + nodeWidth / 2;
    const centerY = absolutePosition.y + nodeHeight / 2;
    const screenPosition = reactFlowInstance.flowToScreenPosition({
      x: centerX,
      y: centerY,
    });

    const anchorX = screenPosition.x - bounds.left;
    const anchorY = screenPosition.y - bounds.top;
    const collapsedSize = { width: 420, height: 320 };
    const margin = 16;

    const collapsedLeft = Math.min(
      Math.max(anchorX + 24, margin),
      bounds.width - collapsedSize.width - margin
    );
    const collapsedTop = Math.min(
      Math.max(anchorY - collapsedSize.height / 2, margin),
      bounds.height - collapsedSize.height - margin
    );

    return {
      anchorX,
      anchorY,
      collapsedLeft,
      collapsedTop,
      collapsedWidth: collapsedSize.width,
      collapsedHeight: collapsedSize.height,
      containerWidth: bounds.width,
      containerHeight: bounds.height,
    };
  }, [activePopup, nodes, reactFlowInstance, viewport]); // Recompute when activePopup, nodes, reactFlowInstance, or viewport changes

  const popupSizing = useMemo(() => {
    // Calculates the final size and position of the popup based on whether it is expanded or collapsed
    if (!activePopup || !popupLayout) return null;

    const collapsedWidth = popupLayout.collapsedWidth;
    const collapsedHeight = popupLayout.collapsedHeight;
    const expandedWidth = Math.max(
      collapsedWidth,
      popupLayout.containerWidth - 40
    );
    const expandedHeight = Math.max(
      collapsedHeight,
      popupLayout.containerHeight - 40
    );

    const width = activePopup.expanded ? expandedWidth : collapsedWidth;
    const height = activePopup.expanded ? expandedHeight : collapsedHeight;

    const top = activePopup.expanded
      ? Math.max(20, (popupLayout.containerHeight - height) / 2)
      : popupLayout.collapsedTop;
    const left = activePopup.expanded
      ? Math.max(20, (popupLayout.containerWidth - width) / 2)
      : popupLayout.collapsedLeft;

    return { width, height, top, left };
  }, [activePopup, popupLayout]);

  useEffect(() => {
    if (!popupSizing) return;

    setPopupPosition(
      (prev) => prev ?? { x: popupSizing.left, y: popupSizing.top }
    );
    setPopupSize(
      (prev) => prev ?? { width: popupSizing.width, height: popupSizing.height }
    );
  }, [popupSizing]);

  useEffect(() => {
    if (!activePopup) {
      setPopupPosition(null);
      setPopupSize(null);
      return;
    }

    setPopupPosition(null);
    setPopupSize(null);
  }, [activePopup?.nodeId, activePopup?.expanded]);

  // Sync nodes with database entries while preserving positions
  useEffect(() => {
    let pendingUsed = false; // Flag to track if the pending position has been used
    const pendingSnapshot = pendingNodePositionRef.current; // Snapshot of the pending position for a new node

    setNodes((prevNodes) => {
      const containerBounds = containerRef.current;
      const width = containerBounds?.clientWidth ?? 800;
      const height = containerBounds?.clientHeight ?? 600;
      const existingMap = new Map(prevNodes.map((node) => [node.id, node])); // Map of existing nodes for quick lookup
      const colorCache = new Map<string, string>(); // Cache to store assigned colors for nodes

      prevNodes.forEach((node) => {
        if (node.data?.color) colorCache.set(node.id, node.data.color);
      });

      let updatedNodes = dbNodes.map((node) => {
        const moduleInfo = moduleLookup[node.module_id];
        const baseColor = getColorForModule(node.module_id, moduleLookup);
        let nodeColor = colorCache.get(node.id);

        if (!nodeColor) {
          if (node.type === "topic") {
            // Ensure distinct colors for topic nodes
            const usedColors = new Set(colorCache.values());
            nodeColor = generateDistinctTopicColor(usedColors);
          } else if (node.related_topic) {
            // Inherit color from parent concept if available
            nodeColor = colorCache.get(node.related_topic);
          }
        }

        if (!nodeColor) {
          // Fallback to module color if no other color assigned
          nodeColor =
            node.type === "topic" ? getTopicColor(baseColor) : baseColor;
        }

        const existing = existingMap.get(node.id);
        let position = existing?.position; // Checks if an existing node already has a position

        // Only set new position if node doesn't exist
        if (!position) {
          if (pendingSnapshot && !pendingUsed) {
            position = { ...pendingSnapshot };
            pendingUsed = true;
          } else {
            const parentNode = prevNodes.find(
              (node) => node.id === node.parentId
            );
            if (parentNode) {
              position = {
                x: parentNode.position.x + (Math.random() - 0.5) * 200,
                y: parentNode.position.y + (Math.random() - 0.5) * 200,
              };
            } else {
              position = {
                x:
                  width / 2 +
                  (Math.random() - 0.5) * (Math.min(width, 600) * 0.6),
                y:
                  height / 2 +
                  (Math.random() - 0.5) * (Math.min(height, 600) * 0.6),
              };
            }
          }
          // New node added, should run simulation for layout optimization
          shouldRunSimulationRef.current = true;
        }

        const data: NodeData = {
          node_id: node.id,
          node_name: node.name,
          node_description: node.summary,
          node_type: node.type,
          parent_node_id: node.related_topic,
          node_module_id: node.module_id,
          node_module_name: moduleInfo?.module_name,
          node_module_index: moduleInfo?.module_index,
          color: nodeColor,
        };

        colorCache.set(node.id, nodeColor);

        return existing
          ? {
              ...existing,
              type: node.type === "topic" ? "topicNode" : "conceptNode",
              position: position ?? existing.position,
              data,
              selected: selectedNode === node.id,
            }
          : {
              id: node.id,
              type: node.type === "topic" ? "topicNode" : "conceptNode",
              position: position ?? { x: 0, y: 0 },
              data,
              selected: selectedNode === node.id,
            };
      });

      const topicPositions = new Map<string, XYPosition>();
      const topicNodeLookup = new Map<string, FlowNode>();
      const conceptGroups = new Map<string, FlowNode[]>();

      updatedNodes.forEach((node) => {
        if (node.data?.node_type === "topic") {
          topicPositions.set(String(node.id), {
            x: node.position?.x ?? 0,
            y: node.position?.y ?? 0,
          });
          topicNodeLookup.set(String(node.id), node);
        } else if (
          node.data?.node_type === "concept" &&
          node.data.parent_node_id
        ) {
          const parentId = String(node.data.parent_node_id);
          if (!conceptGroups.has(parentId)) {
            conceptGroups.set(parentId, []);
          }
          conceptGroups.get(parentId)!.push(node);
        }
      });

      conceptGroups.forEach((children, parentId) => {
        const parentPosition = topicPositions.get(parentId);
        if (!parentPosition) {
          return;
        }

        const sortedChildren = [...children].sort((a, b) =>
          String(a.id).localeCompare(String(b.id))
        );
        const count = sortedChildren.length;
        if (count === 0) return;

        const directionAngle = Math.PI / 8; // Bias cluster toward the upper-right quadrant
        const angleSpread = Math.min(Math.PI * 0.9, Math.PI / 3 + count * 0.15);
        const parentNode = topicNodeLookup.get(parentId);
        const parentRadius = parentNode
          ? getNodeRadius(parentNode)
          : TOPIC_BASE_RADIUS;
        const baseRadius = parentRadius + CONCEPT_BASE_RADIUS + CLUSTER_GAP;
        const maxRadius =
          parentRadius + CONCEPT_BASE_RADIUS + CLUSTER_MAX_OFFSET;
        const radius = Math.min(maxRadius, baseRadius + count * 28);

        sortedChildren.forEach((child, index) => {
          const ratio = count > 1 ? index / (count - 1) : 0.5;
          const baseAngle = directionAngle - angleSpread / 2;
          const jitter =
            ((index % 2 === 0 ? 1 : -1) * angleSpread) /
            Math.max(count * 8, 16);
          const angle = baseAngle + ratio * angleSpread + jitter;
          const x = parentPosition.x + Math.cos(angle) * radius;
          const y = parentPosition.y + Math.sin(angle) * radius;
          child.position = { x, y };
        });
      });

      return adjustNodePositions(updatedNodes, {
        center: getLayoutCenter(),
      });
    });

    if (pendingUsed) {
      pendingNodePositionRef.current = null;
    }
  }, [dbNodes, getLayoutCenter, moduleLookup, selectedNode, setNodes]);

  // Sync edges with database relationships
  useEffect(() => {
    const hadEdges = edges.length > 0;

    const getEdgeStyle = (edgeId: string) => ({
      stroke: selectedEdge === edgeId ? "#ff6b6b" : "#b1b1b7",
      strokeWidth: selectedEdge === edgeId ? 3 : 2,
    });

    const seenEdgeKeys = new Set<string>();
    const relationshipEdges: FlowEdge[] = dbRelationships.map((rel) => {
      const source = String(rel.first_node);
      const target = String(rel.second_node);
      seenEdgeKeys.add(`${source}->${target}`);
      seenEdgeKeys.add(`${target}->${source}`);
      const rsType = rel.rs_type?.trim() ?? "";

      return {
        id: String(rel.id),
        source,
        target,
        type: "hoverLabel",
        style: getEdgeStyle(String(rel.id)),
        animated: false,
        data: { label: rsType, rsType },
      };
    });

    const defaultConceptEdges: FlowEdge[] = [];

    dbNodes.forEach((node) => {
      if (node.type !== "concept" || !node.related_topic) {
        return;
      }

      const parentId = String(node.related_topic);
      const conceptId = String(node.id);
      const forwardKey = `${parentId}->${conceptId}`;
      const reverseKey = `${conceptId}->${parentId}`;

      if (seenEdgeKeys.has(forwardKey) || seenEdgeKeys.has(reverseKey)) {
        return;
      }

      const edgeId = `topic-concept-${parentId}-${conceptId}`;
      defaultConceptEdges.push({
        id: edgeId,
        source: parentId,
        target: conceptId,
        type: "hoverLabel",
        style: getEdgeStyle(edgeId),
        animated: false,
        data: { label: "" },
      });
    });

    const newEdges = [...relationshipEdges, ...defaultConceptEdges];
    setEdges(newEdges);

    // If new edges were added, run simulation for layout optimization
    if (!hadEdges && newEdges.length > 0) {
      shouldRunSimulationRef.current = true;
    }
  }, [dbNodes, dbRelationships, selectedEdge, setEdges]);

  // Clean up active popup if node is deleted
  useEffect(() => {
    if (activePopup && !nodes.some((node) => node.id === activePopup.nodeId)) {
      setActivePopup(null);
      setPopupPosition(null);
      setPopupSize(null);
    }
  }, [activePopup, nodes]);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      simulationRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (fitViewRafRef.current) {
        cancelAnimationFrame(fitViewRafRef.current);
        fitViewRafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!reactFlowInstance || nodes.length === 0) {
      return;
    }

    if (fitViewRafRef.current) {
      cancelAnimationFrame(fitViewRafRef.current);
    }

    fitViewRafRef.current = requestAnimationFrame(() => {
      reactFlowInstance.fitView({ padding: 0.35, duration: 350 });
      fitViewRafRef.current = null;
    });
  }, [activeModuleId, edges.length, nodes.length, reactFlowInstance]);

  // D3 Force Layout - Only run when needed
  useEffect(() => {
    if (nodes.length === 0 || !shouldRunSimulationRef.current) return;

    shouldRunSimulationRef.current = false;
    const width = containerRef.current?.clientWidth ?? 800;
    const height = containerRef.current?.clientHeight ?? 600;

    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation();
    }

    const simulation = simulationRef.current;
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));

    const findRootTopicId = (
      node: FlowNode | undefined,
      visited: Set<string> = new Set()
    ): string | null => {
      if (!node || visited.has(node.id)) return null;
      visited.add(node.id);
      if (node.data.node_type === "topic") return node.id;
      if (!node.data.parent_node_id) return null;
      return findRootTopicId(nodeMap.get(node.data.parent_node_id), visited);
    };

    const simulationNodes = nodes.map((node) => ({
      ...node,
      x: node.position.x,
      y: node.position.y,
      fx: null,
      fy: null,
    }));

    const simulationNodeMap = new Map(
      simulationNodes.map((node) => [node.id, node])
    );
    const linkData = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    const conceptLayoutTargets = new Map<
      string,
      { angle: number; radius: number }
    >();
    type SimulationNode = (typeof simulationNodes)[number];
    const conceptGroupsForLayout = new Map<string, SimulationNode[]>();

    simulationNodes.forEach((node) => {
      const data = node.data as NodeData;
      if (data.node_type === "concept" && data.parent_node_id) {
        const parentId = String(data.parent_node_id);
        if (!conceptGroupsForLayout.has(parentId)) {
          conceptGroupsForLayout.set(parentId, []);
        }
        conceptGroupsForLayout.get(parentId)!.push(node);
      }
    });

    conceptGroupsForLayout.forEach((children, parentId) => {
      if (!children || children.length === 0) {
        return;
      }

      const sortedChildren = [...children].sort((a, b) =>
        String(a.id).localeCompare(String(b.id))
      );
      const count = sortedChildren.length;
      const directionAngle = Math.PI / 8;
      const angleSpread = Math.min(Math.PI * 0.9, Math.PI / 3 + count * 0.15);
      const parentNode = simulationNodeMap.get(parentId) as
        | SimulationNode
        | undefined;
      const parentRadius = parentNode
        ? getNodeRadius(parentNode as unknown as FlowNode)
        : TOPIC_BASE_RADIUS;
      const baseRadius = parentRadius + CONCEPT_BASE_RADIUS + CLUSTER_GAP;
      const maxRadius = parentRadius + CONCEPT_BASE_RADIUS + CLUSTER_MAX_OFFSET;
      const radius = Math.min(maxRadius, baseRadius + count * 28);

      sortedChildren.forEach((child, index) => {
        const ratio = count > 1 ? index / (count - 1) : 0.5;
        const baseAngle = directionAngle - angleSpread / 2;
        const jitter =
          ((index % 2 === 0 ? 1 : -1) * angleSpread) / Math.max(count * 8, 16);
        const angle = baseAngle + ratio * angleSpread + jitter;
        conceptLayoutTargets.set(String(child.id), { angle, radius });
      });
    });

    const topicSimulationNodes = simulationNodes.filter(
      (node) => node.data.node_type === "topic"
    );
    const topicAnchors = new Map<string, { x: number; y: number }>();

    if (topicSimulationNodes.length > 0) {
      const radius = Math.min(width, height) * 0.45;
      const angleStep =
        (2 * Math.PI) / Math.max(topicSimulationNodes.length, 1);

      topicSimulationNodes.forEach((node, index) => {
        const angle = index * angleStep;
        topicAnchors.set(node.id, {
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
        });
      });
    }

    simulation.nodes(simulationNodes as any);
    simulation.force("center", d3.forceCenter(width / 2, height / 2));
    simulation.alphaDecay(0.18);
    simulation.velocityDecay(0.52);

    simulation.force(
      "charge",
      d3
        .forceManyBody()
        .strength((d: any) =>
          (d.data as NodeData).node_type === "topic" ? -260 : -180
        )
        .distanceMax(460)
    );

    simulation.force(
      "collision",
      d3
        .forceCollide()
        .radius((d: any) => {
          const nodeData = d.data as NodeData;
          return nodeData.node_type === "topic" ? 66 : 40;
        })
        .strength(0.95)
        .iterations(5)
    );

    simulation.force(
      "link",
      d3
        .forceLink(linkData as any)
        .id((d: any) => d.id)
        .distance((link: any) => {
          const resolveNode = (value: any) =>
            typeof value === "string" ? value : value.id;
          const sourceNode = nodes.find(
            (node) => node.id === resolveNode(link.source)
          );
          const targetNode = nodes.find(
            (node) => node.id === resolveNode(link.target)
          );

          const isParentChild =
            sourceNode?.data?.parent_node_id === targetNode?.id ||
            targetNode?.data?.parent_node_id === sourceNode?.id;
          if (isParentChild) {
            const conceptNode =
              sourceNode?.data?.node_type === "concept"
                ? sourceNode
                : targetNode?.data?.node_type === "concept"
                ? targetNode
                : null;
            const layoutTarget = conceptNode
              ? conceptLayoutTargets.get(String(conceptNode.id))
              : null;
            const preferred = layoutTarget?.radius ?? 110;
            return Math.max(90, preferred);
          }

          const sourceRoot = findRootTopicId(sourceNode);
          const targetRoot = findRootTopicId(targetNode);
          if (sourceRoot && targetRoot && sourceRoot === targetRoot) return 140;

          return 260;
        })
        .strength((link: any) => {
          const resolveNode = (value: any) =>
            typeof value === "string" ? value : value.id;
          const sourceNode = nodes.find(
            (node) => node.id === resolveNode(link.source)
          );
          const targetNode = nodes.find(
            (node) => node.id === resolveNode(link.target)
          );

          const isParentChild =
            sourceNode?.data?.parent_node_id === targetNode?.id ||
            targetNode?.data?.parent_node_id === sourceNode?.id;
          if (isParentChild) return 0.9;

          const sourceRoot = findRootTopicId(sourceNode);
          const targetRoot = findRootTopicId(targetNode);
          if (sourceRoot && targetRoot && sourceRoot === targetRoot) return 0.45;

          return 0.12;
        })
    );

    simulation.force(
      "concept-x",
      d3
        .forceX((d: any) => {
          const data = d.data as NodeData;
          if (data.node_type === "concept" && data.parent_node_id) {
            const parentNode = simulationNodeMap.get(data.parent_node_id);
            const targetLayout = conceptLayoutTargets.get(String(d.id));
            if (parentNode && targetLayout) {
              const parentX =
                parentNode.x ?? parentNode.position?.x ?? width / 2;
              return (
                parentX + Math.cos(targetLayout.angle) * targetLayout.radius
              );
            }
            if (parentNode) {
              return parentNode.x ?? parentNode.position?.x ?? width / 2;
            }
          }
          return d.x ?? width / 2;
        })
        .strength((d: any) =>
          (d.data as NodeData).node_type === "concept" ? 0.2 : 0.05
        )
    );

    simulation.force(
      "concept-y",
      d3
        .forceY((d: any) => {
          const data = d.data as NodeData;
          if (data.node_type === "concept" && data.parent_node_id) {
            const parentNode = simulationNodeMap.get(data.parent_node_id);
            const targetLayout = conceptLayoutTargets.get(String(d.id));
            if (parentNode && targetLayout) {
              const parentY =
                parentNode.y ?? parentNode.position?.y ?? height / 2;
              return (
                parentY + Math.sin(targetLayout.angle) * targetLayout.radius
              );
            }
            if (parentNode) {
              return parentNode.y ?? parentNode.position?.y ?? height / 2;
            }
          }
          return d.y ?? height / 2;
        })
        .strength((d: any) =>
          (d.data as NodeData).node_type === "concept" ? 0.2 : 0.05
        )
    );

    simulation.force(
      "topic-x",
      d3
        .forceX((d: any) => {
          if ((d.data as NodeData).node_type === "topic") {
            return topicAnchors.get(d.id)?.x ?? width / 2;
          }
          return d.x ?? width / 2;
        })
        .strength((d: any) =>
          (d.data as NodeData).node_type === "topic" ? 0.08 : 0.02
        )
    );

    simulation.force(
      "topic-y",
      d3
        .forceY((d: any) => {
          if ((d.data as NodeData).node_type === "topic") {
            return topicAnchors.get(d.id)?.y ?? height / 2;
          }
          return d.y ?? height / 2;
        })
        .strength((d: any) =>
          (d.data as NodeData).node_type === "topic" ? 0.08 : 0.02
        )
    );

    let tickCount = 0;
    simulation.on("tick", () => {
      tickCount += 1;

      if (tickCount % 2 !== 0 && simulation.alpha() > 0.1) {
        return;
      }

      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          const simNode = simulationNodes.find((n) => n.id === node.id);
          if (!simNode) return node;
          return {
            ...node,
            position: {
              x: simNode.x ?? node.position.x,
              y: simNode.y ?? node.position.y,
            },
          };
        })
      );

      if (simulation.alpha() < 0.02 || tickCount > 120) {
        (simulation.nodes() as any[]).forEach((node) => {
          node.vx = 0;
          node.vy = 0;
        });
        simulation.stop();
      }
    });

    simulation.on("end", () => {
      (simulation.nodes() as any[]).forEach((node) => {
        node.vx = 0;
        node.vy = 0;
      });
      setNodes((prevNodes) =>
        adjustNodePositions(prevNodes, { center: getLayoutCenter() })
      );
      if (reactFlowInstanceRef.current) {
        reactFlowInstanceRef.current.fitView({ padding: 0.35, duration: 350 });
      }
    });

    simulation.alpha(0.9).restart();
  }, [edges, getLayoutCenter, nodes, setNodes]);

  const handleConnectStart = useCallback<OnConnectStart>(() => {
    if (!isEditMode) {
      setIsAddingEdge(false);
      return;
    }
    setIsAddingEdge(true);
    setShowInfoTooltip(false);
  }, [isEditMode]);

  const handleConnectEnd = useCallback<OnConnectEnd>(() => {
    setIsAddingEdge(false);
  }, []);

  const handleNodeDragStart: OnNodeDrag<FlowNode> = useCallback(
    (_, node) => {
      if (isEditMode) {
        allowNodeDragRef.current = true;
        return;
      }

      if (interactionMode !== "cursor") {
        allowNodeDragRef.current = false;
        return;
      }

      const pressInfo = pointerPressRef.current;
      const now = Date.now();
      const allowed =
        pressInfo.nodeId === node.id && now - pressInfo.time >= LONG_PRESS_MS;
      allowNodeDragRef.current = Boolean(allowed);
    },
    [interactionMode, isEditMode]
  );

  const handleNodeDragStop: OnNodeDrag<FlowNode> = useCallback(() => {
    allowNodeDragRef.current = false;
    pointerPressRef.current = { nodeId: null, time: 0 };
    setNodes((prevNodes) =>
      adjustNodePositions(prevNodes, { center: getLayoutCenter() })
    );
    shouldRunSimulationRef.current = true;
    if (simulationRef.current) {
      simulationRef.current.alpha(0.6).restart();
    }
  }, [getLayoutCenter, setNodes]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      let triggerSimulation = false;
      let lockedNodeId: string | undefined;

      const preventDrag =
        !isEditMode &&
        interactionMode === "cursor" &&
        changes.some(
          (change) =>
            change.type === "position" &&
            change.dragging &&
            !allowNodeDragRef.current
        );

      if (preventDrag) {
        allowNodeDragRef.current = false;
        return;
      }

      setNodes((prevNodes) => {
        const baseNodes = applyNodeChanges(changes, prevNodes);
        let nextNodes = baseNodes;

        changes.forEach((change) => {
          if (change.type !== "position") {
            return;
          }

          const nodeId = change.id;

          if (change.dragging) {
            lockedNodeId = nodeId;
            const draggedPrev = prevNodes.find((node) => node.id === nodeId);
            const draggedCurr = baseNodes.find((node) => node.id === nodeId);
            if (!draggedPrev || !draggedCurr) {
              return;
            }

            const draggedPrevPos = draggedPrev.position ?? { x: 0, y: 0 };

            if (
              !dragContextRef.current ||
              dragContextRef.current.nodeId !== nodeId
            ) {
              const neighborOffsets = new Map<
                string,
                { dx: number; dy: number }
              >();
              const neighbors = adjacencyMap.get(nodeId);
              if (neighbors) {
                neighbors.forEach((neighborId) => {
                  const neighborPrev = prevNodes.find(
                    (node) => node.id === neighborId
                  );
                  if (neighborPrev) {
                    const neighborPrevPos = neighborPrev.position ?? {
                      x: 0,
                      y: 0,
                    };
                    neighborOffsets.set(neighborId, {
                      dx: neighborPrevPos.x - draggedPrevPos.x,
                      dy: neighborPrevPos.y - draggedPrevPos.y,
                    });
                  }
                });
              }

              dragContextRef.current = {
                nodeId,
                offsets: neighborOffsets,
              };
            }

            const context = dragContextRef.current;
            if (context?.nodeId === nodeId) {
              const draggedCurrPos = draggedCurr.position ?? { x: 0, y: 0 };
              nextNodes = nextNodes.map((node) => {
                if (node.id === nodeId) {
                  return node;
                }
                const offset = context.offsets.get(node.id);
                if (!offset) {
                  return node;
                }
                return {
                  ...node,
                  position: {
                    x: draggedCurrPos.x + offset.dx,
                    y: draggedCurrPos.y + offset.dy,
                  },
                };
              });
            }
          } else {
            if (dragContextRef.current?.nodeId === nodeId) {
              dragContextRef.current = null;
            }
            triggerSimulation = true;
          }
        });

        const adjusted = adjustNodePositions(nextNodes, {
          lockedNodeId,
          center: getLayoutCenter(),
        });
        return adjusted;
      });

      if (triggerSimulation) {
        shouldRunSimulationRef.current = true;
      }
    },
    [adjacencyMap, getLayoutCenter, interactionMode, isEditMode, setNodes]
  );

  // Handle connection
  const onConnect: OnConnect = useCallback(
    (params) => {
      if (!params.source || !params.target || !isEditMode) return;

      const maxRelationshipId = dbRelationships.reduce((max, relationship) => {
        const numericId = Number(relationship.id);
        return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
      }, 0);

      const newRelationship: DatabaseRelationship = {
        id: String(maxRelationshipId + 1),
        first_node: params.source,
        second_node: params.target,
        rs_type: "",
      };

      setDbRelationships((prev) => [...prev, newRelationship]);
      shouldRunSimulationRef.current = true; // Run simulation for new edge
      setIsAddingEdge(false);
    },
    [dbRelationships, isEditMode]
  );

  // Handle node click - only select, don't trigger layout
  const handleNodeClick: NodeMouseHandler<FlowNode> = useCallback(
    (event, node) => {
      if (interactionMode === "add-node") {
        return;
      }

      event.stopPropagation();

      setActivePopup((prev) => {
        if (prev?.nodeId === node.id) {
          return null;
        }
        return { nodeId: node.id, expanded: false };
      });

      if (!isEditMode) {
        setSelectedNode(null);
        setSelectedEdge(null);
        return;
      }

      setSelectedNode((prev) => (prev === node.id ? null : node.id));
      setSelectedEdge(null); // Deselect edge when selecting node
    },
    [interactionMode, isEditMode]
  );

  // Handle edge click - select edge for deletion
  const handleEdgeClick: EdgeMouseHandler<FlowEdge> = useCallback(
    (event, edge) => {
      if (!isEditMode || interactionMode === "add-node") {
        return;
      }

      event.stopPropagation();
      setSelectedEdge((prev) => (prev === edge.id ? null : edge.id));
      setSelectedNode(null); // Deselect node when selecting edge
    },
    [interactionMode, isEditMode]
  );

  const handleMove = useCallback<OnMove>((_, nextViewport) => {
    setViewport(nextViewport);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setActivePopup(null);
    setIsAddingEdge(false);
  }, []);

  const handleExpandThreadmap = useCallback(() => {
    if (!activeModuleId) {
      setShowInfoTooltip(true);
      return;
    }

    if (isStandaloneView) {
      return;
    }

    navigate({ pathname: "/threadmap", search: `?module=${activeModuleId}` });
  }, [activeModuleId, isStandaloneView, navigate]);

  const handleCloseThreadmap = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Handle mouse move for hover node
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (interactionMode !== "add-node") {
        setHoverNode((prev) =>
          prev.visible ? { ...prev, visible: false } : prev
        );
        return;
      }

      const instance = reactFlowInstanceRef.current;
      if (!instance) return;

      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;

      const flowPosition = instance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const screenPosition = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };

      const isTooCloseToNode = nodes.some((node) => {
        const nodeSize = node.data.node_type === "topic" ? 120 : 70;
        const distance = Math.sqrt(
          Math.pow(flowPosition.x - node.position.x, 2) +
            Math.pow(flowPosition.y - node.position.y, 2)
        );
        return distance < nodeSize;
      });

      const canAddNode = Boolean(activeModuleId);

      setHoverNode({
        flowPosition,
        screenPosition,
        visible: !isTooCloseToNode && canAddNode,
      });
    },
    [activeModuleId, interactionMode, nodes]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverNode((prev) => ({ ...prev, visible: false }));
  }, []);

  const controlButtonSize = 44;

  const safeHoverScreenPosition = useMemo(() => {
    if (!hoverNode.visible) {
      return hoverNode.screenPosition;
    }

    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) {
      return hoverNode.screenPosition;
    }

    const margin = 36;
    const controlSafeWidth = 140;
    const controlSafeHeight = 180;
    let x = Math.min(
      Math.max(hoverNode.screenPosition.x, margin),
      Math.max(margin, bounds.width - controlSafeWidth)
    );
    let y = Math.min(
      Math.max(hoverNode.screenPosition.y, margin),
      Math.max(margin, bounds.height - controlSafeHeight)
    );

    const controlCenterX = controlPosition.x + controlButtonSize / 2;
    const controlCenterY = controlPosition.y + controlButtonSize / 2;
    const controlBuffer = controlButtonSize + 48;

    if (
      Math.abs(x - controlCenterX) < controlBuffer &&
      Math.abs(y - controlCenterY) < controlBuffer
    ) {
      x = Math.max(margin, controlCenterX + controlBuffer);
      y = Math.max(margin, controlCenterY - controlBuffer);
    }

    return { x, y };
  }, [
    controlButtonSize,
    controlPosition.x,
    controlPosition.y,
    hoverNode,
    viewport,
  ]);

  const handleControlMouseDown = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      controlDraggedRef.current = false;
      controlDragStartRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: controlPosition.x,
        originY: controlPosition.y,
      };

      setIsDraggingControl(true);
    },
    [controlPosition]
  );

  const handleControlDragMove = useCallback((event: MouseEvent) => {
    const dragState = controlDragStartRef.current;
    if (!dragState) return;

    const bounds = containerRef.current?.getBoundingClientRect();
    const maxX = (bounds?.width ?? window.innerWidth) - controlButtonSize - 12;
    const maxY =
      (bounds?.height ?? window.innerHeight) - controlButtonSize - 12;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    if (
      !controlDraggedRef.current &&
      Math.sqrt(deltaX * deltaX + deltaY * deltaY) > 4
    ) {
      controlDraggedRef.current = true;
    }

    const nextX = Math.max(12, Math.min(maxX, dragState.originX + deltaX));
    const nextY = Math.max(12, Math.min(maxY, dragState.originY + deltaY));

    setControlPosition({ x: nextX, y: nextY });
  }, []);

  const handleControlDragEnd = useCallback(() => {
    setIsDraggingControl(false);
    controlDragStartRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const handleToggleEditMode = useCallback(() => {
    setIsEditMode((prev) => {
      const next = !prev;
      setSelectedNode(null);
      setSelectedEdge(null);
      setActivePopup(null);
      setInteractionMode(next ? "add-node" : "cursor");
      setIsAddingEdge(false);
      return next;
    });
  }, []);

  const handleTaxonomyMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      taxonomyDragStartRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: taxonomyPosition.x,
        originY: taxonomyPosition.y,
      };
      setIsDraggingTaxonomy(true);
    },
    [taxonomyPosition.x, taxonomyPosition.y]
  );

  const handleTaxonomyDragMove = useCallback(
    (event: MouseEvent) => {
      const dragState = taxonomyDragStartRef.current;
      if (!dragState) {
        return;
      }

      const bounds = containerRef.current?.getBoundingClientRect();
      const widgetWidth = isTaxonomyCollapsed ? 280 : 360;
      const widgetHeight = isTaxonomyCollapsed ? 76 : 460;
      const maxX = Math.max(
        12,
        (bounds?.width ?? window.innerWidth) - widgetWidth - 12
      );
      const maxY = Math.max(
        12,
        (bounds?.height ?? window.innerHeight) - widgetHeight - 12
      );

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      const nextX = Math.max(12, Math.min(maxX, dragState.originX + deltaX));
      const nextY = Math.max(12, Math.min(maxY, dragState.originY + deltaY));

      setTaxonomyPosition({ x: nextX, y: nextY });
    },
    [isTaxonomyCollapsed]
  );

  const handleTaxonomyDragEnd = useCallback(() => {
    setIsDraggingTaxonomy(false);
    taxonomyDragStartRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const toggleTaxonomyCollapsed = useCallback(() => {
    setIsTaxonomyCollapsed((prev) => !prev);
  }, []);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode || !isEditMode) return;

    setDbNodes((prev) => prev.filter((node) => node.id !== selectedNode));
    setDbRelationships((prev) =>
      prev.filter(
        (rel) =>
          rel.first_node !== selectedNode && rel.second_node !== selectedNode
      )
    );
    setSelectedNode(null);
    setActivePopup((prev) => (prev?.nodeId === selectedNode ? null : prev));
    shouldRunSimulationRef.current = true;
  }, [isEditMode, selectedNode]);

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdge || !isEditMode) return;

    setDbRelationships((prev) => prev.filter((rel) => rel.id !== selectedEdge));
    setSelectedEdge(null);
    shouldRunSimulationRef.current = true;
  }, [isEditMode, selectedEdge]);

  const handleInfoToggle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      if (controlDraggedRef.current) {
        controlDraggedRef.current = false;
        return;
      }
      setShowInfoTooltip((prev) => !prev);
    },
    []
  );

  const handleDeleteSelection = useCallback(() => {
    if (!isEditMode) {
      return;
    }

    if (selectedNode) {
      deleteSelectedNode();
    } else if (selectedEdge) {
      deleteSelectedEdge();
    }
    setIsDeleteHovered(false);
  }, [
    deleteSelectedEdge,
    deleteSelectedNode,
    isEditMode,
    selectedEdge,
    selectedNode,
  ]);

  useEffect(() => {
    if (!isDraggingControl) return;

    const handleMove = (event: MouseEvent) => {
      handleControlDragMove(event);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    };

    const handleUp = () => {
      handleControlDragEnd();
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDraggingControl, handleControlDragMove, handleControlDragEnd]);

  useEffect(() => {
    if (!isDraggingTaxonomy) {
      return;
    }

    const handleMove = (event: MouseEvent) => {
      handleTaxonomyDragMove(event);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    };

    const handleUp = () => {
      handleTaxonomyDragEnd();
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);

    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [handleTaxonomyDragEnd, handleTaxonomyDragMove, isDraggingTaxonomy]);

  useEffect(() => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) {
      return;
    }

    const widgetWidth = isTaxonomyCollapsed ? 280 : 360;
    const widgetHeight = isTaxonomyCollapsed ? 76 : 460;
    setTaxonomyPosition((prev) => {
      const x = Math.max(12, Math.min(bounds.width - widgetWidth - 12, prev.x));
      const y = Math.max(
        12,
        Math.min(bounds.height - widgetHeight - 12, prev.y)
      );
      if (x === prev.x && y === prev.y) {
        return prev;
      }
      return { x, y };
    });
  }, [isTaxonomyCollapsed, viewport]);

  useEffect(() => {
    if (!isStandaloneView) {
      setIsTaxonomyCollapsed(true);
      setTaxonomyPosition({ x: 24, y: 120 });
    }
  }, [isStandaloneView]);

  useEffect(() => {
    if (isEditMode) {
      setShowInfoTooltip(false);
    }
  }, [isEditMode]);

  useEffect(() => {
    if (!selectedEdge) {
      return;
    }

    if (!displayedEdges.some((edge) => edge.id === selectedEdge)) {
      setSelectedEdge(null);
    }
  }, [displayedEdges, selectedEdge]);

  useEffect(() => {
    if (interactionMode === "add-node") {
      setSelectedNode(null);
      setSelectedEdge(null);
      setActivePopup(null);
    }
  }, [interactionMode]);

  useEffect(() => {
    if (interactionMode !== "add-node") {
      setHoverNode((prev) =>
        prev.visible ? { ...prev, visible: false } : prev
      );
    } else {
      setIsAddingEdge(false);
    }
  }, [interactionMode]);

  useEffect(() => {
    if (!isEditMode || (!selectedNode && !selectedEdge)) {
      setIsDeleteHovered(false);
    }
  }, [isEditMode, selectedEdge, selectedNode]);

  const handleAddNodeFromHover = useCallback(() => {
    setPendingNodePosition(hoverNode.flowPosition);
    setIsModalOpen(true);
    setHoverNode((prev) => ({ ...prev, visible: false }));
  }, [hoverNode.flowPosition]);

  const handleSaveNewNode = useCallback(
    (
      nodeName: string,
      nodeType: "concept" | "topic",
      nodeDescription: string,
      moduleId: string,
      parentNodeId?: string
    ) => {
      if (!pendingNodePosition) return;

      pendingNodePositionRef.current = pendingNodePosition;

      const numericIds = dbNodes
        .map((n) => Number(n.id))
        .filter((id) => Number.isFinite(id)) as number[];
      const nextNumericId =
        numericIds.length > 0 ? Math.max(...numericIds) + 1 : null;
      const newNodeId =
        nextNumericId !== null ? String(nextNumericId) : `temp-${Date.now()}`;
      const newDbNode: DatabaseNode = {
        id: newNodeId,
        type: nodeType,
        name: nodeName,
        summary: nodeDescription || undefined,
        related_topic: parentNodeId,
        module_id: moduleId,
      };

      setDbNodes((prev) => [...prev, newDbNode]);

      setModuleLookup((prev) => {
        if (prev[moduleId]) {
          return prev;
        }
        const fallbackColor = getColorForModule(moduleId, prev);
        return {
          ...prev,
          [moduleId]: {
            module_id: moduleId,
            color: fallbackColor,
          },
        };
      });

      if (parentNodeId) {
        setDbRelationships((prev) => {
          const numericRelationshipIds = prev
            .map((rel) => Number(rel.id))
            .filter((id) => Number.isFinite(id)) as number[];
          const nextRelationshipId =
            numericRelationshipIds.length > 0
              ? Math.max(...numericRelationshipIds) + 1
              : null;
          const newRelationshipId =
            nextRelationshipId !== null
              ? String(nextRelationshipId)
              : `rel-${Date.now()}`;
          return [
            ...prev,
            {
              id: newRelationshipId,
              first_node: parentNodeId,
              second_node: newNodeId,
              rs_type: "",
            },
          ];
        });
      }

      setPendingNodePosition(null);
      shouldRunSimulationRef.current = true; // Run simulation for new node
    },
    [pendingNodePosition, dbNodes]
  );

  const getNodeCount = (): number => dbNodes.length;
  const getEdgeCount = (): number => displayedEdges.length;

  // Popup drag handlers
  const handlePopupMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!popupSizing) return;

      const target = event.target as HTMLElement;
      if (target.closest("button")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      setIsDraggingPopup(true);
      setDragStart({
        x: event.clientX,
        y: event.clientY,
        popupX: popupPosition?.x ?? popupSizing.left,
        popupY: popupPosition?.y ?? popupSizing.top,
      });
    },
    [popupSizing, popupPosition]
  );

  const handlePopupMouseMove = useCallback(
    (event: MouseEvent) => {
      if (isDraggingPopup && dragStart && containerRef.current) {
        event.preventDefault();

        const deltaX = event.clientX - dragStart.x;
        const deltaY = event.clientY - dragStart.y;
        const bounds = containerRef.current.getBoundingClientRect();
        const currentWidth = popupSize?.width ?? popupSizing?.width ?? 420;
        const currentHeight = popupSize?.height ?? popupSizing?.height ?? 320;

        const newX = Math.max(
          0,
          Math.min(bounds.width - currentWidth, dragStart.popupX + deltaX)
        );
        const newY = Math.max(
          0,
          Math.min(bounds.height - currentHeight, dragStart.popupY + deltaY)
        );

        setPopupPosition({ x: newX, y: newY });
      }

      if (isResizingPopup && resizeStart && containerRef.current) {
        event.preventDefault();

        const deltaX = event.clientX - resizeStart.x;
        const deltaY = event.clientY - resizeStart.y;
        const bounds = containerRef.current.getBoundingClientRect();
        const originX = popupPosition?.x ?? popupSizing?.left ?? 0;
        const originY = popupPosition?.y ?? popupSizing?.top ?? 0;

        const newWidth = Math.max(
          300,
          Math.min(bounds.width - originX, resizeStart.width + deltaX)
        );
        const newHeight = Math.max(
          200,
          Math.min(bounds.height - originY, resizeStart.height + deltaY)
        );

        setPopupSize({ width: newWidth, height: newHeight });
      }
    },
    [
      isDraggingPopup,
      isResizingPopup,
      dragStart,
      resizeStart,
      popupSizing,
      popupPosition,
      popupSize,
    ]
  );

  const handlePopupMouseUp = useCallback(() => {
    setIsDraggingPopup(false);
    setIsResizingPopup(false);
    setDragStart(null);
    setResizeStart(null);
  }, []);

  const handleResizeMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (!popupSizing) return;

      event.preventDefault();
      event.stopPropagation();

      setIsResizingPopup(true);
      setResizeStart({
        x: event.clientX,
        y: event.clientY,
        width: popupSize?.width ?? popupSizing.width,
        height: popupSize?.height ?? popupSizing.height,
      });
    },
    [popupSizing, popupSize]
  );

  // Add global mouse event listeners for popup drag/resize
  useEffect(() => {
    if (isDraggingPopup || isResizingPopup) {
      document.addEventListener("mousemove", handlePopupMouseMove);
      document.addEventListener("mouseup", handlePopupMouseUp);
      document.body.style.cursor = isDraggingPopup ? "move" : "nw-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handlePopupMouseMove);
        document.removeEventListener("mouseup", handlePopupMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [
    isDraggingPopup,
    isResizingPopup,
    handlePopupMouseMove,
    handlePopupMouseUp,
  ]);

  const containerBounds = containerRef.current?.getBoundingClientRect();
  const infoPanelWidth = 260;
  const infoPanelHeight = 172;
  const infoOffsetX =
    !containerBounds ||
    controlPosition.x + controlButtonSize + 16 + infoPanelWidth <=
      containerBounds.width
      ? controlButtonSize + 16
      : -infoPanelWidth - 16;
  const infoOffsetY =
    !containerBounds || controlPosition.y - infoPanelHeight - 12 >= 0
      ? -(infoPanelHeight + 12)
      : controlButtonSize + 12;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Floating Control Toggle */}
      <div
        style={{
          position: "absolute",
          top: controlPosition.y,
          left: controlPosition.x,
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button
              type="button"
              onMouseDown={handleControlMouseDown}
              onClick={handleInfoToggle}
              aria-label="Threadmap information"
              title="Threadmap information"
              style={{
                width: controlButtonSize,
                height: controlButtonSize,
                borderRadius: "50%",
                border: "none",
                background: "#0f172a",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 16px 30px rgba(15, 23, 42, 0.45)",
                cursor: isDraggingControl ? "grabbing" : "grab",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                transform: isDraggingControl ? "scale(0.98)" : "scale(1)",
              }}
            >
              <Info size={22} />
            </button>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "8px 12px",
                background: "rgba(15, 23, 42, 0.78)",
                borderRadius: "9999px",
                boxShadow: "0 18px 35px rgba(15, 23, 42, 0.45)",
              }}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleToggleEditMode();
                }}
                aria-pressed={isEditMode}
                aria-label={editToggleLabel}
                title={editToggleLabel}
                style={{
                  width: controlButtonSize - 6,
                  height: controlButtonSize - 6,
                  borderRadius: "50%",
                  border: "none",
                  background: isEditMode ? "#dc2626" : "#1d4ed8",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isEditMode
                    ? "0 12px 26px rgba(220, 38, 38, 0.45)"
                    : "0 12px 26px rgba(29, 78, 216, 0.45)",
                  cursor: "pointer",
                  transition: "background 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                {isEditMode ? <Pencil size={18} /> : <Hand size={18} />}
              </button>
              {isEditMode && deleteSelectionLabel && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteSelection();
                  }}
                  onMouseEnter={() => setIsDeleteHovered(true)}
                  onMouseLeave={() => setIsDeleteHovered(false)}
                  style={{
                    width: controlButtonSize - 6,
                    height: controlButtonSize - 6,
                    borderRadius: "50%",
                    border: "none",
                    background: isDeleteHovered ? "#b91c1c" : "#dc2626",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 12px 26px rgba(220, 38, 38, 0.4)",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                  }}
                  aria-label={deleteSelectionLabel}
                  title={deleteSelectionLabel}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
        {showInfoTooltip && (
          <div
            style={{
              pointerEvents: "auto",
              position: "absolute",
              top: infoOffsetY,
              left: infoOffsetX,
              width: infoPanelWidth,
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 18px 35px rgba(15, 23, 42, 0.28)",
              padding: "16px",
              fontFamily: "GlacialIndifference, sans-serif",
              color: "#1e293b",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
                gap: "12px",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: "15px" }}>
                ThreadMap quick tips
              </div>
              <button
                onClick={() => setShowInfoTooltip(false)}
                aria-label="Close threadmap tips"
                style={{
                  border: "none",
                  background: "#e2e8f0",
                  color: "#0f172a",
                  width: 26,
                  height: 26,
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div
              style={{
                fontSize: "11.5px",
                color: "#475569",
                lineHeight: 1.5,
                marginBottom: "12px",
              }}
            >
              • Hover over open space to add a new node.
              <br />• Use node handles to connect concepts.
              <br />• Click nodes or edges to focus them.
            </div>
            <div
              style={{
                fontSize: "11px",
                color: "#0f172a",
                background: "#f1f5f9",
                borderRadius: "10px",
                padding: "8px 10px",
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <span>Nodes: {getNodeCount()}</span>
              <span>Edges: {getEdgeCount()}</span>
            </div>
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "11.5px",
                color: "#0f172a",
              }}
            >
              <input
                id="concept-parent-toggle"
                type="checkbox"
                checked={showConceptParentEdges}
                onChange={(event) =>
                  setShowConceptParentEdges(event.target.checked)
                }
                style={{
                  width: 14,
                  height: 14,
                  cursor: "pointer",
                  accentColor: "#1d4ed8",
                }}
              />
              <label
                htmlFor="concept-parent-toggle"
                style={{
                  cursor: "pointer",
                  fontWeight: 600,
                  fontFamily: '"GlacialIndifference", sans-serif',
                }}
              >
                Show concept-parent edges
              </label>
            </div>
            {edgeTypeOptions.length > 0 && (
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <label
                  htmlFor="edge-type-filter"
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  Relationship filter
                </label>
                <select
                  id="edge-type-filter"
                  value={edgeTypeFilter}
                  onChange={(event) => setEdgeTypeFilter(event.target.value)}
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #cbd5f5",
                    padding: "6px 8px",
                    fontSize: "11.5px",
                    color: "#0f172a",
                    background: "#f8fafc",
                    fontFamily: '"GlacialIndifference", sans-serif',
                  }}
                >
                  <option value="all">All relationship types</option>
                  {edgeTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {isStandaloneView && (
        <div
          style={{
            position: "absolute",
            top: taxonomyPosition.y,
            left: taxonomyPosition.x,
            zIndex: 28,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              width: isTaxonomyCollapsed ? 280 : 360,
              maxHeight: isTaxonomyCollapsed ? 110 : 460,
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 22px 42px rgba(15, 23, 42, 0.28)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              onMouseDown={handleTaxonomyMouseDown}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "#0f172a",
                color: "#fff",
                cursor: isDraggingTaxonomy ? "grabbing" : "grab",
                userSelect: "none",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontFamily: "Fredoka, sans-serif",
                  fontWeight: 600,
                  fontSize: "17px",
                  color: "4C73FF",
                }}
              >
                Topic taxonomy
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleTaxonomyCollapsed();
                }}
                aria-label={
                  isTaxonomyCollapsed
                    ? "Expand topic taxonomy"
                    : "Collapse topic taxonomy"
                }
                style={{
                  border: "none",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.16)",
                  color: "#fff",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {isTaxonomyCollapsed ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )}
              </button>
            </div>
            {isTaxonomyCollapsed ? (
              <div
                style={{
                  padding: "10px 16px",
                  fontSize: "11.5px",
                  color: "#475569",
                  background: "#f8fafc",
                }}
              >
                View taxonomy progression
              </div>
            ) : (
              <div
                style={{
                  padding: "12px 16px",
                  background: "#f8fafc",
                  overflowY: "auto",
                  maxHeight: 360,
                }}
              >
                {taxonomyModuleDisplay && (
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#334155",
                      marginBottom: "8px",
                      fontFamily: '"GlacialIndifference", sans-serif',
                    }}
                  >
                    Showing module:
                    <span
                      style={{
                        color: "#1d4ed8",
                        marginLeft: "4px",
                      }}
                    >
                      {taxonomyModuleDisplay}
                    </span>
                  </div>
                )}
                <TopicTaxonomyProgression
                  passedModule={taxonomyModuleFilter}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* React Flow Container */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: interactionMode === "add-node" ? "crosshair" : "default",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {!activeModuleId && (
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 15,
              background: "rgba(15, 23, 42, 0.8)",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "12px",
              fontSize: "13px",
              fontFamily: "GlacialIndifference, sans-serif",
            }}
          >
            Select a module to load its thread map.
          </div>
        )}
        {!isStandaloneView && (
          <button
            onClick={handleExpandThreadmap}
            disabled={!activeModuleId}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 16,
              border: "none",
              borderRadius: "9999px",
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#1d4ed8",
              color: "#fff",
              fontFamily: '"GlacialIndifference", sans-serif',
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: activeModuleId ? "pointer" : "not-allowed",
              boxShadow: "0 18px 30px rgba(29, 78, 216, 0.35)",
              opacity: activeModuleId ? 1 : 0.6,
            }}
          >
            <Maximize2 size={16} />
            <span>Open full view</span>
          </button>
        )}
        {isStandaloneView && (
          <button
            onClick={handleCloseThreadmap}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              zIndex: 16,
              border: "none",
              borderRadius: "9999px",
              padding: "8px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#334155",
              color: "#fff",
              fontFamily: '"GlacialIndifference", sans-serif',
              fontSize: "12.5px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 18px 30px rgba(51, 65, 85, 0.35)",
            }}
          >
            <Minimize2 size={16} />
            <span>Back to home</span>
          </button>
        )}
        {err && (
          <div
            style={{
              position: "absolute",
              top: 64,
              right: 16,
              zIndex: 15,
              background: "#fee2e2",
              color: "#b91c1c",
              padding: "10px 16px",
              borderRadius: "12px",
              fontSize: "12.5px",
              fontFamily: "GlacialIndifference, sans-serif",
              maxWidth: "280px",
              boxShadow: "0 18px 30px rgba(185, 28, 28, 0.25)",
            }}
          >
            {err}
          </div>
        )}
        <ReactFlow<FlowNode, FlowEdge>
          nodes={nodes}
          nodeTypes={nodeTypes}
          edges={displayedEdges}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={handleConnectStart}
          onConnectEnd={handleConnectEnd}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onInit={handleInit}
          onMove={handleMove}
          onPaneClick={handlePaneClick}
          nodesDraggable
          nodeDragThreshold={12}
          nodesConnectable={isEditMode}
          elementsSelectable={isEditMode}
          panOnDrag={interactionMode === "cursor"}
          panOnScroll
          zoomOnScroll={false}
          selectionOnDrag={false}
          snapToGrid
          snapGrid={[20, 20]}
          fitView
          attributionPosition="bottom-left"
          connectionMode={ConnectionMode.Loose}
          onNodeDragStart={handleNodeDragStart}
          onNodeDragStop={handleNodeDragStop}
        >
          <Background color="#f0f0f0" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(node: FlowNode) => node.data.color || "#00bcd4"}
            style={{ background: "white", border: "1px solid #ddd" }}
          />

          {interactionMode === "add-node" && hoverNode.visible && (
            <AddNodeHover
              screenPosition={safeHoverScreenPosition}
              onClick={handleAddNodeFromHover}
            />
          )}
        </ReactFlow>

        {/* Popup Modal */}
        {activePopup && popupLayout && popupSizing && (
          <div
            style={{
              position: "absolute",
              top: popupPosition?.y ?? popupSizing.top,
              left: popupPosition?.x ?? popupSizing.left,
              width: popupSize?.width ?? popupSizing.width,
              height: popupSize?.height ?? popupSizing.height,
              background: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 18px 45px rgba(15, 23, 42, 0.25)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 20,
            }}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                padding: "12px 16px",
                background: popupNode?.data.color || "#1f2937",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                cursor: isDraggingPopup ? "grabbing" : "grab",
              }}
              onMouseDown={handlePopupMouseDown}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: 600, fontSize: "14px" }}>
                  {popupNode?.data.node_name || "Node"}
                </span>
                <span style={{ fontSize: "11px", opacity: 0.85 }}>
                  Embedded page preview
                </span>
              </div>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setActivePopup((prev) =>
                      prev ? { ...prev, expanded: !prev.expanded } : prev
                    );
                  }}
                  style={{
                    border: "none",
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    cursor: "pointer",
                    fontWeight: 600,
                    letterSpacing: "0.01em",
                  }}
                >
                  {activePopup.expanded ? "Collapse" : "Open Full Page"}
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    setActivePopup(null);
                  }}
                  style={{
                    border: "none",
                    background: "rgba(255,255,255,0.15)",
                    color: "#fff",
                    width: "28px",
                    height: "28px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                  aria-label="Close embedded page"
                >
                  ×
                </button>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                background: "#f8fafc",
                padding: "16px",
                color: "#475569",
                fontSize: "13px",
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  border: "1px dashed #cbd5f5",
                  borderRadius: "10px",
                  background: "#ffffff",
                  minHeight: activePopup.expanded ? "100%" : "360px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                  fontStyle: "italic",
                }}
              >
                Page content placeholder
              </div>
            </div>
            <div
              onMouseDown={handleResizeMouseDown}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 18,
                height: 18,
                cursor: "nwse-resize",
                background:
                  "linear-gradient(135deg, rgba(148,163,184,0.1) 0%, rgba(148,163,184,0.6) 100%)",
                clipPath: "polygon(100% 0, 0 100%, 100% 100%)",
              }}
            />
          </div>
        )}
      </div>

      {/* Node Input Modal */}
      <NodeInputModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingNodePosition(null);
        }}
        onSave={handleSaveNewNode}
        availableNodes={dbNodes}
        availableModules={availableModules}
      />
    </div>
  );
};

export default ThreadMap;

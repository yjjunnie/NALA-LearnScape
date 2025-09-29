import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
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
} from "@xyflow/react";
import * as d3 from "d3";
import { Maximize2, Minimize2, MousePointer2, Pencil } from "lucide-react";
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
  NodeModule,
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
import {
  getControlMode,
  getControlPanelState,
} from "./threadMap/controlPanelState";

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

  const [err, setErr] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [dbNodes, setDbNodes] = useState<DatabaseNode[]>([]);
  const [dbRelationships, setDbRelationships] = useState<
    DatabaseRelationship[]
  >([]);
  const [moduleLookup, setModuleLookup] = useState<Record<string, NodeModule>>(
    {}
  );

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  //const [showEdges, setShowEdges] = useState<boolean>(false);
  const [controlPosition, setControlPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 24, y: 24 });
  const [isDraggingControl, setIsDraggingControl] = useState(false);

  const availableModules = useMemo(() => {
    const moduleIds = new Set<string>();
    if (activeModuleId) {
      moduleIds.add(activeModuleId);
    }
    dbNodes.forEach((node) => moduleIds.add(node.module_id));

    const modules: NodeModule[] = [];
    moduleIds.forEach((id) => {
      const info = moduleLookup[id];
      if (info) {
        modules.push(info);
      } else {
        modules.push({
          module_id: id,
          color: getColorForModule(id, moduleLookup),
        });
      }
    });

    return modules;
  }, [activeModuleId, dbNodes, moduleLookup]);

  useEffect(() => {
    let isMounted = true;

    if (!activeModuleId) {
      setDbNodes([]);
      setDbRelationships([]);
      setErr(null);
      return () => {
        isMounted = false;
      };
    }

    const fetchThreadMapData = async () => {
      try {
        const [nodesResponse, relationshipsResponse] = await Promise.all([
          fetch(`/api/nodes/${activeModuleId}/`),
          fetch(`/api/relationships/${activeModuleId}/`),
        ]);

        if (!nodesResponse.ok) {
          throw new Error(`Failed to fetch nodes for module ${activeModuleId}`);
        }

        if (!relationshipsResponse.ok) {
          throw new Error(
            `Failed to fetch relationships for module ${activeModuleId}`
          );
        }

        const rawNodes = (await nodesResponse.json()) as RawDatabaseNode[];
        const rawRelationships =
          (await relationshipsResponse.json()) as RawDatabaseRelationship[];

        if (!isMounted) {
          return;
        }

        const normalizedNodes: DatabaseNode[] = Array.isArray(rawNodes)
          ? rawNodes.map((node) => ({
              id: String(node.id),
              type: node.type === "topic" ? "topic" : "concept",
              name: node.name ?? "",
              summary: node.summary ?? undefined,
              related_topic:
                node.related_topic !== null && node.related_topic !== undefined
                  ? String(node.related_topic)
                  : undefined,
              module_id: String(node.module_id ?? activeModuleId),
            }))
          : [];

        const normalizedRelationships: DatabaseRelationship[] = Array.isArray(
          rawRelationships
        )
          ? rawRelationships
              .filter(
                (relationship) =>
                  relationship.first_node !== null &&
                  relationship.first_node !== undefined &&
                  relationship.second_node !== null &&
                  relationship.second_node !== undefined
              )
              .map((relationship) => ({
                id: String(relationship.id),
                first_node: String(relationship.first_node),
                second_node: String(relationship.second_node),
                rs_type: relationship.rs_type ?? "",
              }))
          : [];

        setDbNodes(normalizedNodes);
        setDbRelationships(normalizedRelationships);
        setErr(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error("Error fetching thread map data:", error);
        setErr("Threadmap data failed to load. Please try again later.");
      }
    };

    fetchThreadMapData();

    return () => {
      isMounted = false;
    };
  }, [activeModuleId]);

  useEffect(() => {
    if (!activeModuleId || moduleLookup[activeModuleId]) {
      return;
    }

    let isMounted = true;

    const fetchModule = async () => {
      try {
        const response = await fetch(`/api/module/${activeModuleId}/`);
        if (!response.ok) {
          throw new Error(`Failed to fetch module ${activeModuleId}`);
        }

        const rawModule = (await response.json()) as RawModuleResponse;

        if (!isMounted) {
          return;
        }

        setModuleLookup((prev) => {
          const moduleKey = String(rawModule.id ?? activeModuleId);
          const baseColor =
            prev[moduleKey]?.color ?? getColorForModule(moduleKey, prev);
          return {
            ...prev,
            [moduleKey]: {
              module_id: moduleKey,
              module_name: rawModule.name ?? prev[moduleKey]?.module_name,
              module_index:
                rawModule.index !== undefined && rawModule.index !== null
                  ? String(rawModule.index)
                  : prev[moduleKey]?.module_index,
              color: baseColor,
            },
          };
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Error fetching module metadata:", error);
        setModuleLookup((prev) => {
          if (prev[activeModuleId]) {
            return prev;
          }
          const fallbackColor = getColorForModule(activeModuleId, prev);
          return {
            ...prev,
            [activeModuleId]: {
              module_id: activeModuleId,
              color: fallbackColor,
            },
          };
        });
      }
    };

    fetchModule();

    return () => {
      isMounted = false;
    };
  }, [activeModuleId, moduleLookup]);

  useEffect(() => {
    const moduleIds = Array.from(
      new Set(dbNodes.map((node) => node.module_id))
    );
    const missingIds = moduleIds.filter((moduleId) => !moduleLookup[moduleId]);

    if (missingIds.length === 0) {
      return;
    }

    let isMounted = true;

    const fetchModules = async () => {
      const results = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const response = await fetch(`/api/module/${id}/`);
            if (!response.ok) {
              throw new Error(`Failed to fetch module ${id}`);
            }
            const rawModule = (await response.json()) as RawModuleResponse;
            return { id, rawModule };
          } catch (error) {
            console.error("Error fetching module metadata:", error);
            return { id, rawModule: null };
          }
        })
      );

      if (!isMounted) {
        return;
      }

      setModuleLookup((prev) => {
        const next = { ...prev };
        results.forEach(({ id, rawModule }) => {
          const moduleKey = String(rawModule?.id ?? id);
          const existing = prev[moduleKey];
          const baseColor =
            existing?.color ?? getColorForModule(moduleKey, prev);
          next[moduleKey] = {
            module_id: moduleKey,
            module_name: rawModule?.name ?? existing?.module_name,
            module_index:
              rawModule?.index !== undefined && rawModule?.index !== null
                ? String(rawModule.index)
                : existing?.module_index,
            color: baseColor,
          };
        });
        return next;
      });
    };

    fetchModules();

    return () => {
      isMounted = false;
    };
  }, [dbNodes, moduleLookup]);

  useEffect(() => {
    shouldRunSimulationRef.current = true;
  }, [activeModuleId]);

  useEffect(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setActivePopup(null);
  }, [activeModuleId]);

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
  const [interactionMode, setInteractionMode] = useState<
    "pointer" | "add-node"
  >("pointer");
  const [isInteractionToggleHovered, setIsInteractionToggleHovered] =
    useState(false);
  const [isDeleteHovered, setIsDeleteHovered] = useState(false);
  const [pendingNodePosition, setPendingNodePosition] =
    useState<XYPosition | null>(null);
  const [reactFlowInstance, setReactFlowInstanceState] =
    useState<ReactFlowInstance<FlowNode, FlowEdge> | null>(null);
  const reactFlowInstanceRef = useRef<ReactFlowInstance<FlowNode, FlowEdge> | null>(
    null
  );
  const fitViewRafRef = useRef<number | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [isAddingEdge, setIsAddingEdge] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const isStandaloneView = useMemo(
    () => location.pathname.toLowerCase().includes("threadmap"),
    [location.pathname]
  );
  const controlMode = useMemo(
    () => getControlMode(selectedNode, selectedEdge, isAddingEdge),
    [isAddingEdge, selectedEdge, selectedNode]
  );
  const {
    Icon: ControlIcon,
    color: controlButtonColor,
    shadow: controlButtonShadow,
    label: controlButtonLabel,
    deleteLabel: deleteSelectionLabel,
  } = getControlPanelState(controlMode);
  const isAddMode = interactionMode === "add-node";
  const interactionToggleLabel = isAddMode
    ? "Switch to pointer mode"
    : "Switch to add-node mode";
  const interactionToggleIcon = isAddMode ? (
    <MousePointer2 size={18} />
  ) : (
    <Pencil size={18} />
  );

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
      const conceptGroups = new Map<string, FlowNode[]>();

      updatedNodes.forEach((node) => {
        if (node.data?.node_type === "topic") {
          topicPositions.set(String(node.id), {
            x: node.position?.x ?? 0,
            y: node.position?.y ?? 0,
          });
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

        const angleStep = (2 * Math.PI) / count;
        const radius = Math.max(160, 90 + count * 26);

        sortedChildren.forEach((child, index) => {
          const angle = angleStep * index;
          const x = parentPosition.x + Math.cos(angle) * radius;
          const y = parentPosition.y + Math.sin(angle) * radius;
          child.position = { x, y };
        });
      });

      return updatedNodes;
    });

    if (pendingUsed) {
      pendingNodePositionRef.current = null;
    }
  }, [dbNodes, moduleLookup, selectedNode, setNodes]);

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

      return {
        id: String(rel.id),
        source,
        target,
        type: "hoverLabel",
        style: getEdgeStyle(String(rel.id)),
        animated: false,
        data: { label: rel.rs_type ?? "" },
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
      const angleStep = (2 * Math.PI) / count;
      const radius = Math.max(160, 90 + count * 26);

      sortedChildren.forEach((child, index) => {
        const angle = angleStep * index;
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
    simulation.alphaDecay(0.25);
    simulation.velocityDecay(0.4);

    simulation.force(
      "charge",
      d3
        .forceManyBody()
        .strength((d: any) =>
          (d.data as NodeData).node_type === "topic" ? -460 : -240
        )
        .distanceMax(520)
    );

    simulation.force(
      "collision",
      d3
        .forceCollide()
        .radius((d: any) => {
          const nodeData = d.data as NodeData;
          return nodeData.node_type === "topic" ? 110 : 48;
        })
        .strength(0.9)
        .iterations(2)
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
            return layoutTarget?.radius ?? 170;
          }

          const sourceRoot = findRootTopicId(sourceNode);
          const targetRoot = findRootTopicId(targetNode);
          if (sourceRoot && targetRoot && sourceRoot === targetRoot) return 140;

          return 300;
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
          if (isParentChild) return 1;

          const sourceRoot = findRootTopicId(sourceNode);
          const targetRoot = findRootTopicId(targetNode);
          if (sourceRoot && targetRoot && sourceRoot === targetRoot) return 0.6;

          return 0.18;
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
              const parentX = parentNode.x ?? parentNode.position?.x ?? width / 2;
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
          (d.data as NodeData).node_type === "concept" ? 0.32 : 0.04
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
              const parentY = parentNode.y ?? parentNode.position?.y ?? height / 2;
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
          (d.data as NodeData).node_type === "concept" ? 0.32 : 0.04
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
          (d.data as NodeData).node_type === "topic" ? 0.06 : 0.015
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
          (d.data as NodeData).node_type === "topic" ? 0.06 : 0.015
        )
    );

    let tickCount = 0;
    simulation.on("tick", () => {
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

      tickCount++;
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
      if (reactFlowInstanceRef.current) {
        reactFlowInstanceRef.current.fitView({ padding: 0.35, duration: 350 });
      }
    });

    simulation.alpha(0.9).restart();
  }, [nodes, edges, setNodes]);

  const handleConnectStart = useCallback<OnConnectStart>(() => {
    setIsAddingEdge(true);
    setShowInfoTooltip(false);
  }, []);

  const handleConnectEnd = useCallback<OnConnectEnd>(() => {
    setIsAddingEdge(false);
  }, []);

  // Handle connection
  const onConnect: OnConnect = useCallback(
    (params) => {
      if (!params.source || !params.target) return;

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
    [dbRelationships]
  );

  // Handle node click - only select, don't trigger layout
  const handleNodeClick: NodeMouseHandler<FlowNode> = useCallback(
    (event, node) => {
      event.stopPropagation();
      setSelectedNode((prev) => (prev === node.id ? null : node.id));
      setSelectedEdge(null); // Deselect edge when selecting node
      setActivePopup((prev) => {
        if (prev?.nodeId === node.id) return null;
        return { nodeId: node.id, expanded: false };
      });
    },
    []
  );

  // Handle edge click - select edge for deletion
  const handleEdgeClick: EdgeMouseHandler<FlowEdge> = useCallback(
    (event, edge) => {
      event.stopPropagation();
      setSelectedEdge((prev) => (prev === edge.id ? null : edge.id));
      setSelectedNode(null); // Deselect node when selecting edge
    },
    []
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
  }, [controlButtonSize, controlPosition.x, controlPosition.y, hoverNode, viewport]);

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

  const handleToggleInteractionMode = useCallback(() => {
    setInteractionMode((prev) => (prev === "pointer" ? "add-node" : "pointer"));
  }, []);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;

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
  }, [selectedNode]);

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdge) return;

    setDbRelationships((prev) => prev.filter((rel) => rel.id !== selectedEdge));
    setSelectedEdge(null);
    shouldRunSimulationRef.current = true;
  }, [selectedEdge]);

  const handleControlClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      if (controlDraggedRef.current) {
        controlDraggedRef.current = false;
        return;
      }

      if (controlMode === "edge") {
        setIsAddingEdge(false);
        return;
      }

      if (controlMode === "delete-node") {
        setSelectedNode(null);
        setShowInfoTooltip(false);
        return;
      }

      if (controlMode === "delete-edge") {
        setSelectedEdge(null);
        setShowInfoTooltip(false);
      }
      if (controlMode === "info") {
        setShowInfoTooltip(false);
      }
    },
    [controlMode]
  );

  const handleControlMouseEnter = useCallback(() => {
    if (controlMode === "info") {
      setShowInfoTooltip(true);
    }
  }, [controlMode]);

  const handleControlMouseLeave = useCallback(() => {
    if (controlMode === "info") {
      setShowInfoTooltip(false);
    }
  }, [controlMode]);

  const handleDeleteSelection = useCallback(() => {
    if (controlMode === "delete-node") {
      deleteSelectedNode();
    } else if (controlMode === "delete-edge") {
      deleteSelectedEdge();
    }
    setIsDeleteHovered(false);
  }, [controlMode, deleteSelectedEdge, deleteSelectedNode]);

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
    if (controlMode !== "info") {
      setShowInfoTooltip(false);
    }
  }, [controlMode]);

  useEffect(() => {
    if (interactionMode !== "add-node") {
      setHoverNode((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    } else {
      setIsAddingEdge(false);
    }
  }, [interactionMode]);

  useEffect(() => {
    if (controlMode !== "delete-node" && controlMode !== "delete-edge") {
      setIsDeleteHovered(false);
    }
  }, [controlMode]);

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
  const getEdgeCount = (): number => dbRelationships.length;

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
              onClick={handleControlClick}
              onMouseEnter={handleControlMouseEnter}
              onMouseLeave={handleControlMouseLeave}
              aria-label={controlButtonLabel}
              title={controlButtonLabel}
              style={{
                width: controlButtonSize,
                height: controlButtonSize,
                borderRadius: "50%",
                border: "none",
                background: controlButtonColor,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: controlButtonShadow,
                cursor: isDraggingControl ? "grabbing" : "grab",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                transform: isDraggingControl ? "scale(0.98)" : "scale(1)",
              }}
            >
              <ControlIcon size={22} />
            </button>
            {(controlMode === "delete-node" || controlMode === "delete-edge") && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDeleteSelection();
                }}
                onMouseEnter={() => setIsDeleteHovered(true)}
                onMouseLeave={() => setIsDeleteHovered(false)}
                style={{
                  border: "none",
                  borderRadius: "9999px",
                  padding: "10px 16px",
                  fontFamily: '"GlacialIndifference", sans-serif',
                  fontSize: "12px",
                  fontWeight: 600,
                  background: isDeleteHovered ? "#b91c1c" : "#dc2626",
                  color: "#fff",
                  boxShadow: "0 12px 26px rgba(220, 38, 38, 0.4)",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                {deleteSelectionLabel ?? ""}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleToggleInteractionMode();
              setIsInteractionToggleHovered(false);
            }}
            onMouseEnter={() => setIsInteractionToggleHovered(true)}
            onMouseLeave={() => setIsInteractionToggleHovered(false)}
            aria-pressed={interactionMode === "add-node"}
            aria-label={interactionToggleLabel}
            title={interactionToggleLabel}
            style={{
              width: controlButtonSize - 6,
              height: controlButtonSize - 6,
              borderRadius: "50%",
              border: "none",
              background: isInteractionToggleHovered
                ? interactionMode === "add-node"
                  ? "#1e40af"
                  : "#334155"
                : interactionMode === "add-node"
                ? "#1d4ed8"
                : "#475569",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                interactionMode === "add-node"
                  ? "0 12px 26px rgba(29, 78, 216, 0.45)"
                  : "0 10px 22px rgba(71, 85, 105, 0.35)",
              cursor: "pointer",
              transition: "background 0.2s ease, box-shadow 0.2s ease",
            }}
          >
            {interactionToggleIcon}
          </button>
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
            onMouseEnter={() => {
              if (controlMode === "info") {
                setShowInfoTooltip(true);
              }
            }}
            onMouseLeave={() => {
              if (controlMode === "info") {
                setShowInfoTooltip(false);
              }
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
          </div>
        )}
      </div>

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
          //edges={showEdges ? edges : []}
          edges={edges}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={handleConnectStart}
          onConnectEnd={handleConnectEnd}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onInit={handleInit}
          onMove={handleMove}
          onPaneClick={handlePaneClick}
          nodesDraggable={interactionMode === "pointer"}
          nodeDragThreshold={interactionMode === "pointer" ? 14 : 999}
          panOnDrag={interactionMode === "pointer"}
          panOnScroll
          zoomOnScroll={false}
          selectionOnDrag={false}
          snapToGrid
          snapGrid={[20, 20]}
          fitView
          attributionPosition="bottom-left"
          connectionMode={ConnectionMode.Loose}
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

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
  NodeChange,
  OnNodeDrag,
  OnMove,
  Viewport,
  EdgeMouseHandler,
} from "@xyflow/react";
import * as d3 from "d3";
import { Trash2 } from "lucide-react";
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

const ThreadMap: React.FC<{ module_id: string }> = ({ module_id }) => {
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

  const availableModules = useMemo(() => {
    const moduleIds = new Set<string>();
    if (module_id) {
      moduleIds.add(module_id);
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
  }, [dbNodes, moduleLookup, module_id]);

  useEffect(() => {
    let isMounted = true;

    if (!module_id) {
      setDbNodes([]);
      setDbRelationships([]);
      return () => {
        isMounted = false;
      };
    }

    const fetchThreadMapData = async () => {
      try {
        const [nodesResponse, relationshipsResponse] = await Promise.all([
          fetch(`/api/nodes/${module_id}`),
          fetch(`/api/relationships/${module_id}`),
        ]);

        if (!nodesResponse.ok) {
          throw new Error(`Failed to fetch nodes for module ${module_id}`);
        }

        if (!relationshipsResponse.ok) {
          throw new Error(
            `Failed to fetch relationships for module ${module_id}`
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
              module_id: String(node.module_id ?? module_id),
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
  }, [module_id]);

  useEffect(() => {
    if (!module_id || moduleLookup[module_id]) {
      return;
    }

    let isMounted = true;

    const fetchModule = async () => {
      try {
        const response = await fetch(`/api/module/${module_id}/`);
        if (!response.ok) {
          throw new Error(`Failed to fetch module ${module_id}`);
        }

        const rawModule = (await response.json()) as RawModuleResponse;

        if (!isMounted) {
          return;
        }

        setModuleLookup((prev) => {
          const moduleKey = String(rawModule.id ?? module_id);
          const baseColor = prev[moduleKey]?.color ?? getColorForModule(moduleKey, prev);
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
          if (prev[module_id]) {
            return prev;
          }
          const fallbackColor = getColorForModule(module_id, prev);
          return {
            ...prev,
            [module_id]: {
              module_id,
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
  }, [module_id, moduleLookup]);

  useEffect(() => {
    const moduleIds = Array.from(new Set(dbNodes.map((node) => node.module_id)));
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
          const baseColor = existing?.color ?? getColorForModule(moduleKey, prev);
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
  const [pendingNodePosition, setPendingNodePosition] =
    useState<XYPosition | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    FlowNode,
    FlowEdge
  > | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });

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
  const draggedNodeIdRef = useRef<string | null>(null); // Tracks the ID of the node currently being dragged
  const shouldRunSimulationRef = useRef<boolean>(false); //A flag indicating whether the D3 simulation should run to adjust node positions

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

      const updatedNodes = dbNodes.map((node) => {
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

      return updatedNodes;
    });

    if (pendingUsed) {
      pendingNodePositionRef.current = null;
    }
  }, [dbNodes, moduleLookup, selectedNode, setNodes]);

  // Sync edges with database relationships
  useEffect(() => {
    const hadEdges = edges.length > 0;
    const newEdges = dbRelationships.map((rel) => ({
      id: rel.id,
      source: rel.first_node,
      target: rel.second_node,
      type: "hoverLabel",
      style: {
        stroke: selectedEdge === rel.id ? "#ff6b6b" : "#b1b1b7",
        strokeWidth: selectedEdge === rel.id ? 3 : 2,
      },
      animated: false,
      data: { label: rel.rs_type },
    }));

    setEdges(newEdges);

    // If new edges were added, run simulation for layout optimization
    if (!hadEdges && newEdges.length > 0) {
      shouldRunSimulationRef.current = true;
    }
  }, [dbRelationships, selectedEdge, setEdges]);

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

    const activeDraggedId = draggedNodeIdRef.current;
    const simulationNodes = nodes.map((node) => ({
      ...node,
      x: node.position.x,
      y: node.position.y,
      fx: node.id === activeDraggedId ? node.position.x : null,
      fy: node.id === activeDraggedId ? node.position.y : null,
    }));

    const simulationNodeMap = new Map(
      simulationNodes.map((node) => [node.id, node])
    );
    const linkData = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    simulation.nodes(simulationNodes as any);
    simulation.force("center", d3.forceCenter(width / 2, height / 2));
    simulation.alphaDecay(0.25);
    simulation.velocityDecay(0.4);

    simulation.force(
      "charge",
      d3
        .forceManyBody()
        .strength((d: any) =>
          (d.data as NodeData).node_type === "topic" ? -320 : -160
        )
        .distanceMax(240)
    );

    simulation.force(
      "collision",
      d3
        .forceCollide()
        .radius((d: any) => {
          const nodeData = d.data as NodeData;
          return nodeData.node_type === "topic" ? 95 : 60;
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
          if (isParentChild) return 110;

          const sourceRoot = findRootTopicId(sourceNode);
          const targetRoot = findRootTopicId(targetNode);
          if (sourceRoot && targetRoot && sourceRoot === targetRoot) return 160;

          return 220;
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
          if (sourceRoot && targetRoot && sourceRoot === targetRoot) return 0.5;

          return 0.25;
        })
    );

    simulation.force(
      "concept-x",
      d3
        .forceX((d: any) => {
          const data = d.data as NodeData;
          if (data.node_type === "concept" && data.parent_node_id) {
            const parentNode = simulationNodeMap.get(data.parent_node_id);
            if (parentNode)
              return parentNode.x ?? parentNode.position?.x ?? width / 2;
          }
          return d.x ?? width / 2;
        })
        .strength((d: any) =>
          (d.data as NodeData).node_type === "concept" ? 0.12 : 0.02
        )
    );

    simulation.force(
      "concept-y",
      d3
        .forceY((d: any) => {
          const data = d.data as NodeData;
          if (data.node_type === "concept" && data.parent_node_id) {
            const parentNode = simulationNodeMap.get(data.parent_node_id);
            if (parentNode)
              return parentNode.y ?? parentNode.position?.y ?? height / 2;
          }
          return d.y ?? height / 2;
        })
        .strength((d: any) =>
          (d.data as NodeData).node_type === "concept" ? 0.12 : 0.02
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
    });

    simulation.alpha(0.9).restart();
  }, [nodes, edges, setNodes]);

  // Handle connection
  const onConnect: OnConnect = useCallback(
    (params) => {
      if (!params.source || !params.target) return;

      const newRelationship: DatabaseRelationship = {
        id: Math.max(...dbRelationships.map((r) => r.id), 0) + 1,
        first_node: params.source,
        second_node: params.target,
        rs_type: "",
      };

      setDbRelationships((prev) => [...prev, newRelationship]);
      shouldRunSimulationRef.current = true; // Run simulation for new edge
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
  }, []);

  // Handle mouse move for hover node
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!reactFlowInstance) return;

      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;

      const flowPosition = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const screenPosition = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      };

      const isTooCloseToNode = nodes.some((node) => {
        const nodeSize = node.data.node_type === "topic" ? 120 : 80;
        const distance = Math.sqrt(
          Math.pow(flowPosition.x - node.position.x, 2) +
            Math.pow(flowPosition.y - node.position.y, 2)
        );
        return distance < nodeSize;
      });

      setHoverNode({
        flowPosition,
        screenPosition,
        visible: !isTooCloseToNode,
      });
    },
    [reactFlowInstance, nodes]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverNode((prev) => ({ ...prev, visible: false }));
  }, []);

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

  const handleNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      // Only allow position and dimension changes during drag, prevent other movements
      const filteredChanges = changes.filter((change) => {
        if (change.type === "position" && !draggedNodeIdRef.current) {
          return false; // Block position changes when not dragging
        }
        return true;
      });

      onNodesChange(filteredChanges);
    },
    [onNodesChange]
  );

  const handleNodeDragStart: OnNodeDrag<FlowNode> = useCallback(
    (_event, node) => {
      setSelectedNode(node.id);
      draggedNodeIdRef.current = node.id;
      shouldRunSimulationRef.current = true;

      if (simulationRef.current) {
        simulationRef.current.alphaTarget(0.4).restart();
      }
    },
    []
  );

  const handleNodeDrag: OnNodeDrag<FlowNode> = useCallback(
    (_event, node) => {
      setNodes((prev) =>
        prev.map((existing) =>
          existing.id === node.id
            ? { ...existing, position: { ...node.position } }
            : existing
        )
      );

      if (simulationRef.current) {
        const nodesInSim = simulationRef.current.nodes() as any[];
        const simNode = nodesInSim.find((n) => n.id === node.id);
        if (simNode) {
          simNode.fx = node.position.x;
          simNode.fy = node.position.y;
          simNode.x = node.position.x;
          simNode.y = node.position.y;
        }
        simulationRef.current.alphaTarget(0.4).restart();
      }
    },
    [setNodes]
  );

  const handleNodeDragStop: OnNodeDrag<FlowNode> = useCallback(
    (_event, node) => {
      draggedNodeIdRef.current = null;
      shouldRunSimulationRef.current = true;

      if (simulationRef.current) {
        const nodesInSim = simulationRef.current.nodes() as any[];
        const simNode = nodesInSim.find((n) => n.id === node.id);
        if (simNode) {
          simNode.fx = null;
          simNode.fy = null;
        }
        simulationRef.current.alphaTarget(0);
        simulationRef.current.alpha(0.5).restart();
      }
    },
    []
  );

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;

    setDbNodes((prev) => prev.filter((node) => node.id !== selectedNode));
    setDbRelationships((prev) =>
      prev.filter(
        (rel) => rel.id !== selectedNode && rel.second_node !== selectedNode
      )
    );
    setSelectedNode(null);
    setActivePopup((prev) => (prev?.nodeId === selectedNode ? null : prev));
  }, [selectedNode]);

  // Delete selected edge
  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdge) return;

    setDbRelationships((prev) => prev.filter((rel) => rel.id !== selectedEdge));
    setSelectedEdge(null);
  }, [selectedEdge]);

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

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Control Panel */}
      <div
        style={{
          fontFamily: "GlacialIndifference, sans-serif",
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 10,
          background: "white",
          padding: "16px",
          borderRadius: "8px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          minWidth: "200px",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          Mindmap Controls
        </h3>

        <div style={{ marginBottom: "12px", fontSize: "12px", color: "#666" }}>
          Nodes: {getNodeCount()} | Edges: {getEdgeCount()}
        </div>

        <div
          style={{
            marginBottom: "12px",
            fontSize: "11px",
            color: "#666",
            lineHeight: "1.4",
          }}
        >
          • Hover over empty space to add nodes
          <br />
          • Drag from node handles to create edges
          <br />• Click nodes/edges to select/delete
        </div>

        {selectedNode && (
          <button
            onClick={deleteSelectedNode}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
              background: "#e53e3e",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Trash2 size={14} style={{ marginRight: "4px" }} />
            Delete Selected Node
          </button>
        )}

        {selectedEdge && (
          <button
            onClick={deleteSelectedEdge}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 12px",
              background: "#e53e3e",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
              width: "100%",
              justifyContent: "center",
            }}
          >
            <Trash2 size={14} style={{ marginRight: "4px" }} />
            Delete Selected Edge
          </button>
        )}
      </div>

      {/* React Flow Container */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <ReactFlow<FlowNode, FlowEdge>
          nodes={nodes}
          nodeTypes={nodeTypes}
          edges={edges}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onNodeDragStart={handleNodeDragStart}
          onNodeDrag={handleNodeDrag}
          onNodeDragStop={handleNodeDragStop}
          onInit={setReactFlowInstance}
          onMove={handleMove}
          onPaneClick={handlePaneClick}
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

          {hoverNode.visible && (
            <AddNodeHover
              screenPosition={hoverNode.screenPosition}
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

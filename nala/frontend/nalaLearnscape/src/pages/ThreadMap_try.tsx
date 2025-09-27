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
  addEdge,
  ConnectionMode,
} from "@xyflow/react";
import type {
  OnConnect,
  NodeMouseHandler,
  ReactFlowInstance,
  XYPosition,
  NodeChange,
  OnNodeDrag,
} from "@xyflow/react";
import * as d3 from "d3";
import { Trash2 } from "lucide-react";
import "@xyflow/react/dist/style.css";
import type {
  FlowNode,
  FlowEdge,
  NodeData,
  DatabaseNode,
  DatabaseRelationship,
  HoverNode,
} from "./threadMap/types";
import {
  mockDatabaseNodes,
  mockDatabaseRelationships,
} from "./threadMap/mockData";
import {
  getColorForModule,
  getTopicColor,
  generateDistinctTopicColor,
} from "./threadMap/colorUtils";
import ConceptNode from "./threadMap/ConceptNode";
import NodeInputModal from "./threadMap/NodeInputModal";
import HoverLabelEdge from "./threadMap/HoverLabelEdge";
import AddNodeHover from "./threadMap/AddNodeHover";

const Flow: React.FC = () => {
  const nodeTypes = useMemo(
    () => ({ conceptNode: ConceptNode, topicNode: ConceptNode }),
    []
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [dbNodes, setDbNodes] = useState<DatabaseNode[]>(mockDatabaseNodes);
  const [dbRelationships, setDbRelationships] = useState<
    DatabaseRelationship[]
  >(mockDatabaseRelationships);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
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
  const simulationRef = useRef<d3.Simulation<any, undefined> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingNodePositionRef = useRef<XYPosition | null>(null);
  const isSimulationTickRef = useRef<boolean>(false);
  const draggedNodeIdRef = useRef<string | null>(null);
  const edgeTypes = useMemo(() => ({ hoverLabel: HoverLabelEdge }), []);

  // Sync nodes with database entries while preserving positions
  useEffect(() => {
    let pendingUsed = false;
    const pendingSnapshot = pendingNodePositionRef.current;

    setNodes((prevNodes) => {
      const containerBounds = containerRef.current;
      const width = containerBounds?.clientWidth ?? 800;
      const height = containerBounds?.clientHeight ?? 600;
      const existingMap = new Map(prevNodes.map((node) => [node.id, node]));
      const colorCache = new Map<string, string>();

      prevNodes.forEach((node) => {
        if (node.data?.color) {
          colorCache.set(node.id, node.data.color);
        }
      });

      const updatedNodes = dbNodes.map((dbNode) => {
        const baseColor = getColorForModule(dbNode.node_module_id);
        let nodeColor = colorCache.get(dbNode.node_id);

        if (!nodeColor) {
          if (dbNode.node_type === "topic") {
            const usedColors = new Set(colorCache.values());
            nodeColor = generateDistinctTopicColor(usedColors);
          } else if (dbNode.parent_node_id) {
            nodeColor = colorCache.get(dbNode.parent_node_id);
          }
        }

        if (!nodeColor) {
          nodeColor =
            dbNode.node_type === "topic" ? getTopicColor(baseColor) : baseColor;
        }

        const existing = existingMap.get(dbNode.node_id);

        let position = existing?.position;

        if (!position) {
          if (pendingSnapshot && !pendingUsed) {
            position = { ...pendingSnapshot };
            pendingUsed = true;
          } else {
            const parentNode = prevNodes.find(
              (node) => node.id === dbNode.parent_node_id
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
        }

        const data: NodeData = {
          node_id: dbNode.node_id,
          node_name: dbNode.node_name,
          node_description: dbNode.node_description,
          node_type: dbNode.node_type,
          parent_node_id: dbNode.parent_node_id,
          node_module_id: dbNode.node_module_id,
          color: nodeColor,
        };

        colorCache.set(dbNode.node_id, nodeColor);

        const baseNode: FlowNode = existing
          ? {
              ...existing,
              type: dbNode.node_type === "topic" ? "topicNode" : "conceptNode",
              position: position ?? existing.position,
              data,
              selected: selectedNode === dbNode.node_id,
            }
          : {
              id: dbNode.node_id,
              type: dbNode.node_type === "topic" ? "topicNode" : "conceptNode",
              position: position ?? { x: 0, y: 0 },
              data,
              selected: selectedNode === dbNode.node_id,
            };

        return baseNode;
      });

      return updatedNodes;
    });

    if (pendingUsed) {
      pendingNodePositionRef.current = null;
    }
  }, [dbNodes, selectedNode, setNodes]);

  // Sync edges with database relationships
  useEffect(() => {
    setEdges(
      dbRelationships.map((rel) => ({
        id: `e${rel.node_id_1}-${rel.node_id_2}`,
        source: rel.node_id_1,
        target: rel.node_id_2,
        type: "hoverLabel",
        style: { stroke: "#b1b1b7", strokeWidth: 2 },
        animated: false,
        data: { label: rel.relationship_type },
      }))
    );
  }, [dbRelationships, setEdges]);

  // Ensure simulation stops on unmount
  useEffect(() => {
    return () => {
      simulationRef.current?.stop();
    };
  }, []);

  // Reconfigure D3 simulation when nodes/edges change outside of tick updates
  useEffect(() => {
    if (nodes.length === 0) return;

    const triggeredBySimulation = isSimulationTickRef.current;
    isSimulationTickRef.current = false;
    if (triggeredBySimulation) {
      return;
    }

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
      if (!node || visited.has(node.id)) {
        return null;
      }
      visited.add(node.id);
      if (node.data.node_type === "topic") {
        return node.id;
      }
      if (!node.data.parent_node_id) {
        return null;
      }
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

          const baseDistance = 220;
          const isParentChild =
            sourceNode?.data?.parent_node_id === targetNode?.id ||
            targetNode?.data?.parent_node_id === sourceNode?.id;

          if (isParentChild) {
            return 110;
          }

          const sourceRoot = findRootTopicId(sourceNode);
          const targetRoot = findRootTopicId(targetNode);

          if (sourceRoot && targetRoot && sourceRoot === targetRoot) {
            return 160;
          }

          return baseDistance;
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

          if (isParentChild) {
            return 0.9;
          }

          const sourceRoot = findRootTopicId(sourceNode);
          const targetRoot = findRootTopicId(targetNode);

          if (sourceRoot && targetRoot && sourceRoot === targetRoot) {
            return 0.5;
          }

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
            if (parentNode) {
              return parentNode.x ?? parentNode.position?.x ?? width / 2;
            }
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
            if (parentNode) {
              return parentNode.y ?? parentNode.position?.y ?? height / 2;
            }
          }
          return d.y ?? height / 2;
        })
        .strength((d: any) =>
          (d.data as NodeData).node_type === "concept" ? 0.12 : 0.02
        )
    );

    simulation.on("tick", () => {
      isSimulationTickRef.current = true;
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
    });

    simulation.alpha(0.9).restart();
  }, [nodes, edges, setNodes]);

  // D3 Force Layout
  // Handle connection
  const onConnect: OnConnect = useCallback(
    (params) => {
      if (!params.source || !params.target) return;

      const newEdge: FlowEdge = {
        id: `e${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        type: "hoverLabel",
        style: { stroke: "#b1b1b7", strokeWidth: 2 },
        data: { label: "" },
      };

      // Add to database relationships
      const newRelationship: DatabaseRelationship = {
        relationship_id:
          Math.max(...dbRelationships.map((r) => r.relationship_id), 0) + 1,
        node_id_1: params.source,
        node_id_2: params.target,
        relationship_type: "",
      };

      setDbRelationships((prev) => [...prev, newRelationship]);
      setEdges((els) => addEdge<FlowEdge>(newEdge, els));
    },
    [dbRelationships, setEdges]
  );

  // Handle node click
  const handleNodeClick: NodeMouseHandler<FlowNode> = useCallback(
    (event, node) => {
      setSelectedNode(selectedNode === node.id ? null : node.id);
    },
    [selectedNode]
  );

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

      // Check if mouse is over any existing node
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

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setHoverNode((prev) => ({ ...prev, visible: false }));
  }, []);

  // Handle add node from hover
  const handleAddNodeFromHover = useCallback(() => {
    setPendingNodePosition(hoverNode.flowPosition);
    setIsModalOpen(true);
    setHoverNode((prev) => ({ ...prev, visible: false }));
  }, [hoverNode.flowPosition]);

  // Handle save new node
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

      const newNodeId = (
        Math.max(...dbNodes.map((n) => parseInt(n.node_id)), 0) + 1
      ).toString();

      const newDbNode: DatabaseNode = {
        node_id: newNodeId,
        node_type: nodeType,
        node_name: nodeName,
        node_description: nodeDescription || undefined,
        parent_node_id: parentNodeId,
        node_module_id: moduleId,
      };

      setDbNodes((prev) => [...prev, newDbNode]);
      if (parentNodeId) {
        setDbRelationships((prev) => {
          const nextId =
            prev.length > 0
              ? Math.max(...prev.map((rel) => rel.relationship_id)) + 1
              : 1;
          return [
            ...prev,
            {
              relationship_id: nextId,
              node_id_1: parentNodeId,
              node_id_2: newNodeId,
              relationship_type: "",
            },
          ];
        });
      }
      setPendingNodePosition(null);
    },
    [pendingNodePosition, dbNodes]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      onNodesChange(changes);
      if (simulationRef.current) {
        simulationRef.current.alpha(0.7).restart();
      }
    },
    [onNodesChange]
  );

  const handleNodeDragStart: OnNodeDrag<FlowNode> = useCallback(
    (event, node) => {
      setSelectedNode(node.id);
      draggedNodeIdRef.current = node.id;
      if (simulationRef.current) {
        simulationRef.current.alphaTarget(0.3).restart();
      }
    },
    []
  );

  const handleNodeDrag: OnNodeDrag<FlowNode> = useCallback(
    (event, node) => {
      isSimulationTickRef.current = true;
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
      }
    },
    [setNodes]
  );

  const handleNodeDragStop: OnNodeDrag<FlowNode> = useCallback(
    (event, node) => {
      draggedNodeIdRef.current = null;
      if (simulationRef.current) {
        const nodesInSim = simulationRef.current.nodes() as any[];
        const simNode = nodesInSim.find((n) => n.id === node.id);
        if (simNode) {
          simNode.fx = null;
          simNode.fy = null;
        }
        simulationRef.current.alphaTarget(0);
        simulationRef.current.alpha(0.4).restart();
      }
    },
    []
  );

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;

    setDbNodes((prev) => prev.filter((node) => node.node_id !== selectedNode));
    setDbRelationships((prev) =>
      prev.filter(
        (rel) =>
          rel.node_id_1 !== selectedNode && rel.node_id_2 !== selectedNode
      )
    );
    setSelectedNode(null);
  }, [selectedNode]);

  const getNodeCount = (): number => dbNodes.length;
  const getEdgeCount = (): number => dbRelationships.length;

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      {/* Control Panel */}
      <div
        style={{
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
          style={{ margin: "0 0 12px 0", fontSize: "16px", fontWeight: "bold" }}
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
          <br />• Click nodes to select/delete
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
            Delete Selected
          </button>
        )}
      </div>

      {/* React Flow Container */}
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%" }}
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
          onNodeDragStart={handleNodeDragStart}
          onNodeDrag={handleNodeDrag}
          onNodeDragStop={handleNodeDragStop}
          onInit={setReactFlowInstance}
          fitView
          attributionPosition="bottom-left"
          connectionMode={ConnectionMode.Loose}
        >
          <Background color="#f0f0f0" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={(node: FlowNode) => node.data.color || "#00bcd4"}
            style={{
              background: "white",
              border: "1px solid #ddd",
            }}
          />

          {/* Hover Add Node */}
          {hoverNode.visible && (
            <AddNodeHover
              screenPosition={hoverNode.screenPosition}
              onClick={handleAddNodeFromHover}
            />
          )}
        </ReactFlow>
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
      />
    </div>
  );
};

export default Flow;

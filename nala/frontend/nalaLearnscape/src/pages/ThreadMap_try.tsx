import React, { useCallback, useEffect, useState, useRef } from "react";
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
  Node,
  Edge,
  OnConnect,
  NodeMouseHandler,
  ReactFlowInstance,
  XYPosition,
  NodeChange,
} from "@xyflow/react";
import * as d3 from "d3";
import { Plus, Trash2 } from "lucide-react";
import "@xyflow/react/dist/style.css";

interface NodeData extends Record<string, unknown> {
  node_id: string;
  node_name: string;
  node_description?: string;
  node_type: "topic" | "concept";
  parent_node_id?: string;
  node_module_id: string;
  color?: string;
}

type FlowNode = Node<NodeData>;
type FlowEdge = Edge;

interface DatabaseNode {
  node_id: string;
  node_type: "topic" | "concept";
  node_name: string;
  node_description?: string;
  parent_node_id?: string;
  node_module_id: string;
}

interface DatabaseRelationship {
  relationship_id: number;
  node_id_1: string;
  node_id_2: string;
  relationship_type: string;
}

interface HoverNode {
  position: XYPosition;
  visible: boolean;
}

interface NodeModule {
  module_id: string;
  module_name: string;
  color: string;
}

// Mock database data matching your schema
const mockDatabaseNodes: DatabaseNode[] = [
  {
    node_id: "1",
    node_type: "topic",
    node_name: "Logic",
    node_description: "Mathematical logic fundamentals",
    node_module_id: "MOD_001",
  },
  {
    node_id: "2",
    node_type: "concept",
    node_name: "Propositions",
    node_description: "Basic logical statements",
    parent_node_id: "1",
    node_module_id: "MOD_001",
  },
  {
    node_id: "3",
    node_type: "concept",
    node_name: "Truth tables",
    node_description: "Truth value analysis",
    parent_node_id: "1",
    node_module_id: "MOD_001",
  },
  {
    node_id: "4",
    node_type: "concept",
    node_name: "Logical Equivalence Laws",
    node_description: "Equivalence rules",
    parent_node_id: "1",
    node_module_id: "MOD_001",
  },
  {
    node_id: "5",
    node_type: "concept",
    node_name: "De Morgan's Laws",
    node_description: "Negation distribution laws",
    parent_node_id: "1",
    node_module_id: "MOD_001",
  },
  {
    node_id: "6",
    node_type: "concept",
    node_name: "Logical Operators",
    node_description: "AND, OR, NOT operations",
    parent_node_id: "1",
    node_module_id: "MOD_001",
  },
  {
    node_id: "7",
    node_type: "concept",
    node_name: "Inference Rules",
    node_description: "Rules for logical deduction",
    parent_node_id: "1",
    node_module_id: "MOD_001",
  },
  {
    node_id: "8",
    node_type: "concept",
    node_name: "Proof by Contradiction",
    node_description: "Indirect proof method",
    parent_node_id: "7",
    node_module_id: "MOD_002",
  },
  {
    node_id: "9",
    node_type: "concept",
    node_name: "Proof by Contrapositive",
    node_description: "Contrapositive proof method",
    parent_node_id: "7",
    node_module_id: "MOD_002",
  },
  {
    node_id: "10",
    node_type: "topic",
    node_name: "Set Theory",
    node_description: "Mathematical set operations",
    node_module_id: "MOD_003",
  },
  {
    node_id: "11",
    node_type: "concept",
    node_name: "Discrete Proof",
    node_description: "Discrete mathematics proofs",
    parent_node_id: "10",
    node_module_id: "MOD_002",
  },
  {
    node_id: "12",
    node_type: "concept",
    node_name: "Proof Techniques",
    node_description: "Various proof methods",
    parent_node_id: "11",
    node_module_id: "MOD_002",
  },
];

const mockDatabaseRelationships: DatabaseRelationship[] = [
  {
    relationship_id: 1,
    node_id_1: "1",
    node_id_2: "2",
    relationship_type: "contains",
  },
  {
    relationship_id: 2,
    node_id_1: "1",
    node_id_2: "3",
    relationship_type: "contains",
  },
  {
    relationship_id: 3,
    node_id_1: "1",
    node_id_2: "4",
    relationship_type: "contains",
  },
  {
    relationship_id: 4,
    node_id_1: "1",
    node_id_2: "5",
    relationship_type: "contains",
  },
  {
    relationship_id: 5,
    node_id_1: "1",
    node_id_2: "6",
    relationship_type: "contains",
  },
  {
    relationship_id: 6,
    node_id_1: "1",
    node_id_2: "7",
    relationship_type: "contains",
  },
  {
    relationship_id: 7,
    node_id_1: "7",
    node_id_2: "8",
    relationship_type: "leads_to",
  },
  {
    relationship_id: 8,
    node_id_1: "7",
    node_id_2: "9",
    relationship_type: "leads_to",
  },
  {
    relationship_id: 9,
    node_id_1: "7",
    node_id_2: "11",
    relationship_type: "leads_to",
  },
  {
    relationship_id: 10,
    node_id_1: "11",
    node_id_2: "12",
    relationship_type: "uses",
  },
  {
    relationship_id: 11,
    node_id_1: "10",
    node_id_2: "1",
    relationship_type: "related_to",
  },
];

// Module definitions for color coding
const nodeModules: NodeModule[] = [
  { module_id: "MOD_001", module_name: "Basic Logic", color: "#00bcd4" },
  { module_id: "MOD_002", module_name: "Proof Methods", color: "#5c9cfc" },
  { module_id: "MOD_003", module_name: "Set Theory", color: "#4a85f5" },
  { module_id: "MOD_004", module_name: "Number Theory", color: "#ff6b35" },
  { module_id: "MOD_005", module_name: "Graph Theory", color: "#4caf50" },
];

// Color generation function
const getColorForModule = (moduleId: string): string => {
  const module = nodeModules.find((m) => m.module_id === moduleId);
  if (module) return module.color;

  // Generate consistent color based on module_id if not found
  const colors = [
    "#00bcd4",
    "#5c9cfc",
    "#4a85f5",
    "#ff6b35",
    "#4caf50",
    "#9c27b0",
    "#ff9800",
    "#e91e63",
  ];
  const hash = moduleId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
};

// Get topic color (slightly darker for topics)
const getTopicColor = (moduleColor: string): string => {
  // Convert hex to RGB, darken it, convert back to hex
  const hex = moduleColor.replace("#", "");
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 20);
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 20);
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 20);
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

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

  // Get module info for display
  const moduleInfo = nodeModules.find(
    (m) => m.module_id === data.node_module_id
  );
  const moduleNumber = data.node_module_id.replace(/\D/g, ""); // Extract number from MOD_001

  return (
    <div className="relative">
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          backgroundColor: data.color || "#00bcd4",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: fontSize,
          fontWeight: "bold",
          textAlign: "center",
          cursor: "pointer",
          border: selected
            ? "3px solid #ff6b35"
            : "2px solid rgba(255,255,255,0.2)",
          boxShadow: selected
            ? "0 0 20px rgba(255,107,53,0.5)"
            : "0 4px 12px rgba(0,0,0,0.15)",
          transition: "all 0.2s ease",
          padding: "8px",
        }}
        title={`${data.node_name}${
          data.node_description ? "\n" + data.node_description : ""
        }\nModule: ${moduleInfo?.module_name || data.node_module_id}`}
      >
        {/* Module number display */}
        <div
          style={{
            fontSize: data.node_type === "topic" ? "24px" : "18px",
            marginBottom: "4px",
          }}
        >
          {moduleNumber || "?"}
        </div>

        {/* Node name */}
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
        >
          {data.node_name}
        </div>
      </div>

      {/* Label below the node */}
      <div
        style={{
          position: "absolute",
          top: `${size + 10}px`,
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "12px",
          color: "#333",
          textAlign: "center",
          maxWidth: "140px",
          wordWrap: "break-word",
          fontWeight: "500",
        }}
      >
        {data.node_name}
        {moduleInfo && (
          <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>
            {moduleInfo.module_name}
          </div>
        )}
      </div>
    </div>
  );
};

const TopicNode: React.FC<ConceptNodeProps> = (props) => (
  <ConceptNode {...props} />
);

// Add Node Hover Component
const AddNodeHover: React.FC<{ position: XYPosition; onClick: () => void }> = ({
  position,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: position.x - 25,
        top: position.y - 25,
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        backgroundColor: "rgba(128, 128, 128, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 1000,
        border: "2px dashed rgba(255, 255, 255, 0.8)",
        transition: "all 0.2s ease",
        pointerEvents: "all",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(100, 100, 100, 0.9)";
        e.currentTarget.style.transform = "scale(1.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "rgba(128, 128, 128, 0.8)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <Plus size={20} color="white" />
    </div>
  );
};

// Node Input Modal
interface NodeInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    nodeName: string,
    nodeType: "concept" | "topic",
    nodeDescription: string,
    moduleId: string,
    parentNodeId?: string
  ) => void;
  availableNodes: DatabaseNode[];
}

const NodeInputModal: React.FC<NodeInputModalProps> = ({
  isOpen,
  onClose,
  onSave,
  availableNodes,
}) => {
  const [nodeName, setNodeName] = useState<string>("");
  const [nodeType, setNodeType] = useState<"concept" | "topic">("concept");
  const [nodeDescription, setNodeDescription] = useState<string>("");
  const [moduleId, setModuleId] = useState<string>("MOD_001");
  const [parentNodeId, setParentNodeId] = useState<string>("");

  const handleSave = () => {
    if (nodeName.trim()) {
      onSave(
        nodeName.trim(),
        nodeType,
        nodeDescription.trim(),
        moduleId,
        parentNodeId || undefined
      );
      setNodeName("");
      setNodeDescription("");
      setParentNodeId("");
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  const topicNodes = availableNodes.filter(
    (node) => node.node_type === "topic"
  );

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          minWidth: "400px",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: "bold" }}
        >
          Add New Node
        </h3>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Node Name *
          </label>
          <input
            type="text"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            placeholder="Enter node name"
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
            onKeyDown={handleKeyPress}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Node Description
          </label>
          <textarea
            value={nodeDescription}
            onChange={(e) => setNodeDescription(e.target.value)}
            placeholder="Optional description"
            rows={3}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Node Type
          </label>
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value as "concept" | "topic")}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            <option value="concept">Concept Node</option>
            <option value="topic">Topic Node</option>
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Module
          </label>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            {nodeModules.map((module) => (
              <option key={module.module_id} value={module.module_id}>
                {module.module_name} ({module.module_id})
              </option>
            ))}
          </select>
        </div>

        {nodeType === "concept" && (
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              Parent Node (Optional)
            </label>
            <select
              value={parentNodeId}
              onChange={(e) => setParentNodeId(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
            >
              <option value="">No Parent</option>
              {topicNodes.map((node) => (
                <option key={node.node_id} value={node.node_id}>
                  {node.node_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              backgroundColor: "#666",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: "10px 16px",
              backgroundColor: "#00bcd4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Add Node
          </button>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  conceptNode: ConceptNode,
  topicNode: TopicNode,
};

const Flow: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [dbNodes, setDbNodes] = useState<DatabaseNode[]>(mockDatabaseNodes);
  const [dbRelationships, setDbRelationships] = useState<
    DatabaseRelationship[]
  >(mockDatabaseRelationships);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoverNode, setHoverNode] = useState<HoverNode>({
    position: { x: 0, y: 0 },
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

  // Sync nodes with database entries while preserving positions
  useEffect(() => {
    let pendingUsed = false;
    const pendingSnapshot = pendingNodePositionRef.current;

    setNodes((prevNodes) => {
      const containerBounds = containerRef.current;
      const width = containerBounds?.clientWidth ?? 800;
      const height = containerBounds?.clientHeight ?? 600;
      const existingMap = new Map(prevNodes.map((node) => [node.id, node]));

      const updatedNodes = dbNodes.map((dbNode) => {
        const baseColor = getColorForModule(dbNode.node_module_id);
        const nodeColor =
          dbNode.node_type === "topic" ? getTopicColor(baseColor) : baseColor;

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
        type: "smoothstep",
        style: { stroke: "#b1b1b7", strokeWidth: 2 },
        animated: false,
        label: rel.relationship_type,
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

    const simulationNodes = nodes.map((node) => ({
      ...node,
      x: node.position.x,
      y: node.position.y,
    }));

    const linkData = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    simulation.nodes(simulationNodes as any);
    simulation.force("center", d3.forceCenter(width / 2, height / 2));
    simulation.force("charge", d3.forceManyBody().strength(-260));
    simulation.force(
      "collision",
      d3
        .forceCollide()
        .radius((d: any) => {
          const nodeData = d.data as NodeData;
          return nodeData.node_type === "topic" ? 90 : 70;
        })
        .strength(1.1)
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

          const baseDistance = 180;
          if (
            sourceNode?.data?.node_type === "topic" ||
            targetNode?.data?.node_type === "topic"
          ) {
            return baseDistance + 60;
          }
          return baseDistance;
        })
        .strength(0.25)
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
        type: "smoothstep",
        style: { stroke: "#b1b1b7", strokeWidth: 2 },
      };

      // Add to database relationships
      const newRelationship: DatabaseRelationship = {
        relationship_id:
          Math.max(...dbRelationships.map((r) => r.relationship_id), 0) + 1,
        node_id_1: params.source,
        node_id_2: params.target,
        relationship_type: "connected_to",
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

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      // Check if mouse is over any existing node
      const isOverNode = nodes.some((node) => {
        const nodeSize = node.data.node_type === "topic" ? 60 : 40;
        const distance = Math.sqrt(
          Math.pow(position.x - node.position.x, 2) +
            Math.pow(position.y - node.position.y, 2)
        );
        return distance < nodeSize;
      });

      setHoverNode({
        position,
        visible: !isOverNode,
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
    setPendingNodePosition(hoverNode.position);
    setIsModalOpen(true);
    setHoverNode((prev) => ({ ...prev, visible: false }));
  }, [hoverNode.position]);

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
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
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
              position={hoverNode.position}
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

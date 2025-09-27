import React, {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  NodeProps,
  OnEdgesChange,
  OnNodesChange,
  applyEdgeChanges,
  applyNodeChanges,
  useNodesInitialized,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import { nanoid } from "nanoid";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from "d3-force";

import "reactflow/dist/style.css";
import "./ThreadMap.css";

type MindMapNodeData = {
  label: string;
  number: number;
  color: string;
  radius: number;
};

type MindMapNode = Node<MindMapNodeData>;

type SimulationNode = {
  id: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  data: MindMapNodeData;
};

const canvasWidth = 960;
const canvasHeight = 640;

const baseNodes: Array<Omit<MindMapNodeData, "color"> & { id: string; color?: string }> = [
  { id: "logic", label: "Logic", number: 3, radius: 64, color: "#0288D1" },
  {
    id: "truth-tables",
    label: "Truth Tables",
    number: 3,
    radius: 36,
    color: "#03A9F4",
  },
  {
    id: "logical-operators",
    label: "Logical Operators",
    number: 3,
    radius: 36,
    color: "#03A9F4",
  },
  {
    id: "inference-rules",
    label: "Inference Rules",
    number: 4,
    radius: 40,
    color: "#29B6F6",
  },
  {
    id: "proof-techniques",
    label: "Proof Techniques",
    number: 3,
    radius: 36,
    color: "#4FC3F7",
  },
  {
    id: "de-morgan",
    label: "De Morgan's Laws",
    number: 3,
    radius: 36,
    color: "#4FC3F7",
  },
  {
    id: "equivalence",
    label: "Logical Equivalence Laws",
    number: 3,
    radius: 36,
    color: "#03A9F4",
  },
  {
    id: "propositions",
    label: "Propositions",
    number: 2,
    radius: 32,
    color: "#00BCD4",
  },
  {
    id: "set-theory",
    label: "Set Theory",
    number: 3,
    radius: 44,
    color: "#26C6DA",
  },
];

const initialEdges: Edge[] = [
  { id: "logic-truth", source: "logic", target: "truth-tables" },
  { id: "logic-operators", source: "logic", target: "logical-operators" },
  { id: "logic-inference", source: "logic", target: "inference-rules" },
  { id: "logic-proof", source: "logic", target: "proof-techniques" },
  { id: "logic-morgan", source: "logic", target: "de-morgan" },
  { id: "logic-equivalence", source: "logic", target: "equivalence" },
  { id: "logic-propositions", source: "logic", target: "propositions" },
  { id: "logic-set", source: "logic", target: "set-theory" },
];

const colorPalette = [
  "#03A9F4",
  "#29B6F6",
  "#26C6DA",
  "#00ACC1",
  "#4DD0E1",
  "#00BCD4",
  "#4FC3F7",
  "#0288D1",
];

const createInitialNodes = (): MindMapNode[] => {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  return baseNodes.map((node, index) => {
    const angle = (index / Math.max(baseNodes.length, 1)) * Math.PI * 2;
    const radius = index === 0 ? 0 : 220 + Math.random() * 40;

    return {
      id: node.id,
      type: "mindmap",
      data: {
        label: node.label,
        number: node.number,
        color: node.color ?? colorPalette[index % colorPalette.length],
        radius: node.radius,
      },
      position: {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      },
    } satisfies MindMapNode;
  });
};

const applyForceLayout = (nodes: MindMapNode[], edges: Edge[]): MindMapNode[] => {
  if (nodes.length === 0) {
    return nodes;
  }

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;

  const simNodes: SimulationNode[] = nodes.map((node) => ({
    id: node.id,
    x:
      node.position?.x ??
      centerX + (Math.random() - 0.5) * Math.max(canvasWidth / 4, 160),
    y:
      node.position?.y ??
      centerY + (Math.random() - 0.5) * Math.max(canvasHeight / 4, 160),
    data: node.data,
  }));

  const simEdges = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }));

  const simulation = forceSimulation(simNodes)
    .force(
      "charge",
      forceManyBody().strength((node) => -220 - (node?.data.radius ?? 40) * 4),
    )
    .force("center", forceCenter(centerX, centerY))
    .force(
      "collision",
      forceCollide<SimulationNode>().radius((node) => node.data.radius + 36),
    )
    .force(
      "link",
      forceLink<SimulationNode, { source: string; target: string }>(simEdges)
        .id((node) => node.id)
        .distance(160)
        .strength(0.7),
    )
    .alphaDecay(0.12)
    .stop();

  for (let i = 0; i < 80; i += 1) {
    simulation.tick();
  }

  const nodeLookup = new Map(simNodes.map((node) => [node.id, node]));

  return nodes.map((node) => {
    const simulated = nodeLookup.get(node.id);
    if (!simulated) {
      return node;
    }

    return {
      ...node,
      position: {
        x: simulated.x,
        y: simulated.y,
      },
    } satisfies MindMapNode;
  });
};

const MindMapNodeComponent: React.FC<NodeProps<MindMapNodeData>> = ({
  data,
  selected,
}) => {
  const diameter = data.radius * 2;

  return (
    <div
      className={`mindmap-node${selected ? " mindmap-node--selected" : ""}`}
      style={{ width: diameter }}
    >
      <div
        className="mindmap-node-circle"
        style={{ width: diameter, height: diameter, background: data.color }}
      >
        <span>{data.number}</span>
      </div>
      <div className="mindmap-node-label">{data.label}</div>
    </div>
  );
};

const nodeTypes = {
  mindmap: MindMapNodeComponent,
};

type MindMapCanvasProps = {
  nodes: MindMapNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
};

const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}) => {
  const reactFlow = useReactFlow();
  const nodesInitialized = useNodesInitialized();

  useEffect(() => {
    if (nodesInitialized) {
      reactFlow.fitView({ padding: 0.2, duration: 400 });
    }
  }, [nodesInitialized, nodes.length, reactFlow]);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "smoothstep" as const,
      animated: false,
      style: { stroke: "#0b3c61", strokeWidth: 2 },
    }),
    [],
  );

  return (
    <ReactFlowWrapper>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        panOnScroll
        zoomOnScroll
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={defaultEdgeOptions}
        elementsSelectable
        nodesConnectable
        nodesDraggable
        className="mindmap-flow"
      >
        <Background color="#d0e7ff" gap={32} />
        <Controls showInteractive={false} position="top-left" />
        <MiniMap nodeStrokeColor="#0b3c61" nodeColor="#f2fbff" zoomable pannable />
      </ReactFlow>
    </ReactFlowWrapper>
  );
};

const ReactFlowWrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <div className="reactflow-wrapper">{children}</div>;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const ThreadMap: React.FC = () => {
  const [nodes, setNodes] = useState<MindMapNode[]>(() =>
    applyForceLayout(createInitialNodes(), initialEdges),
  );
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const edgesRef = useRef(edges);
  useEffect(() => {
    edgesRef.current = edges;
    setNodes((current) => applyForceLayout(current, edges));
  }, [edges]);

  const onNodesChange = useCallback<OnNodesChange>((changes) => {
    setNodes((currentNodes) => applyNodeChanges(changes, currentNodes));
  }, []);

  const onEdgesChange = useCallback<OnEdgesChange>((changes) => {
    setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges));
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }

      setEdges((currentEdges) => {
        const alreadyExists = currentEdges.some(
          (edge) =>
            edge.source === connection.source && edge.target === connection.target,
        );

        if (alreadyExists) {
          return currentEdges;
        }

        const newEdge: Edge = {
          id: `edge-${connection.source}-${connection.target}-${nanoid(6)}`,
          source: connection.source,
          target: connection.target,
          type: "smoothstep",
          animated: false,
        };

        return [...currentEdges, newEdge];
      });
    },
    [],
  );

  const [nodeForm, setNodeForm] = useState({
    label: "",
    number: 1,
    radius: 40,
  });

  const [edgeForm, setEdgeForm] = useState(() => ({
    source: initialEdges[0]?.source ?? baseNodes[0]?.id ?? "",
    target: initialEdges[0]?.target ?? baseNodes[1]?.id ?? "",
  }));

  useEffect(() => {
    setEdgeForm((previous) => {
      const hasSource = nodes.some((node) => node.id === previous.source);
      const hasTarget = nodes.some((node) => node.id === previous.target);

      let nextSource = previous.source;
      let nextTarget = previous.target;

      if (!hasSource) {
        nextSource = nodes[0]?.id ?? "";
      }

      if (!hasTarget) {
        nextTarget = nodes.find((node) => node.id !== nextSource)?.id ?? "";
      }

      if (nextSource === previous.source && nextTarget === previous.target) {
        return previous;
      }

      return { source: nextSource, target: nextTarget };
    });
  }, [nodes]);

  const updateNodesWithLayout = useCallback(
    (updater: (nodes: MindMapNode[]) => MindMapNode[]) => {
      setNodes((currentNodes) => {
        const updatedNodes = updater(currentNodes);
        return applyForceLayout(updatedNodes, edgesRef.current);
      });
    },
    [],
  );

  const handleAddNode = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedLabel = nodeForm.label.trim();

      if (!trimmedLabel) {
        return;
      }

      updateNodesWithLayout((currentNodes) => {
        const baseId = slugify(trimmedLabel) || `node-${nanoid(4)}`;
        let uniqueId = baseId;
        let suffix = 1;
        while (currentNodes.some((node) => node.id === uniqueId)) {
          uniqueId = `${baseId}-${suffix}`;
          suffix += 1;
        }

        const color = colorPalette[currentNodes.length % colorPalette.length];

        const newNode: MindMapNode = {
          id: uniqueId,
          type: "mindmap",
          data: {
            label: trimmedLabel,
            number: nodeForm.number,
            radius: nodeForm.radius,
            color,
          },
          position: {
            x: canvasWidth / 2 + (Math.random() - 0.5) * 80,
            y: canvasHeight / 2 + (Math.random() - 0.5) * 80,
          },
        };

        setEdgeForm((previous) => ({
          source: previous.source || uniqueId,
          target: previous.target || uniqueId,
        }));

        return [...currentNodes, newNode];
      });

      setNodeForm((current) => ({ ...current, label: "" }));
    },
    [nodeForm.label, nodeForm.number, nodeForm.radius, updateNodesWithLayout],
  );

  const handleAddEdge = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!edgeForm.source || !edgeForm.target || edgeForm.source === edgeForm.target) {
        return;
      }

      setEdges((currentEdges) => {
        const exists = currentEdges.some(
          (edge) => edge.source === edgeForm.source && edge.target === edgeForm.target,
        );

        if (exists) {
          return currentEdges;
        }

        const newEdge: Edge = {
          id: `edge-${edgeForm.source}-${edgeForm.target}-${nanoid(6)}`,
          source: edgeForm.source,
          target: edgeForm.target,
          type: "smoothstep",
          animated: false,
        };

        return [...currentEdges, newEdge];
      });
    },
    [edgeForm.source, edgeForm.target],
  );

  return (
    <div className="thread-map-page">
      <div className="thread-map-header">
        <h1>Concept Threads</h1>
        <p>
          Explore logical concepts in an interactive mind map. Nodes repel each
          other to avoid overlap, while edges keep related topics connected.
          Add your own concepts or relationships to grow the network.
        </p>
      </div>

      <div className="thread-map-layout">
        <aside className="thread-map-controls">
          <section>
            <h2>Add a concept</h2>
            <form className="thread-map-form" onSubmit={handleAddNode}>
              <label>
                Label
                <input
                  type="text"
                  value={nodeForm.label}
                  onChange={(event) =>
                    setNodeForm((current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                  placeholder="e.g. Predicate Logic"
                  required
                />
              </label>
              <label>
                Concept number
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={nodeForm.number}
                  onChange={(event) =>
                    setNodeForm((current) => ({
                      ...current,
                      number: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Node radius
                <input
                  type="range"
                  min={28}
                  max={72}
                  value={nodeForm.radius}
                  onChange={(event) =>
                    setNodeForm((current) => ({
                      ...current,
                      radius: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <button type="submit">Add concept</button>
            </form>
          </section>

          <section>
            <h2>Create a connection</h2>
            <form className="thread-map-form" onSubmit={handleAddEdge}>
              <label>
                Source concept
                <select
                  value={edgeForm.source}
                  onChange={(event) =>
                    setEdgeForm((current) => ({
                      ...current,
                      source: event.target.value,
                    }))
                  }
                >
                  {nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.data.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Target concept
                <select
                  value={edgeForm.target}
                  onChange={(event) =>
                    setEdgeForm((current) => ({
                      ...current,
                      target: event.target.value,
                    }))
                  }
                >
                  {nodes
                    .filter((node) => node.id !== edgeForm.source)
                    .map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.data.label}
                      </option>
                    ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={
                  !edgeForm.source ||
                  !edgeForm.target ||
                  edgeForm.source === edgeForm.target
                }
              >
                Add connection
              </button>
            </form>
          </section>
        </aside>

        <div className="thread-map-canvas">
          <ReactFlowProvider>
            <MindMapCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
            />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
};

export default ThreadMap;

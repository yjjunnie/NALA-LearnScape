import React, { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Position,
} from "@xyflow/react";
import * as d3 from "d3";

import "@xyflow/react/dist/style.css";

interface NodeData {
  number: number;
  label: string;
}

const ConceptNode = ({ data }: { data: NodeData }) => {
  return (
    <div
      style={{
        width: "100px",
        height: "100px",
        borderRadius: "50%",
        backgroundColor: "#00bcd4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: "18px",
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      <div>{data.number}</div>
      <div>{data.label}</div>
    </div>
  );
};

const TopicNode = ({ data }: { data: NodeData }) => {
  return (
    <div
      style={{
        width: "200px",
        height: "200px",
        borderRadius: "50%",
        backgroundColor: "#00bcd4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: "18px",
        fontWeight: "bold",
        textAlign: "center",
      }}
    >
      <div>{data.number}</div>
      <div>{data.label}</div>
    </div>
  );
};

const nodeDefaults = {
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

const initialNodes = [
  {
    id: "1",
    type: ConceptNode,
    position: { x: 0, y: 150 },
    data: { label: "default style 1" },
    ...nodeDefaults,
  },
  {
    id: "2",
    type: ConceptNode,
    position: { x: 250, y: 0 },
    data: { label: "default style 2" },
    ...nodeDefaults,
  },
  {
    id: "3",
    position: { x: 250, y: 150 },
    data: { label: "default style 3" },
    ...nodeDefaults,
  },
  {
    id: "4",
    position: { x: 250, y: 300 },
    data: { label: "default style 4" },
    ...nodeDefaults,
  },
];

const initialEdges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
  },
  {
    id: "e1-3",
    source: "1",
    target: "3",
  },
  {
    id: "e1-4",
    source: "1",
    target: "4",
  },
];

const nodeTypes = {
  conceptNode: ConceptNode,
  topicNode: TopicNode,
};

const Flow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((els) => addEdge(params, els)),
    []
  );

  // D3 Force Simulation
  useEffect(() => {
    const simulation = d3
      .forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-500)) // Prevent nodes from overlapping
      .force("center", d3.forceCenter(250, 250)) // Center the nodes
      .force("collision", d3.forceCollide(100)) // Prevent overlap with defined radius
      .on("tick", () => {
        const newNodes = nodes.map((node, index) => {
          node.position = {
            x: simulation.nodes()[index].x,
            y: simulation.nodes()[index].y,
          };
          return node;
        });
        setNodes(newNodes); // Update node positions
      });

    simulation.alpha(1).restart(); // Restart the simulation

    return () => {
      simulation.stop(); // Stop the simulation on unmount
    };
  }, [nodes]);

  return (
    <ReactFlow
      nodes={nodes}
      nodeTypes={nodeTypes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
};

export default Flow;

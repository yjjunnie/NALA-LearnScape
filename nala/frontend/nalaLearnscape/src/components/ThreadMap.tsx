import React from "react";
import type { Edge, Node } from "@xyflow/react";
import { ReactFlow, Background, Controls } from "@xyflow/react";

export interface ThreadMapProps {
  nodes: Node[];
  edges: Edge[];
}

const ThreadMap: React.FC<ThreadMapProps> = ({ nodes, edges }) => {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      fitViewOptions={{ padding: 0.4 }}
      className="threadmap"
      style={{ width: "100%", height: "100%" }}
    >
      <Background />
      <Controls showInteractive={false} position="bottom-right" />
    </ReactFlow>
  );
};

export default ThreadMap;

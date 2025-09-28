import React from "react";
import type { Edge, Node } from "@xyflow/react";
import { ReactFlow, Controls } from "@xyflow/react";

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
      className="rounded-[20px] bg-transparent"
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <Controls
        showInteractive={false}
        position="bottom-right"
        style={{
          boxShadow: "none",
          background: "rgba(255,255,255,0.85)",
          borderRadius: 12,
          border: "1px solid rgba(76,115,255,0.2)",
        }}
      />
    </ReactFlow>
  );
};

export default ThreadMap;

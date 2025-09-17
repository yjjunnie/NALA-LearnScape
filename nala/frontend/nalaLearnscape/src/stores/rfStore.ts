import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Position,
} from '@xyflow/react';
import useStore from './rfStore'; // Adjust the import path as needed

import '@xyflow/react/dist/style.css';

const ThreadMap= () => {
  const { nodes, edges, onNodesChange, onEdgesChange } = useStore();

  const onConnect = useCallback(
    (params) => {
      const newEdge = addEdge(params, edges);
      onEdgesChange([
        {
          type: 'add',
          item: newEdge[newEdge.length - 1]
        }
      ]);
    },
    [onEdgesChange, edges],
  );

  return (
    <ReactFlow
      nodes={nodes}
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

export default ThreadMap;
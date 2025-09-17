import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';


const ThreadMap = () => {

  return (
    <ReactFlow 
      fitView
      fitViewOptions={{padding:0.4}}
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
};

export default ThreadMap;

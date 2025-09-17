import { Handle, Position, type NodeProps } from '@xyflow/react';

export type NodeData = {
    label: string;
  };  

function ThreadMapNode({ id, data }: NodeProps<NodeData> ){
  return (
    <>
      <input defaultValue={data.label} />
 
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </>
  )
}

export default ThreadMapNode
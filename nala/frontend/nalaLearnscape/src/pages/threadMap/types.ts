import type { Node, Edge, XYPosition } from "@xyflow/react";

export interface NodeData extends Record<string, unknown> {
  node_id: number;
  node_name: string;
  node_description?: string;
  node_type: "topic" | "concept";
  parent_node_id?: number;
  node_module_id: number;
  color?: string;
}

export type FlowNode = Node<NodeData>;
export type FlowEdge = Edge;

export interface DatabaseNode {
  id: number;
  type: "topic" | "concept";
  name: string;
  summary?: string;
  related_topic?: number;
  module_id: number;
}

export interface DatabaseRelationship {
  id: number;
  first_node: number;
  second_node: number;
  rs_type: string;
}

export interface HoverNode {
  flowPosition: XYPosition;
  screenPosition: XYPosition;
  visible: boolean;
}

export interface NodeModule {
  module_id: number;
  module_name: string;
  color: string;
}

import type { Node, Edge, XYPosition } from "@xyflow/react";

export interface NodeData extends Record<string, unknown> {
  node_id: string;
  node_name: string;
  node_description?: string;
  node_type: "topic" | "concept";
  parent_node_id?: string;
  node_module_id: string;
  color?: string;
}

export type FlowNode = Node<NodeData>;
export type FlowEdge = Edge;

export interface DatabaseNode {
  node_id: string;
  node_type: "topic" | "concept";
  node_name: string;
  node_description?: string;
  parent_node_id?: string;
  node_module_id: string;
}

export interface DatabaseRelationship {
  relationship_id: number;
  node_id_1: string;
  node_id_2: string;
  relationship_type: string;
}

export interface HoverNode {
  flowPosition: XYPosition;
  screenPosition: XYPosition;
  visible: boolean;
}

export interface NodeModule {
  module_id: string;
  module_name: string;
  color: string;
}

import type { Node, Edge, XYPosition } from "@xyflow/react";

export interface NodeData extends Record<string, unknown> {
  node_id: string;
  node_name: string;
  node_description?: string;
  node_type: "topic" | "concept";
  parent_node_id?: string;
  node_module_id: string;
  node_module_name?: string;
  node_module_index?: string;
  color?: string;
  bloom_level_label?: string | null;
  bloom_level_numeric?: number | null;
  bloom_level_counts?: Record<string, number> | null;
}

export type FlowNode = Node<NodeData>;
export type FlowEdge = Edge;

export interface DatabaseNode {
  id: string;
  type: "topic" | "concept";
  name: string;
  summary?: string;
  related_topic?: string;
  module_id: string;
}

export interface DatabaseRelationship {
  id: string;
  first_node: string;
  second_node: string;
  rs_type: string;
}

export interface HoverNode {
  flowPosition: XYPosition;
  screenPosition: XYPosition;
  visible: boolean;
}

export interface NodeModule {
  module_id: string;
  module_name?: string;
  module_index?: string;
  color: string;
}

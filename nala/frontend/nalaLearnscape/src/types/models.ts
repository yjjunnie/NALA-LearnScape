export interface Module {
  id: number;
  index: string | null;
  name: string | null;
  created_at: string;
}

export interface Node {
  id: number;
  name: string;
  summary: string;
  module: number | null;
  module_info?: Module | null;
}

export interface Topic extends Node {}

export interface Concept extends Node {
  related_topic: number;
  topic_info?: Topic;
}

export interface Relationship {
  id: number;
  first_node: number;
  second_node: number;
  rs_type:
    | "is_subtopic_of"
    | "is_prerequisite_of"
    | "is_corequisite_of"
    | "is_contrasted_with"
    | "is_applied_in";
  first_node_info?: Node;
  second_node_info?: Node;
  rs_type_display?: string;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  enrolled_modules: number[];
  learningStyle:
    | "retrieval_practice"
    | "spaced_practice"
    | "elaboration"
    | "concrete_examples"
    | "interleaving"
    | "dual_coding"
    | null;
  enrolled_modules_info: Module[];
  learning_style_description: string;
  learning_style_display: string;
}

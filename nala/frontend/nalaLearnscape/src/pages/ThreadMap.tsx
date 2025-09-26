import React from "react";
import ThreadMap from "../components/ThreadMap";
import type { Edge, Node } from "@xyflow/react";

const nodes: Node[] = [
  {
    id: "core",
    data: { label: "Core Concept" },
    position: { x: 0, y: 0 },
    style: {
      borderRadius: 12,
      padding: 16,
      background: "#E1E9FF",
      border: "2px solid #4C73FF",
    },
  },
  {
    id: "practice",
    data: { label: "Practice Set" },
    position: { x: 200, y: -80 },
    style: {
      borderRadius: 12,
      padding: 16,
      background: "#F2F6FF",
      border: "2px solid #A0C1FF",
    },
  },
  {
    id: "project",
    data: { label: "Project" },
    position: { x: 200, y: 80 },
    style: {
      borderRadius: 12,
      padding: 16,
      background: "#F2F6FF",
      border: "2px solid #A0C1FF",
    },
  },
  {
    id: "assessment",
    data: { label: "Assessment" },
    position: { x: 400, y: 0 },
    style: {
      borderRadius: 12,
      padding: 16,
      background: "#E6EDFF",
      border: "2px solid #4C73FF",
    },
  },
];

const edges: Edge[] = [
  { id: "e1", source: "core", target: "practice", animated: true },
  { id: "e2", source: "core", target: "project", animated: true },
  { id: "e3", source: "practice", target: "assessment", animated: true },
  { id: "e4", source: "project", target: "assessment", animated: true },
];

const ThreadMapPage: React.FC = () => {
  return (
    <div className="threadmap-page">
      <ThreadMap nodes={nodes} edges={edges} />
    </div>
  );
};

export default ThreadMapPage;

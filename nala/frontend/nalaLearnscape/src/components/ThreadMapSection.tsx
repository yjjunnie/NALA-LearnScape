import React, { useMemo, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import ThreadMap from "./ThreadMap";

type ThreadMapOption = {
  id: string;
  label: string;
  subtitle: string;
  nodes: Node[];
  edges: Edge[];
};

const createOption = (
  id: string,
  label: string,
  subtitle: string,
  offsetY: number
): ThreadMapOption => {
  const baseNodes: Node[] = [
    {
      id: `${id}-core`,
      data: { label: "Core Concept" },
      position: { x: 0, y: 0 + offsetY },
      style: {
        borderRadius: 12,
        padding: 16,
        background: "#E1E9FF",
        border: "2px solid #4C73FF",
      },
    },
    {
      id: `${id}-skill-1`,
      data: { label: "Skill Builder" },
      position: { x: 220, y: -80 + offsetY },
      style: {
        borderRadius: 12,
        padding: 16,
        background: "#F2F6FF",
        border: "2px solid #A0C1FF",
      },
    },
    {
      id: `${id}-skill-2`,
      data: { label: "Real-World Task" },
      position: { x: 220, y: 80 + offsetY },
      style: {
        borderRadius: 12,
        padding: 16,
        background: "#F2F6FF",
        border: "2px solid #A0C1FF",
      },
    },
    {
      id: `${id}-assessment`,
      data: { label: "Assessment" },
      position: { x: 420, y: 0 + offsetY },
      style: {
        borderRadius: 12,
        padding: 16,
        background: "#E6EDFF",
        border: "2px solid #4C73FF",
      },
    },
  ];

  const baseEdges: Edge[] = [
    { id: `${id}-e1`, source: `${id}-core`, target: `${id}-skill-1`, animated: true },
    { id: `${id}-e2`, source: `${id}-core`, target: `${id}-skill-2`, animated: true },
    { id: `${id}-e3`, source: `${id}-skill-1`, target: `${id}-assessment`, animated: true },
    { id: `${id}-e4`, source: `${id}-skill-2`, target: `${id}-assessment`, animated: true },
  ];

  return { id, label, subtitle, nodes: baseNodes, edges: baseEdges };
};

const THREAD_MAP_OPTIONS: ThreadMapOption[] = [
  createOption("mr9280", "MR9280 Linear Algebra", "Vector Spaces", -20),
  createOption("cs1010", "CS1010 Programming", "Algorithms & Logic", 0),
  createOption("phy2049", "PHY2049 Physics", "Wave Motion", 20),
];

const ThreadMapSection: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(THREAD_MAP_OPTIONS[0].id);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const selectedOption = useMemo(
    () => THREAD_MAP_OPTIONS.find((option) => option.id === selectedId)!,
    [selectedId]
  );

  return (
    <section className="threadmap-section">
      <header className="threadmap-section__header">
        <div>
          <h2>{selectedOption.label}</h2>
          <p>{selectedOption.subtitle}</p>
        </div>
        <div className="threadmap-section__filter">
          <button
            type="button"
            onClick={() => setIsFilterOpen((open) => !open)}
            className="threadmap-section__filter-button"
            aria-haspopup="listbox"
            aria-expanded={isFilterOpen}
          >
            <span className="threadmap-section__filter-icon">⛃</span>
            Filter
          </button>
          {isFilterOpen && (
            <ul className="threadmap-section__filter-menu" role="listbox">
              {THREAD_MAP_OPTIONS.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(option.id);
                      setIsFilterOpen(false);
                    }}
                    className={
                      option.id === selectedId
                        ? "threadmap-section__filter-option threadmap-section__filter-option--active"
                        : "threadmap-section__filter-option"
                    }
                    role="option"
                    aria-selected={option.id === selectedId}
                  >
                    <span className="threadmap-section__filter-option-label">
                      {option.label}
                    </span>
                    <span className="threadmap-section__filter-option-subtitle">
                      {option.subtitle}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>
      <div className="threadmap-section__body">
        <ThreadMap nodes={selectedOption.nodes} edges={selectedOption.edges} />
      </div>
    </section>
  );
};

export default ThreadMapSection;

import React, { useEffect, useMemo, useState } from "react";

type LearningSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
  description: string;
};

type LearningStyleResponse = {
  currentStyle: string;
  slices: LearningSlice[];
};

const prototypeFetchLearningStyle = async (): Promise<LearningStyleResponse> => {
  // Placeholder for Django view integration.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        currentStyle: "Elaboration",
        slices: [
          {
            id: "elaboration",
            label: "Elaboration",
            value: 25,
            color: "#4C73FF",
            description:
              "Connecting new ideas to existing knowledge to deepen understanding.",
          },
          {
            id: "concrete",
            label: "Concrete Examples",
            value: 20,
            color: "#7EA8FF",
            description: "Grounding concepts with tangible, real-world examples.",
          },
          {
            id: "spaced",
            label: "Spaced Practice",
            value: 20,
            color: "#A0C1FF",
            description:
              "Breaking study time into multiple sessions to support long-term retention.",
          },
          {
            id: "dual",
            label: "Dual Coding",
            value: 15,
            color: "#2D4BB4",
            description: "Pairing visual elements with text to reinforce learning pathways.",
          },
          {
            id: "retrieval",
            label: "Retrieval Practice",
            value: 20,
            color: "#13338C",
            description:
              "Testing yourself to strengthen recall and expose knowledge gaps.",
          },
        ],
      });
    }, 400);
  });
};

const radius = 70;
const circumference = 2 * Math.PI * radius;

const LearningStyleOverview: React.FC = () => {
  const [data, setData] = useState<LearningSlice[]>([]);
  const [currentStyle, setCurrentStyle] = useState<string>("-");
  const [hoveredSlice, setHoveredSlice] = useState<LearningSlice | null>(null);

  useEffect(() => {
    prototypeFetchLearningStyle().then((response) => {
      setData(response.slices);
      setCurrentStyle(response.currentStyle);
    });
  }, []);

  const total = useMemo(
    () => data.reduce((sum, slice) => sum + slice.value, 0) || 1,
    [data]
  );

  let cumulativeValue = 0;

  return (
    <div className="learning-style-card">
      <div className="learning-style-card__header">
        <div className="learning-style-card__badge">
          <span className="learning-style-card__badge-text">🔥</span>
          <span className="learning-style-card__badge-number">25</span>
        </div>
        <h3>Current Learning Style:</h3>
        <p className="learning-style-card__style">{currentStyle}</p>
      </div>
      <div className="learning-style-card__content">
        <div className="learning-style-card__chart">
          {hoveredSlice && (
            <div className="learning-style-card__tooltip">
              <strong>{hoveredSlice.label}</strong>
              <span>
                {Math.round((hoveredSlice.value / total) * 100)}%
              </span>
            </div>
          )}
          <svg viewBox="0 0 200 200" role="img" aria-label="Learning style distribution">
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="#E6EDFF"
              stroke="#E6EDFF"
              strokeWidth="40"
            />
            {data.map((slice) => {
              const dashArray = `${(slice.value / total) * circumference} ${circumference}`;
              const dashOffset = -(cumulativeValue / total) * circumference;
              cumulativeValue += slice.value;

              return (
                <circle
                  key={slice.id}
                  className="learning-style-card__slice"
                  cx="100"
                  cy="100"
                  r={radius}
                  stroke={slice.color}
                  strokeWidth="40"
                  fill="transparent"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  onMouseEnter={() => setHoveredSlice(slice)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  style={{
                    transform: "rotate(-90deg)",
                    transformOrigin: "100px 100px",
                  }}
                />
              );
            })}
          </svg>
        </div>
        <div className="learning-style-card__legend">
          {data.map((slice) => (
            <div className="learning-style-card__legend-item" key={slice.id}>
              <span
                className="learning-style-card__legend-color"
                style={{ backgroundColor: slice.color }}
              />
              <span className="learning-style-card__legend-label">{slice.label}</span>
              <span className="learning-style-card__legend-value">
                {Math.round((slice.value / total) * 100)}%
              </span>
              <span className="learning-style-card__info">
                <span
                  className="learning-style-card__info-icon"
                  onMouseEnter={() => setHoveredSlice(slice)}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  ?
                </span>
                {hoveredSlice?.id === slice.id && (
                  <div className="learning-style-card__info-tooltip">
                    {slice.description}
                  </div>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningStyleOverview;

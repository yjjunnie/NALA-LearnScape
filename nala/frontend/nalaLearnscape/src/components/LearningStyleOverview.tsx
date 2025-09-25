import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

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
    <Paper
      elevation={0}
      className="learning-style-card"
      sx={{
        borderRadius: { xs: 4, md: 5 },
        px: { xs: 3, md: 4 },
        py: { xs: 3, md: 4 },
        background: "linear-gradient(180deg, #ffffff 0%, #f3f6ff 100%)",
        boxShadow: "0 24px 50px rgba(76,115,255,0.18)",
      }}
    >
      <Stack spacing={1.5} className="learning-style-card__header">
        <Typography
          variant="h6"
          sx={{
            color: "text.secondary",
            letterSpacing: 0.5,
          }}
        >
          Current Learning Style
        </Typography>
        <Typography
          variant="h4"
          className="learning-style-card__style"
          sx={{
            color: "primary.main",
            fontSize: { xs: "1.6rem", md: "1.8rem" },
          }}
        >
          {currentStyle}
        </Typography>
      </Stack>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 3, md: 4 }}
        alignItems="center"
        className="learning-style-card__content"
      >
        <Box className="learning-style-card__chart">
          {hoveredSlice && (
            <Box className="learning-style-card__tooltip">
              <Typography variant="subtitle1" fontWeight={700}>
                {hoveredSlice.label}
              </Typography>
              <Typography variant="body2" color="primary.main">
                {Math.round((hoveredSlice.value / total) * 100)}%
              </Typography>
            </Box>
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
        </Box>
        <Stack spacing={1.5} className="learning-style-card__legend">
          {data.map((slice) => (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              key={slice.id}
              className="learning-style-card__legend-item"
            >
              <Box
                className="learning-style-card__legend-color"
                sx={{ backgroundColor: slice.color }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" className="learning-style-card__legend-label">
                  {slice.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round((slice.value / total) * 100)}%
                </Typography>
              </Box>
              <Tooltip
                title={slice.description}
                placement="top"
                arrow
                enterDelay={100}
                leaveDelay={0}
              >
                <Box
                  className="learning-style-card__info-icon"
                  onMouseEnter={() => setHoveredSlice(slice)}
                  onMouseLeave={() => setHoveredSlice(null)}
                >
                  ?
                </Box>
              </Tooltip>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
};

export default LearningStyleOverview;

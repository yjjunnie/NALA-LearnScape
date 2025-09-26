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

const radius = 80;

const polarToCartesian = (center: number, r: number, angle: number) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: center + r * Math.cos(radians),
    y: center + r * Math.sin(radians),
  };
};

const describeSegment = (startAngle: number, endAngle: number, r: number) => {
  const start = polarToCartesian(100, r, endAngle);
  const end = polarToCartesian(100, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return `M 100 100 L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
};

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

  const slicesWithAngles = useMemo(() => {
    let runningTotal = 0;
    return data.map((slice) => {
      const startAngle = runningTotal * 360;
      const portion = slice.value / total;
      runningTotal += portion;
      const endAngle = runningTotal * 360;

      return {
        ...slice,
        startAngle,
        endAngle,
      };
    });
  }, [data, total]);

  return (
    <Paper
      elevation={0}
      className="flex flex-col gap-[18px]"
      sx={{
        borderRadius: { xs: 4, md: 5 },
        px: { xs: 3, md: 4 },
        py: { xs: 3, md: 4 },
        background: "linear-gradient(180deg, #ffffff 0%, #f3f6ff 100%)",
        boxShadow: "0 24px 50px rgba(76,115,255,0.18)",
        border: "1px solid rgba(76,115,255,0.14)",
      }}
    >
      <Stack spacing={1.5} className="flex flex-col gap-[6px]">
        <Typography
          variant="subtitle2"
          sx={{
            color: "#4C73FF",
            letterSpacing: 1,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Current Learning Style
        </Typography>
        <Typography
          variant="h3"
          className="font-['Fredoka',sans-serif]"
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
        className="w-full"
      >
        <Box className="relative flex items-center justify-center">
          {hoveredSlice && (
        <Box className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 rounded-[16px] bg-[rgba(76,115,255,0.92)] px-[14px] py-2 text-white">
              <Typography variant="subtitle1" fontWeight={700}>
                {hoveredSlice.label}
              </Typography>
              <Typography variant="body2" color="primary.main">
                {Math.round((hoveredSlice.value / total) * 100)}%
              </Typography>
            </Box>
          )}
          <svg
            viewBox="0 0 200 200"
            role="img"
            aria-label="Learning style distribution"
            className="h-auto w-full"
          >
            {slicesWithAngles.map((slice) => (
              <path
                key={slice.id}
                d={describeSegment(slice.startAngle, slice.endAngle, radius)}
                fill={slice.color}
                stroke="#ffffff"
                strokeWidth={1.5}
                onMouseEnter={() => setHoveredSlice(slice)}
                onMouseLeave={() => setHoveredSlice(null)}
              />
            ))}
            <circle cx="100" cy="100" r="42" fill="#ffffff" />
          </svg>
        </Box>
        <Stack spacing={1.5} className="w-full">
          {data.map((slice) => (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              key={slice.id}
              className="rounded-[18px] bg-[rgba(232,241,255,0.6)] px-4 py-3"
            >
              <Box
                className="h-4 w-4 rounded-full"
                sx={{ backgroundColor: slice.color }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography
                  variant="subtitle1"
                  className="font-['GlacialIndifference',sans-serif] font-semibold"
                >
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
                slotProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: "rgba(40,72,209,0.95)",
                      borderRadius: 2,
                      fontFamily: '"GlacialIndifference", sans-serif',
                      fontSize: "0.75rem",
                      px: 1.5,
                      py: 1,
                    },
                  },
                  arrow: {
                    sx: { color: "rgba(40,72,209,0.95)" },
                  },
                }}
              >
                <Box
                  className="inline-flex h-[26px] w-[26px] cursor-default items-center justify-center rounded-full bg-[#e1e9ff] font-['Fredoka',sans-serif] font-bold text-[#1b46d1]"
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

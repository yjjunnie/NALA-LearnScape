import React, { useEffect, useMemo, useState } from "react";
import { Box, Paper, Stack, Tooltip, Typography } from "@mui/material";
import { PieChart, pieArcLabelClasses } from "@mui/x-charts/PieChart";

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

  const pieSeriesData = useMemo(
    () =>
      data.map((slice) => ({
        id: slice.id,
        value: slice.value,
        label: slice.label,
        color: slice.color,
      })),
    [data]
  );

  const chartColors = useMemo(
    () => pieSeriesData.map((item) => item.color),
    [pieSeriesData]
  );

  const handleHighlightChange: NonNullable<
    React.ComponentProps<typeof PieChart>["onHighlightChange"]
  > = (
    _event,
    item
  ) => {
    if (item?.dataIndex != null) {
      setHoveredSlice(data[item.dataIndex] ?? null);
      return;
    }
    setHoveredSlice(null);
  };

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
            fontWeight: 400,
          }}
        >
          Current Learning Style
        </Typography>
        <Typography
          variant="h3"
          className="font-fredoka font-bold"
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
          <PieChart
            colors={chartColors}
            height={240}
            onHighlightChange={handleHighlightChange}
            slotProps={{
              legend: { hidden: true },
              tooltip: {
                sx: {
                  fontFamily: '"GlacialIndifference", "Helvetica Neue", Arial, sans-serif',
                  fontWeight: 400,
                },
              },
            }}
            series={[
              {
                arcLabel: ({ value }) =>
                  `${Math.round(((value as number) / total) * 100)}%`,
                arcLabelMinAngle: 12,
                cornerRadius: 6,
                data: pieSeriesData,
                faded: {
                  additionalRadius: -12,
                  innerRadius: 36,
                },
                highlightScope: { faded: "global", highlighted: "item" },
                innerRadius: 40,
                outerRadius: 90,
                paddingAngle: 2,
              },
            ]}
            sx={{
              [`& .${pieArcLabelClasses.root}`]: {
                fill: "#0F1F4A",
                fontFamily: '"GlacialIndifference", "Helvetica Neue", Arial, sans-serif',
                fontSize: 12,
                fontWeight: 400,
              },
            }}
            width={260}
          />
          <Box className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Stack spacing={0.5} alignItems="center">
              <Typography
                variant="h6"
                className="font-fredoka font-bold"
                color="primary.main"
              >
                {hoveredSlice?.label ?? currentStyle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {hoveredSlice
                  ? `${Math.round((hoveredSlice.value / total) * 100)}% emphasis`
                  : "Primary focus"}
              </Typography>
            </Stack>
          </Box>
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
                  className="font-glacial font-normal"
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
                      fontFamily: '"GlacialIndifference", "Helvetica Neue", Arial, sans-serif',
                      fontWeight: 400,
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
                  className="inline-flex h-[26px] w-[26px] cursor-default items-center justify-center rounded-full bg-[#e1e9ff] font-fredoka font-bold text-[#1b46d1]"
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

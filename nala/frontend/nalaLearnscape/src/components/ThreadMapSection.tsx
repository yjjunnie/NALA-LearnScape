import React, { useMemo, useState } from "react";
import type { Edge, Node } from "@xyflow/react";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
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
        fontFamily: '"GlacialIndifference", sans-serif',
        fontWeight: 600,
        color: "#1a2c5e",
        fontSize: "0.95rem",
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
        fontFamily: '"GlacialIndifference", sans-serif',
        fontWeight: 600,
        color: "#1a2c5e",
        fontSize: "0.95rem",
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
        fontFamily: '"GlacialIndifference", sans-serif',
        fontWeight: 600,
        color: "#1a2c5e",
        fontSize: "0.95rem",
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
        fontFamily: '"GlacialIndifference", sans-serif',
        fontWeight: 600,
        color: "#1a2c5e",
        fontSize: "0.95rem",
      },
    },
  ];

  const baseEdges: Edge[] = [
    {
      id: `${id}-e1`,
      source: `${id}-core`,
      target: `${id}-skill-1`,
      animated: true,
      style: { stroke: "rgba(76,115,255,0.6)" },
    },
    {
      id: `${id}-e2`,
      source: `${id}-core`,
      target: `${id}-skill-2`,
      animated: true,
      style: { stroke: "rgba(76,115,255,0.6)" },
    },
    {
      id: `${id}-e3`,
      source: `${id}-skill-1`,
      target: `${id}-assessment`,
      animated: true,
      style: { stroke: "rgba(76,115,255,0.6)" },
    },
    {
      id: `${id}-e4`,
      source: `${id}-skill-2`,
      target: `${id}-assessment`,
      animated: true,
      style: { stroke: "rgba(76,115,255,0.6)" },
    },
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
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);

  const selectedOption = useMemo(
    () => THREAD_MAP_OPTIONS.find((option) => option.id === selectedId)!,
    [selectedId]
  );

  return (
    <Paper
      elevation={0}
      className="flex flex-col gap-4"
      sx={{
        borderRadius: 5,
        px: { xs: 3, md: 4 },
        py: { xs: 3, md: 4 },
        backgroundColor: "#ffffff",
        boxShadow: "0 22px 45px rgba(44,87,170,0.14)",
        border: "1px solid rgba(76,115,255,0.12)",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={{ xs: 2, sm: 3 }}
        className="w-full"
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"Fredoka", sans-serif',
              color: "primary.main",
              mb: 0.5,
            }}
          >
            {selectedOption.label}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {selectedOption.subtitle}
          </Typography>
        </Box>
        <div className="flex items-center">
          <Button
            variant="contained"
            color="primary"
            startIcon={<FilterListRoundedIcon />}
            onClick={(event) => setFilterAnchor(event.currentTarget)}
            className="rounded-full"
            sx={{
              borderRadius: 999,
              px: 3,
              background: "linear-gradient(135deg, #4C73FF 0%, #7EA8FF 100%)",
            }}
          >
            Filter
          </Button>
          <Menu
            anchorEl={filterAnchor}
            open={Boolean(filterAnchor)}
            onClose={() => setFilterAnchor(null)}
            MenuListProps={{ "aria-label": "Filter thread map" }}
            PaperProps={{
              sx: {
                borderRadius: 3,
                minWidth: 240,
                p: 1,
              },
            }}
          >
            {THREAD_MAP_OPTIONS.map((option) => (
              <MenuItem
                key={option.id}
                selected={option.id === selectedId}
                onClick={() => {
                  setSelectedId(option.id);
                  setFilterAnchor(null);
                }}
                sx={{
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 0.5,
                  py: 1.5,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: option.id === selectedId ? "primary.main" : "text.primary",
                    fontFamily: '"Fredoka", sans-serif',
                  }}
                >
                  {option.label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.subtitle}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </div>
      </Stack>
      <Box className="min-h-[300px] rounded-[28px] bg-[linear-gradient(180deg,rgba(232,241,255,0.8)_0%,rgba(244,248,255,0.95)_100%)] p-3">
        <ThreadMap nodes={selectedOption.nodes} edges={selectedOption.edges} />
      </Box>
    </Paper>
  );
};

export default ThreadMapSection;

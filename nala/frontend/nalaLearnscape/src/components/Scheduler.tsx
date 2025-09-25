import React, { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";
import DragTimeBlock from "./DragTimeBlock";

type ScheduleItem = {
  id: string;
  label: string;
  duration: number; // minutes
  start: number; // minutes from 0000
  color: string;
};

const TOTAL_MINUTES = 24 * 60;

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export interface SchedulerProps {
  headerAction?: ReactNode;
}

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}${mins
    .toString()
    .padStart(2, "0")}`;
};

const initialSchedule: ScheduleItem[] = [
  {
    id: "module-1",
    label: "Linear Algebra - Vectors",
    duration: 90,
    start: 8 * 60,
    color: "#7EA8FF",
  },
  {
    id: "module-2",
    label: "Calculus - Integrals",
    duration: 60,
    start: 10 * 60 + 30,
    color: "#4C73FF",
  },
  {
    id: "module-3",
    label: "Dual Coding Practice",
    duration: 120,
    start: 13 * 60,
    color: "#3D5BDB",
  },
];

const Scheduler: React.FC<SchedulerProps> = ({ headerAction }) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialSchedule);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const totalDurationLabel = useMemo(() => {
    const total = schedule.reduce((sum, item) => sum + item.duration, 0);
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    const parts = [];

    if (hours > 0) {
      parts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} min`);
    }

    return parts.join(" ") || "0 min";
  }, [schedule]);

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    id: string
  ): void => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    setActiveBlock(id);
  };

  const handleDragEnd = (): void => {
    setActiveBlock(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();

    const id = event.dataTransfer.getData("text/plain") || activeBlock;
    if (!id || !trackRef.current) {
      return;
    }

    const rect = trackRef.current.getBoundingClientRect();
    const pointerX = clamp(event.clientX - rect.left, 0, rect.width);
    const ratio = pointerX / rect.width;
    const minutes = Math.round(ratio * TOTAL_MINUTES);

    setSchedule((prev) =>
      {
        const nextSchedule = [...prev];
        const currentIndex = nextSchedule.findIndex((item) => item.id === id);
        if (currentIndex === -1) {
          return prev;
        }

        const currentItem = nextSchedule[currentIndex];
        const desiredStart = clamp(minutes, 0, TOTAL_MINUTES - currentItem.duration);
        const others = nextSchedule
          .filter((item) => item.id !== id)
          .sort((a, b) => a.start - b.start);

        const originalStart = currentItem.start;
        let updatedStart = originalStart;
        let placed = false;
        let previousEnd = 0;

        for (const other of others) {
          const otherStart = Math.max(other.start, previousEnd);
          const gapStart = previousEnd;
          const gapEnd = otherStart;

          if (gapEnd - gapStart >= currentItem.duration) {
            const candidateStart = clamp(
              desiredStart,
              gapStart,
              gapEnd - currentItem.duration
            );
            if (candidateStart >= gapStart && candidateStart + currentItem.duration <= gapEnd) {
              updatedStart = candidateStart;
              placed = true;
              break;
            }
          }

          previousEnd = Math.max(previousEnd, other.start + other.duration);
        }

        if (!placed) {
          const gapStart = previousEnd;
          const gapEnd = TOTAL_MINUTES;
          if (gapEnd - gapStart >= currentItem.duration) {
            updatedStart = clamp(
              desiredStart,
              gapStart,
              gapEnd - currentItem.duration
            );
            placed = true;
          }
        }

        if (!placed) {
          return prev;
        }

        const updatedItem: ScheduleItem = {
          ...currentItem,
          start: updatedStart,
        };

        const updatedSchedule = [...others, updatedItem].sort((a, b) => a.start - b.start);
        return updatedSchedule;
      }
    );

    setActiveBlock(null);
  };

  return (
    <Box
      className="scheduler"
      sx={{
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.35)",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        gap={1.5}
        className="scheduler__header"
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: { xs: "1.1rem", md: "1.25rem" },
            color: "rgba(255,255,255,0.95)",
            letterSpacing: 0.4,
          }}
        >
          Recommended study plan for today:
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 1, sm: 2 }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          sx={{
            width: "100%",
            justifyContent: { sm: "flex-end" },
            flexWrap: "wrap",
            rowGap: 0.5,
          }}
        >
          <Typography
            variant="subtitle1"
            className="scheduler__total"
            sx={{
              color: "rgba(255,255,255,0.9)",
              fontWeight: 500,
              textAlign: { xs: "left", sm: "right" },
            }}
          >
            Total study time: {totalDurationLabel}
          </Typography>
          {headerAction}
        </Stack>
      </Stack>
      <Box className="scheduler__track-wrapper">
        <Typography className="scheduler__time-label">0000</Typography>
        <Box
          className="scheduler__track"
          ref={trackRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {schedule.map((item) => {
            const leftPercent = (item.start / TOTAL_MINUTES) * 100;
            const widthPercent = (item.duration / TOTAL_MINUTES) * 100;

            return (
              <DragTimeBlock
                key={item.id}
                id={item.id}
                label={item.label}
                duration={item.duration}
                color={item.color}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  opacity: activeBlock === item.id ? 0.75 : 1,
                }}
                className="scheduler__block"
              />
            );
          })}
          <div className="scheduler__markers">
            {Array.from({ length: 7 }).map((_, index) => {
              const stepMinutes = (index + 1) * (TOTAL_MINUTES / 8);
              const label = formatTime(Math.round(stepMinutes));
              const leftPercent = (stepMinutes / TOTAL_MINUTES) * 100;
              return (
                <div
                  key={label}
                  className="scheduler__marker"
                  style={{ left: `${leftPercent}%` }}
                >
                  <span className="scheduler__marker-line" />
                  <span className="scheduler__marker-label">{label}</span>
                </div>
              );
            })}
          </div>
        </Box>
        <Typography className="scheduler__time-label scheduler__time-label--end">
          2359
        </Typography>
      </Box>
    </Box>
  );
};

export default Scheduler;

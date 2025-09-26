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
      className="flex flex-col gap-[18px] rounded-[32px] p-6 backdrop-blur-[6px]"
      sx={{
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: "32px",
        border: "1px solid rgba(255,255,255,0.35)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",

      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        gap={1.5}
        className="w-full"
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
            className="font-medium text-white/90"
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
      <Box className="grid grid-cols-[auto_1fr] items-center gap-[18px] lg:grid-cols-[auto_1fr_auto]">
        <Typography className="font-['Fredoka',sans-serif] text-base font-semibold text-[#2447b5]">
          0000
        </Typography>
        <Box
          className="relative h-[140px] rounded-[32px] border border-white/60 bg-[rgba(255,255,255,0.95)] py-5 shadow-[inset_0_0_0_1px_rgba(76,115,255,0.12)]"
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
                className="absolute top-[28px] bottom-[28px] flex cursor-grab flex-col justify-between rounded-[24px] border border-transparent p-[18px] text-[#0c1e4a] active:cursor-grabbing"
              />
            );
          })}
          <div className="pointer-events-none absolute inset-0">
            {Array.from({ length: 7 }).map((_, index) => {
              const stepMinutes = (index + 1) * (TOTAL_MINUTES / 8);
              const label = formatTime(Math.round(stepMinutes));
              const leftPercent = (stepMinutes / TOTAL_MINUTES) * 100;
              return (
                <div
                  key={label}
                  className="absolute top-[14px] bottom-[14px] flex -translate-x-1/2 flex-col items-center gap-[6px]"
                  style={{ left: `${leftPercent}%` }}
                >
                  <span className="flex-1 w-[2px] bg-[rgba(76,115,255,0.2)]" />
                  <span className="text-[0.75rem] font-['GlacialIndifference',sans-serif] text-[#1a2c5e]">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </Box>
        <Typography
          className="font-['Fredoka',sans-serif] text-base font-semibold text-[#2447b5] justify-self-end lg:justify-self-auto"
        >
          2359
        </Typography>
      </Box>
    </Box>
  );
};

export default Scheduler;

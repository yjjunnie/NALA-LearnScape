import React, { useMemo, useRef, useState } from "react";
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

const Scheduler: React.FC = () => {
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
      prev.map((item) => {
        if (item.id !== id) {
          return item;
        }
        const maxStart = TOTAL_MINUTES - item.duration;
        return {
          ...item,
          start: clamp(minutes, 0, maxStart),
        };
      })
    );

    setActiveBlock(null);
  };

  return (
    <div className="scheduler">
      <div className="scheduler__header">
        <h3>Recommended study plan for today:</h3>
        <span className="scheduler__total">Total study time: {totalDurationLabel}</span>
      </div>
      <div className="scheduler__track-wrapper">
        <div className="scheduler__time-label">0000</div>
        <div
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
        </div>
        <div className="scheduler__time-label scheduler__time-label--end">
          2359
        </div>
      </div>
    </div>
  );
};

export default Scheduler;

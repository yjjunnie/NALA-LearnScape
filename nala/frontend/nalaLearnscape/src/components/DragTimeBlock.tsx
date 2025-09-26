import React from "react";

export interface DragTimeBlockProps {
  id: string;
  label: string;
  duration: number; // minutes
  color: string;
  onDragStart: (event: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}`;
  }

  return `${hours} hr ${remainingMinutes} min`;
};

const DragTimeBlock: React.FC<DragTimeBlockProps> = ({
  id,
  label,
  duration,
  color,
  onDragStart,
  onDragEnd,
  style,
  className = "",
}) => {
  return (
    <div
      className={`drag-time-block ${className}`}
      draggable
      onDragStart={(event) => onDragStart(event, id)}
      onDragEnd={onDragEnd}
      style={{
        background: color,
        borderColor: color,
        ...style,
      }}
    >
      <span className="drag-time-block__label">{label}</span>
      <span className="drag-time-block__duration">{formatDuration(duration)}</span>
    </div>
  );
};

export default DragTimeBlock;

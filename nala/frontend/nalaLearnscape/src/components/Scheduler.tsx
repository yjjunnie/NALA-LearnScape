import React, { useState, useRef, useCallback, useEffect } from "react";

// Simple data structures
interface ScheduleItem {
  id: string;
  title: string;
  start: number; // minutes from midnight
  duration: number;
  color: string;
  predictedHours?: number;
}

interface TopicData {
  topic_id: string;
  topic_name: string;
  actual_study_hours: number;
  blooms_level: string;
  student_grade_history: number;
  topic_difficulty: number;
  exam_date: string; 
}

interface ApiResponse {
  topics: TopicData[];
  total_topics: number;
}

// Constants
const MINUTES_PER_DAY = 24 * 60;
const PIXELS_PER_HOUR = 120;
const HOUR_MARKER_PADDING = 40;
const TIMELINE_WIDTH = 24 * PIXELS_PER_HOUR + HOUR_MARKER_PADDING;
const SNAP_INTERVAL = 15;

// Color palette for different topics
const TOPIC_COLORS = ["#7EA8FF", "#4C73FF", "#3D5BDB", "#6B5CE7", "#8B5CF6"];

// Utility functions
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins}min`;
};

// Convert hours to minutes
const hoursToMinutes = (hours: number): number => {
  return Math.round(hours * 60);
};

// Snap to 15-minute intervals
const snapToInterval = (minutes: number): number => {
  return Math.round(minutes / SNAP_INTERVAL) * SNAP_INTERVAL;
};

// Urgency calculation function
        /*Factors for urgency:
        1. days until exam (closer = more urgent) - HIGHEST WEIGHT
        2. topic difficulty (higher = more urgent)
        3. lower grade history (lower grade = more urgent)
        4. higher study hours needed (more time = scheduled sooner)
        */

const calculateUrgency = (topic: TopicData): number => {
<<<<<<< HEAD
  //Factors for urgency:
  // 1. Topic difficulty (higher = more urgent)
  // 2. Lower grade history (lower grade = more urgent)
  // 3. Higher study hours needed (more time = more urgent)

  const difficultyScore = topic.topic_difficulty * 20; // 0-100
  const gradeScore = 100 - topic.student_grade_history; // Lower grade = higher urgency
  const studyHoursScore = topic.actual_study_hours * 10; // 0-100+

  return difficultyScore * 0.3 + gradeScore * 0.4 + studyHoursScore * 0.2;
=======
  const today = new Date();
  const examDate = new Date(topic.exam_date);
  const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let examProximityScore = 0;
  if (daysUntilExam < 0) { // exam passed so not important, but this will not happen because system should update new exam date. so it's just the urgency function just measures the proximity to the nearest exam for the student.
    examProximityScore = 0;
  } else if (daysUntilExam <= 7) {
    examProximityScore = 100 - (daysUntilExam * 4);
  } else if (daysUntilExam <= 30) {
    examProximityScore = 70 - ((daysUntilExam - 7) * 1.7);
  } else if (daysUntilExam <= 90) {
    examProximityScore = 30 - ((daysUntilExam - 30) * 0.33);
  } else {
    examProximityScore = Math.max(0, 10 - ((daysUntilExam - 90) * 0.05));
  }
  
  const difficultyScore = topic.topic_difficulty * 20; // 0-120
  const gradeScore = (100 - topic.student_grade_history); // 0-100
  const studyHoursScore = topic.actual_study_hours * 10; // 0-100+
  
  // Weighted calculation with exam proximity having the highest weight
  return (
    examProximityScore * 0.5 +     
    gradeScore * 0.25 +            
    difficultyScore * 0.15 +        
    studyHoursScore * 0.1          
  );
>>>>>>> 303bd005 (Scheduler)
};

// Select top 3 most urgent topics
const selectTopUrgentTopics = (topics: TopicData[]): TopicData[] => {
  const topicsWithUrgency = topics.map((topic) => ({
    ...topic,
    urgency: calculateUrgency(topic),
  }));

  // Sort by urgency (descending) and take top 3
  return topicsWithUrgency
    .sort((a, b) => b.urgency - a.urgency)
    .slice(0, 3)
    .map(({ urgency, ...topic }) => topic);
};

const currentStartTime = "08:30"; // 8:30 AM

// Drop preview component
interface DropPreviewProps {
  start: number;
  duration: number;
  isValid: boolean;
}

const DropPreview: React.FC<DropPreviewProps> = ({
  start,
  duration,
  isValid,
}) => {
  const leftPos =
    (start / MINUTES_PER_DAY) * (TIMELINE_WIDTH - HOUR_MARKER_PADDING) +
    HOUR_MARKER_PADDING / 2;
  const width =
    (duration / MINUTES_PER_DAY) * (TIMELINE_WIDTH - HOUR_MARKER_PADDING);

  return (
    <div
      className={`absolute top-16 bottom-4 rounded-2xl border-2 border-dashed transition-all ${
        isValid
          ? "bg-green-200/50 border-green-400"
          : "bg-red-200/50 border-red-400"
      }`}
      style={{
        left: `${leftPos}px`,
        width: `${width}px`,
      }}
    >
      <div className="p-3 h-full flex items-center justify-center">
        <div
          className={`text-sm font-medium ${
            isValid ? "text-green-700" : "text-red-700"
          }`}
        >
          {isValid ? "✓ Drop here" : "✗ Invalid position"}
        </div>
      </div>
    </div>
  );
};

// Schedule block component
interface ScheduleBlockProps {
  item: ScheduleItem;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onResize: (id: string, edge: "left" | "right", startX: number) => void;
  isDragging?: boolean;
}

const ScheduleBlock: React.FC<ScheduleBlockProps> = ({
  item,
  onDragStart,
  onResize,
  isDragging,
}) => {
  const leftPos =
    (item.start / MINUTES_PER_DAY) * (TIMELINE_WIDTH - HOUR_MARKER_PADDING) +
    HOUR_MARKER_PADDING / 2;
  const width =
    (item.duration / MINUTES_PER_DAY) * (TIMELINE_WIDTH - HOUR_MARKER_PADDING);

  const startTime = minutesToTime(item.start);
  const endTime = minutesToTime(item.start + item.duration);
  const durationText = formatDuration(item.duration);

  const handleResizeStart = (e: React.MouseEvent, edge: "left" | "right") => {
    e.stopPropagation();
    e.preventDefault();
    onResize(item.id, edge, e.clientX);
  };

  const handleDragStart = (e: React.DragEvent) => {
    const dragImg = document.createElement("div");
    dragImg.style.cssText = `
      position: absolute;
      top: -1000px;
      background: ${item.color};
      color: white;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    dragImg.textContent = item.title;
    document.body.appendChild(dragImg);
    e.dataTransfer.setDragImage(dragImg, 50, 20);

    setTimeout(() => document.body.removeChild(dragImg), 0);

    onDragStart(e, item.id);
  };

  if (isDragging) {
    return (
      <div
        className="absolute top-16 bottom-4 rounded-2xl border-2 border-dashed border-gray-400 bg-gray-200/50"
        style={{
          left: `${leftPos}px`,
          width: `${width}px`,
        }}
      >
        <div className="p-3 h-full flex items-center justify-center text-gray-500 text-sm">
          Dragging...
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="absolute top-16 bottom-4 group cursor-grab active:cursor-grabbing rounded-2xl border-2 border-white/30 text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] hover:border-white/50"
      style={{
        left: `${leftPos}px`,
        width: `${width}px`,
        backgroundColor: item.color,
      }}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-2xl flex items-center justify-center"
        onMouseDown={(e) => handleResizeStart(e, "left")}
      >
        <div className="w-0.5 h-6 bg-white/70 rounded" />
      </div>

      {/* Content */}
      <div className="p-3 h-full flex flex-col justify-between pointer-events-none">
        <div>
          <div className="font-semibold text-sm leading-tight">
            {item.title}
          </div>
          <div className="text-xs opacity-80 mt-1">{durationText}</div>
        </div>
        <div className="text-xs font-medium">
          {startTime} - {endTime}
        </div>
      </div>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-r-2xl flex items-center justify-center"
        onMouseDown={(e) => handleResizeStart(e, "right")}
      >
        <div className="w-0.5 h-6 bg-white/70 rounded" />
      </div>
    </div>
  );
};

// Main scheduler component
const Scheduler: React.FC = () => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    start: number;
    duration: number;
    isValid: boolean;
  } | null>(null);
  const [resizing, setResizing] = useState<{
    id: string;
    edge: "left" | "right";
    startX: number;
    originalItem: ScheduleItem;
  } | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "http://localhost:5000/student/student456/topics"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch topics");
        }

        const data: ApiResponse = await response.json();

        // Select top 3 urgent topics
        const topUrgentTopics = selectTopUrgentTopics(data.topics);

        // Convert to schedule items
        let currentStart = timeToMinutes("08:00");
        const scheduleItems: ScheduleItem[] = topUrgentTopics.map(
          (topic, index) => {
            const duration = hoursToMinutes(topic.actual_study_hours);
            const item = {
              id: topic.topic_id,
              title: topic.topic_name,
              start: currentStart,
              duration: duration,
              color: TOPIC_COLORS[index % TOPIC_COLORS.length],
              predictedHours: topic.actual_study_hours,
            };

            // Add 30 min break between sessions
            currentStart += duration + 30;

            return item;
          }
        );

        setSchedule(scheduleItems);
        setError(null);
      } catch (err) {
        console.error("Error fetching topics:", err);
        setError(
          "Failed to load topics. Please ensure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  // Auto-scroll to first item
  useEffect(() => {
    if (schedule.length > 0 && scrollContainerRef.current) {
      const firstItem = schedule[0];
      const scrollPos =
        (firstItem.start / MINUTES_PER_DAY) *
        (TIMELINE_WIDTH - HOUR_MARKER_PADDING);
      scrollContainerRef.current.scrollLeft = Math.max(0, scrollPos - 100);
    }
  }, [schedule]);

  // Calculate total study time
  const totalMinutes = schedule.reduce((sum, item) => sum + item.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const totalTimeText =
    totalHours > 0
      ? `${totalHours}h ${remainingMins}min`
      : `${remainingMins}min`;

  // Check if a position is valid (no collisions)
  const isValidPosition = useCallback(
    (start: number, duration: number, excludeId?: string) => {
      if (start < 0 || start + duration > MINUTES_PER_DAY) return false;

      return !schedule.some((item) => {
        if (item.id === excludeId) return false;
        const itemEnd = item.start + item.duration;
        const newEnd = start + duration;
        return !(start >= itemEnd || newEnd <= item.start);
      });
    },
    [schedule]
  );

  // Find the nearest valid position
  const findNearestValidPosition = useCallback(
    (targetStart: number, duration: number, excludeId?: string) => {
      if (isValidPosition(targetStart, duration, excludeId)) {
        return targetStart;
      }

      const otherItems = schedule
        .filter((item) => item.id !== excludeId)
        .sort((a, b) => a.start - b.start);

      if (otherItems.length === 0 || otherItems[0].start >= duration) {
        return Math.max(
          0,
          Math.min(
            targetStart,
            otherItems[0]?.start - duration || MINUTES_PER_DAY - duration
          )
        );
      }

      for (let i = 0; i < otherItems.length - 1; i++) {
        const gapStart = otherItems[i].start + otherItems[i].duration;
        const gapEnd = otherItems[i + 1].start;

        if (gapEnd - gapStart >= duration) {
          const preferredStart = Math.max(
            gapStart,
            Math.min(targetStart, gapEnd - duration)
          );
          return preferredStart;
        }
      }

      const lastItem = otherItems[otherItems.length - 1];
      const afterLast = lastItem.start + lastItem.duration;
      if (afterLast + duration <= MINUTES_PER_DAY) {
        return Math.max(
          afterLast,
          Math.min(targetStart, MINUTES_PER_DAY - duration)
        );
      }

      return targetStart;
    },
    [schedule, isValidPosition]
  );

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (!draggedId || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = Math.max(
        HOUR_MARKER_PADDING / 2,
        Math.min(e.clientX - rect.left, rect.width - HOUR_MARKER_PADDING / 2)
      );
      const targetMinutes = snapToInterval(
        ((x - HOUR_MARKER_PADDING / 2) / (rect.width - HOUR_MARKER_PADDING)) *
          MINUTES_PER_DAY
      );

      const draggedItem = schedule.find((item) => item.id === draggedId);
      if (!draggedItem) return;

      const nearestStart = findNearestValidPosition(
        targetMinutes,
        draggedItem.duration,
        draggedId
      );
      const isValid = isValidPosition(
        nearestStart,
        draggedItem.duration,
        draggedId
      );

      setDragPreview({
        start: nearestStart,
        duration: draggedItem.duration,
        isValid,
      });
    },
    [draggedId, schedule, findNearestValidPosition, isValidPosition]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragPreview(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      if (!dragPreview || !draggedId) return;

      if (dragPreview.isValid) {
        setSchedule((prev) =>
          prev
            .map((item) =>
              item.id === draggedId
                ? { ...item, start: dragPreview.start }
                : item
            )
            .sort((a, b) => a.start - b.start)
        );
      }

      setDraggedId(null);
      setDragPreview(null);
    },
    [draggedId, dragPreview]
  );

  // Resize handlers
  const handleResize = useCallback(
    (id: string, edge: "left" | "right", startX: number) => {
      const item = schedule.find((i) => i.id === id);
      if (!item) return;

      const resizeState = { id, edge, startX, originalItem: item };
      setResizing(resizeState);

      const handleMouseMove = (e: MouseEvent) => {
        if (!timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const deltaX = e.clientX - resizeState.startX;
        const deltaMinutes = snapToInterval(
          (deltaX / (rect.width - HOUR_MARKER_PADDING)) * MINUTES_PER_DAY
        );

        let newStart = resizeState.originalItem.start;
        let newDuration = resizeState.originalItem.duration;

        if (resizeState.edge === "left") {
          const maxStartShift = resizeState.originalItem.duration - 15;
          const actualShift = Math.min(deltaMinutes, maxStartShift);
          newStart = Math.max(0, resizeState.originalItem.start + actualShift);
          newDuration =
            resizeState.originalItem.duration -
            (newStart - resizeState.originalItem.start);
        } else {
          const maxEndPosition = MINUTES_PER_DAY;
          const maxDuration = maxEndPosition - resizeState.originalItem.start;
          newDuration = Math.max(
            15,
            Math.min(
              resizeState.originalItem.duration + deltaMinutes,
              maxDuration
            )
          );
        }

        setSchedule((prev) =>
          prev.map((item) =>
            item.id === resizeState.id
              ? { ...item, start: newStart, duration: newDuration }
              : item
          )
        );
      };

      const handleMouseUp = () => {
        setResizing(null);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [schedule]
  );

  // Generate hour markers
  const hourMarkers = Array.from({ length: 25 }, (_, hour) => ({
    hour,
    left:
      ((hour * 60) / MINUTES_PER_DAY) * (TIMELINE_WIDTH - HOUR_MARKER_PADDING) +
      HOUR_MARKER_PADDING / 2,
    label: `${hour.toString().padStart(2, "0")}:00`,
  }));

  // Generate 15-minute grid lines
  const gridLines = Array.from({ length: 96 }, (_, index) => {
    const minutes = index * 15;
    const left =
      (minutes / MINUTES_PER_DAY) * (TIMELINE_WIDTH - HOUR_MARKER_PADDING) +
      HOUR_MARKER_PADDING / 2;
    const isHour = minutes % 60 === 0;
    return { minutes, left, isHour };
  });

  if (loading) {
    return (
      <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-3xl p-8">
        <div className="text-center text-white font-bold">
          Loading study schedule...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-3xl p-8">
        <div className="text-center text-red-300 font-bold">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-3xl p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-white/90 font-bold">
          Total study time: {totalTimeText} (Top 3 urgent topics)
        </div>
      </div>

      {/* Timeline */}
      <div className="overflow-x-auto" ref={scrollContainerRef}>
        <div
          ref={timelineRef}
          className="relative bg-white/95 rounded-3xl border border-white/60"
          style={{
            width: TIMELINE_WIDTH,
            height: 250,
            minWidth: TIMELINE_WIDTH,
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Grid lines */}
          {gridLines.map(({ minutes, left, isHour }) => (
            <div
              key={minutes}
              className={`absolute top-0 bottom-0 ${
                isHour ? "w-0.5 bg-blue-400/50" : "w-px bg-blue-300/20"
              }`}
              style={{ left }}
            />
          ))}

          {/* Hour markers */}
          {hourMarkers.map(({ hour, left, label }) => (
            <div
              key={hour}
              className="absolute top-2 z-10"
              style={{ left: left - 20 }}
            >
              <div className="bg-white/90 px-2 py-1 rounded text-xs font-semibold text-blue-900 shadow-sm">
                {label}
              </div>
            </div>
          ))}

          {/* Drop preview */}
          {dragPreview && (
            <DropPreview
              start={dragPreview.start}
              duration={dragPreview.duration}
              isValid={dragPreview.isValid}
            />
          )}

          {/* Schedule blocks */}
          {schedule.map((item) => (
            <ScheduleBlock
              key={item.id}
              item={item}
              onDragStart={handleDragStart}
              onResize={handleResize}
              isDragging={draggedId === item.id}
            />
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-white/60 text-sm mt-4 space-y-1 font-bold">
        <div>← Scroll horizontally to view full timeline →</div>
        <div className="text-xs">
          Drag blocks to move • Drag edges to resize • Snaps to 15-minute
          intervals
        </div>
      </div>
    </div>
  );
};

export default Scheduler;

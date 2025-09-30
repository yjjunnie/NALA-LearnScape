import React, { useEffect, useRef } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

interface KnowledgePopupProps {
  position: { top: number; left: number };
  size: { width: number; height: number };
  headerColor?: string;
  title: string;
  isExpanded: boolean;
  isDragging: boolean;
  onHeaderMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onToggleExpand: () => void;
  onClose: () => void;
  onResizeMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
  resetScrollOnContentChange?: boolean;
  onScrollContainerReady?: (element: HTMLDivElement | null) => void;
}

const KnowledgePopup: React.FC<KnowledgePopupProps> = ({
  position,
  size,
  headerColor,
  title,
  isExpanded,
  isDragging,
  onHeaderMouseDown,
  onToggleExpand,
  onClose,
  onResizeMouseDown,
  children,
  resetScrollOnContentChange = true,
  onScrollContainerReady,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onScrollContainerReady?.(scrollContainerRef.current);

    return () => {
      onScrollContainerReady?.(null);
    };
  }, [onScrollContainerReady]);

  useEffect(() => {
    if (!resetScrollOnContentChange) {
      return;
    }

    const element = scrollContainerRef.current;
    if (!element) {
      return;
    }

    element.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [children, isExpanded, title, resetScrollOnContentChange]);

  return (
    <div
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
        width: size.width,
        height: size.height,
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.25)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 20,
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div
        style={{
          padding: "12px 16px",
          background: headerColor || "#1f2937",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          cursor: isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={onHeaderMouseDown}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 600, fontSize: "14px" }}>{title}</span>
          <span style={{ fontSize: "11px", opacity: 0.85 }}>
            Embedded page preview
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onToggleExpand();
            }}
            style={{
              border: "none",
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              padding: "6px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              cursor: "pointer",
              fontWeight: 600,
              letterSpacing: "0.01em",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isExpanded ? (
              <>
                <Minimize2 size={14} />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <Maximize2 size={14} />
                <span>Open Full Page</span>
              </>
            )}
          </button>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            style={{
              border: "none",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "14px",
            }}
            aria-label="Close embedded page"
          >
            ×
          </button>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          background: "#f8fafc",
          padding: "16px",
        }}
      >
        <div
          ref={scrollContainerRef}
          style={{ height: "100%", overflow: "auto" }}
        >
          {children}
        </div>
      </div>
      <div
        onMouseDown={onResizeMouseDown}
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 18,
          height: 18,
          cursor: "nwse-resize",
          background:
            "linear-gradient(135deg, rgba(148,163,184,0.1) 0%, rgba(148,163,184,0.6) 100%)",
          clipPath: "polygon(100% 0, 0 100%, 100% 100%)",
        }}
      />
    </div>
  );
};

export default KnowledgePopup;

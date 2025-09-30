import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import TopicTaxonomyProgression from "../../components/TopicTaxonomyProgression";

interface TaxonomyWidgetProps {
  position: { x: number; y: number };
  collapsed: boolean;
  isDragging: boolean;
  moduleDisplay: string | null;
  moduleFilter?: string;
  onToggleCollapsed: () => void;
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const TaxonomyWidget: React.FC<TaxonomyWidgetProps> = ({
  position,
  collapsed,
  isDragging,
  moduleDisplay,
  moduleFilter,
  onToggleCollapsed,
  onMouseDown,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
        zIndex: 28,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          width: collapsed ? 280 : 360,
          maxHeight: collapsed ? 110 : 460,
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 22px 42px rgba(15, 23, 42, 0.28)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          onMouseDown={onMouseDown}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "#1d4ed8",
            color: "#fff",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontFamily: "Fredoka, sans-serif",
              fontWeight: 600,
              fontSize: "17px",
              color: "#ffffff",
            }}
          >
            Topic taxonomy
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleCollapsed();
            }}
            aria-label={collapsed ? "Expand topic taxonomy" : "Collapse topic taxonomy"}
            style={{
              border: "none",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.16)",
              color: "#fff",
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
        {collapsed ? (
          <div
            style={{
              padding: "10px 16px",
              fontSize: "11.5px",
              color: "#475569",
              background: "#f8fafc",
            }}
          >
            View taxonomy progression
          </div>
        ) : (
          <div
            style={{
              padding: "12px 16px",
              background: "#f8fafc",
              overflowY: "auto",
              maxHeight: 360,
            }}
          >
            {moduleDisplay && (
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: "8px",
                  fontFamily: '"GlacialIndifference", sans-serif',
                }}
              >
                Showing module:
                <span
                  style={{
                    color: "#1d4ed8",
                    marginLeft: "4px",
                  }}
                >
                  {moduleDisplay}
                </span>
              </div>
            )}
            <TopicTaxonomyProgression passedModule={moduleFilter} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxonomyWidget;

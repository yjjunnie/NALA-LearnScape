import React from "react";
import { Hand, Info, Pencil, Trash2 } from "lucide-react";

interface ThreadMapControlsProps {
  controlPosition: { x: number; y: number };
  controlButtonSize: number;
  isDraggingControl: boolean;
  showInfoTooltip: boolean;
  infoPanelWidth: number;
  infoOffsetX: number;
  infoOffsetY: number;
  isEditMode: boolean;
  editToggleLabel: string;
  hasSelection: boolean;
  isDeleteHovered: boolean;
  deleteSelectionLabel: string;
  edgeTypeOptions: string[];
  edgeTypeFilter: string;
  showConceptParentEdges: boolean;
  getNodeCount: () => number;
  getEdgeCount: () => number;
  onControlMouseDown: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onInfoToggle: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onToggleEditMode: () => void;
  onDeleteSelection: () => void;
  onDeleteHoverChange: (hovered: boolean) => void;
  onCloseInfoTooltip: () => void;
  onConceptParentToggle: (checked: boolean) => void;
  onEdgeTypeFilterChange: (value: string) => void;
}

const ThreadMapControls: React.FC<ThreadMapControlsProps> = ({
  controlPosition,
  controlButtonSize,
  isDraggingControl,
  showInfoTooltip,
  infoPanelWidth,
  infoOffsetX,
  infoOffsetY,
  isEditMode,
  editToggleLabel,
  hasSelection,
  isDeleteHovered,
  deleteSelectionLabel,
  edgeTypeOptions,
  edgeTypeFilter,
  showConceptParentEdges,
  getNodeCount,
  getEdgeCount,
  onControlMouseDown,
  onInfoToggle,
  onToggleEditMode,
  onDeleteSelection,
  onDeleteHoverChange,
  onCloseInfoTooltip,
  onConceptParentToggle,
  onEdgeTypeFilterChange,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: controlPosition.y,
        left: controlPosition.x,
        zIndex: 30,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            type="button"
            onMouseDown={(event) => {
              onControlMouseDown(event);
            }}
            onClick={(event) => {
              event.stopPropagation();
              onInfoToggle(event);
            }}
            aria-label="Threadmap information"
            title="Threadmap information"
            style={{
              width: controlButtonSize,
              height: controlButtonSize,
              borderRadius: "50%",
              border: "none",
              background: "#1d4ed8",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 5px 20px rgba(15, 23, 42, 0.45)",
              cursor: isDraggingControl ? "grabbing" : "grab",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              transform: isDraggingControl ? "scale(0.98)" : "scale(1)",
            }}
          >
            <Info size={22} />
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "6px 8px",
              background: "rgba(101, 119, 181, 0.78)",
              borderRadius: "9999px",
              boxShadow: "0 5px 20px rgba(15, 23, 42, 0.45)",
            }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleEditMode();
              }}
              aria-pressed={isEditMode}
              aria-label={editToggleLabel}
              title={editToggleLabel}
              style={{
                width: controlButtonSize - 6,
                height: controlButtonSize - 6,
                borderRadius: "50%",
                border: "none",
                background: isEditMode ? "#dc2626" : "#1d4ed8",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isEditMode
                  ? "0 5px 20px rgba(220, 38, 38, 0.45)"
                  : "0 5px 20px rgba(126, 168, 255, 0.45)",
                cursor: "pointer",
                transition: "background 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              {isEditMode ? <Pencil size={18} /> : <Hand size={18} />}
            </button>
            {isEditMode && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteSelection();
                }}
                onMouseEnter={() => hasSelection && onDeleteHoverChange(true)}
                onMouseLeave={() => hasSelection && onDeleteHoverChange(false)}
                style={{
                  width: controlButtonSize - 6,
                  height: controlButtonSize - 6,
                  borderRadius: "50%",
                  border: "none",
                  background: hasSelection
                    ? isDeleteHovered
                      ? "#b91c1c"
                      : "#dc2626"
                    : "#e2e8f0",
                  color: hasSelection ? "#fff" : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: hasSelection
                    ? "0 12px 26px rgba(220, 38, 38, 0.4)"
                    : "none",
                  cursor: hasSelection ? "pointer" : "not-allowed",
                  transition: "background 0.2s ease",
                }}
                aria-label={deleteSelectionLabel}
                title={deleteSelectionLabel}
                disabled={!hasSelection}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
      {showInfoTooltip && (
        <div
          style={{
            pointerEvents: "auto",
            position: "absolute",
            top: infoOffsetY,
            left: infoOffsetX,
            width: infoPanelWidth,
            background: "#ffffff",
            borderRadius: "16px",
            boxShadow: "0 18px 35px rgba(15, 23, 42, 0.28)",
            padding: "16px",
            fontFamily: "GlacialIndifference, sans-serif",
            color: "#1e293b",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              gap: "12px",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "15px", color: "#4C73FF" }}>
              THREADMAP QUICK GUIDE
            </div>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onCloseInfoTooltip();
              }}
              aria-label="Close threadmap tips"
              style={{
                border: "none",
                background: "#e2e8f0",
                color: "#0f172a",
                width: 26,
                height: 26,
                borderRadius: "8px",
                fontWeight: 700,
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          <div
            style={{
              fontSize: "11.5px",
              color: "#475569",
              lineHeight: 1.5,
              marginBottom: "12px",
            }}
          >
            • Hover over open space to add a new node.
            <br />• Use node handles to connect concepts.
            <br />• Click nodes or edges to focus them.
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#0f172a",
              background: "#f1f5f9",
              borderRadius: "10px",
              padding: "8px 10px",
              display: "flex",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span>Nodes: {getNodeCount()}</span>
            <span>Edges: {getEdgeCount()}</span>
          </div>
          <div
            style={{
              marginTop: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "11.5px",
              color: "#0f172a",
            }}
          >
            <input
              id="concept-parent-toggle"
              type="checkbox"
              checked={showConceptParentEdges}
              onChange={(event) => onConceptParentToggle(event.target.checked)}
              style={{
                width: 14,
                height: 14,
                cursor: "pointer",
                accentColor: "#1d4ed8",
              }}
            />
            <label
              htmlFor="concept-parent-toggle"
              style={{
                cursor: "pointer",
                fontWeight: 600,
                fontFamily: '"GlacialIndifference", sans-serif',
              }}
            >
              Show concept-parent edges
            </label>
          </div>
          {edgeTypeOptions.length > 0 && (
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <label
                htmlFor="edge-type-filter"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#0f172a",
                }}
              >
                Relationship filter
              </label>
              <select
                id="edge-type-filter"
                value={edgeTypeFilter}
                onChange={(event) => onEdgeTypeFilterChange(event.target.value)}
                style={{
                  borderRadius: "10px",
                  border: "1px solid #cbd5f5",
                  padding: "6px 8px",
                  fontSize: "11.5px",
                  color: "#0f172a",
                  background: "#f8fafc",
                  fontFamily: '"GlacialIndifference", sans-serif',
                }}
              >
                <option value="all">All relationship types</option>
                {edgeTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ThreadMapControls;

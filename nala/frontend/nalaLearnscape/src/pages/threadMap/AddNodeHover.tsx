import React from "react";
import { Plus } from "lucide-react";
import type { XYPosition } from "@xyflow/react";

interface AddNodeHoverProps {
  screenPosition: XYPosition;
  onClick: () => void;
}

const AddNodeHover: React.FC<AddNodeHoverProps> = ({ screenPosition, onClick }) => (
  <div
    onClick={onClick}
    style={{
      position: "absolute",
      left: screenPosition.x - 25,
      top: screenPosition.y - 25,
      width: "50px",
      height: "50px",
      borderRadius: "50%",
      backgroundColor: "rgba(128, 128, 128, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      zIndex: 1000,
      border: "2px dashed rgba(255, 255, 255, 0.8)",
      transition: "all 0.2s ease",
      pointerEvents: "all",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = "rgba(100, 100, 100, 0.9)";
      e.currentTarget.style.transform = "scale(1.1)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "rgba(128, 128, 128, 0.8)";
      e.currentTarget.style.transform = "scale(1)";
    }}
  >
    <Plus size={20} color="white" />
  </div>
);

export default AddNodeHover;

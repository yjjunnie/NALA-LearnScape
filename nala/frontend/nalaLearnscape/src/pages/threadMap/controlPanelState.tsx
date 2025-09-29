import { Info, Plus, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ControlPanelState = {
  Icon: LucideIcon;
  color: string;
  shadow: string;
  label: string;
  deleteLabel?: string;
};

export type ControlMode = "info" | "edge" | "delete-node" | "delete-edge";

const CONTROL_MAP: Record<ControlMode, ControlPanelState> = {
  info: {
    Icon: Info,
    color: "#1f2937",
    shadow: "0 12px 26px rgba(15, 23, 42, 0.35)",
    label: "Threadmap information",
  },
  edge: {
    Icon: Plus,
    color: "#2563eb",
    shadow: "0 12px 26px rgba(37, 99, 235, 0.45)",
    label: "Edge creation in progress (click to cancel)",
  },
  "delete-node": {
    Icon: Trash2,
    color: "#ef4444",
    shadow: "0 12px 26px rgba(239, 68, 68, 0.45)",
    label: "Delete selected node",
    deleteLabel: "Delete Selected Node",
  },
  "delete-edge": {
    Icon: Trash2,
    color: "#ef4444",
    shadow: "0 12px 26px rgba(239, 68, 68, 0.45)",
    label: "Delete selected edge",
    deleteLabel: "Delete Selected Edge",
  },
};

export const getControlMode = (
  selectedNode: string | null,
  selectedEdge: string | null,
  isAddingEdge: boolean,
  isEditMode: boolean
): ControlMode => {
  if (isAddingEdge) return "edge";
  if (!isEditMode) return "info";
  if (selectedNode) return "delete-node";
  if (selectedEdge) return "delete-edge";
  return "info";
};

export const getControlPanelState = (
  mode: ControlMode
): ControlPanelState => CONTROL_MAP[mode];


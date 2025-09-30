import React, { useMemo, useState } from "react";
import { Menu, MenuItem } from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import { ThreadMap } from "../pages";

export type ThreadMapModule = {
  id: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
};

const getModuleLabel = (module?: ThreadMapModule) => {
  if (!module) {
    return "Select a Module";
  }

  const identifier = module.code ?? "";
  const name = module.name ?? "";
  return [identifier, name].filter(Boolean).join(" ") || "Module";
};

type ThreadMapSectionProps = {
  modules?: ThreadMapModule[];
  onModuleSelect: (moduleId: string) => void;
  selectedModuleId?: string;
};

const ThreadMapSection: React.FC<ThreadMapSectionProps> = ({
  modules = [],
  onModuleSelect,
  selectedModuleId,
}) => {
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);

  const selectedModule = useMemo(
    () => modules.find((module) => module.id === selectedModuleId),
    [modules, selectedModuleId]
  );

  const handleModuleSelect = (moduleId: string) => {
    onModuleSelect(moduleId);
    setFilterAnchor(null);
  };

  if (modules.length === 0) {
    return (
      <div
        className="flex flex-col gap-4 rounded-[20px] px-6 py-6 md:px-8 md:py-8 bg-white"
        style={{ border: "2px solid rgba(76,115,255,0.12)" }}
      >
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-gray-500">No modules available</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-4 rounded-[20px] px-6 py-6 md:px-8 md:py-8 bg-white"
      style={{ border: "2px solid rgba(76,115,255,0.12)" }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 w-full">
        <div>
          <h2
            className="text-3xl mb-1 text-[#4C73FF]"
            style={{ fontFamily: '"Fredoka", sans-serif', fontWeight: 700 }}
          >
            {getModuleLabel(selectedModule)}
          </h2>
          {selectedModule?.description && (
            <p className="text-sm text-gray-600">
              {selectedModule.description}
            </p>
          )}
        </div>

        <div className="flex items-center">
          <button
            className="flex items-center gap-2 px-6 py-2 text-white rounded-full font-medium hover:opacity-90 transition-opacity"
            style={{
              background: "linear-gradient(135deg, #4C73FF 0%, #7EA8FF 100%)",
              fontFamily: "Fredoka, sans-serif",
            }}
            onClick={(event) => setFilterAnchor(event.currentTarget)}
          >
            <FilterListRoundedIcon className="w-5 h-5" />
            {getModuleLabel(selectedModule)}
          </button>

          <Menu
            anchorEl={filterAnchor}
            open={Boolean(filterAnchor)}
            onClose={() => setFilterAnchor(null)}
            MenuListProps={{ "aria-label": "Select module" }}
            slotProps={{
              paper: {
                sx: {
                  borderRadius: 3,
                  minWidth: 280,
                  p: 1,
                },
              },
            }}
          >
            {modules.map((module) => (
              <MenuItem
                key={module.id}
                selected={module.id === selectedModuleId}
                onClick={() => handleModuleSelect(module.id)}
                sx={{
                  borderRadius: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 0.5,
                  py: 1.5,
                }}
              >
                <div
                  className="font-semibold"
                  style={{
                    color:
                      module.id === selectedModuleId ? "#4C73FF" : "#1a2c5e",
                    fontFamily: '"Fredoka", sans-serif',
                  }}
                >
                  {getModuleLabel(module)}
                </div>
                {module.description && (
                  <div className="text-sm text-gray-600">
                    {module.description}
                  </div>
                )}
              </MenuItem>
            ))}
          </Menu>
        </div>
      </div>

      <div
        className="relative rounded-[28px] p-3 overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg,rgba(232,241,255,0.8) 0%,rgba(244,248,255,0.95) 100%)",
        }}
      >
        {selectedModuleId ? (
          <div className="relative h-[500px] w-full">
            <ThreadMap module_id={selectedModuleId} />
          </div>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-gray-500">
            Please select a module to view its thread map
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadMapSection;

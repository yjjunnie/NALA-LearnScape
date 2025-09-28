import React, { useState, useEffect } from "react";
import { Menu, MenuItem } from "@mui/material";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";

// Types for backend integration
type Module = {
  id: string;
  code: string;
  name: string;
  description?: string;
};

type ThreadMapSectionProps = {
  // Props for backend integration
  studentId?: string;
  onModuleSelect: (moduleId: string) => void;
  selectedModuleId?: string;
  // Optional: if you want to pass modules directly instead of fetching
  modules?: Module[];
};

const ThreadMapSection: React.FC<ThreadMapSectionProps> = ({
  studentId,
  onModuleSelect,
  selectedModuleId,
  modules: passedModules,
}) => {
  const [modules, setModules] = useState<Module[]>(passedModules || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);

  // Fetch student modules from backend
  useEffect(() => {
    if (passedModules) {
      setModules(passedModules);
      return;
    }

    if (!studentId) return;

    const fetchModules = async () => {
      setLoading(true);
      setError(null);

      try {
        // Replace with your actual API endpoint
        const response = await fetch(`/api/students/${studentId}/modules`);

        if (!response.ok) {
          throw new Error("Failed to fetch modules");
        }

        const data = await response.json();
        setModules(data);

        // Auto-select first module if none selected
        if (data.length > 0 && !selectedModuleId) {
          onModuleSelect(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching modules:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [studentId, passedModules, selectedModuleId, onModuleSelect]);

  const selectedModule = modules.find(
    (module) => module.id === selectedModuleId
  );

  const handleModuleSelect = (moduleId: string) => {
    onModuleSelect(moduleId);
    setFilterAnchor(null);
  };

  if (loading) {
    return (
      <div
        className="flex flex-col gap-4 rounded-[20px] px-6 py-6 md:px-8 md:py-8 bg-white"
        style={{ border: "2px solid rgba(76,115,255,0.12)" }}
      >
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-gray-500">Loading modules...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col gap-4 rounded-[20px] px-6 py-6 md:px-8 md:py-8 bg-white"
        style={{ border: "2px solid rgba(76,115,255,0.12)" }}
      >
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div
        className="flex flex-col gap-4 rounded-[20px] px-6 py-6 md:px-8 md:py-8 bg-white"
        style={{ border: "2px solid rgba(76,115,255,0.12)" }}
      >
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-gray-500">No modules found</div>
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
            className="text-2xl mb-1 text-[#4C73FF]"
            style={{ fontFamily: '"Fredoka", sans-serif' }}
          >
            {selectedModule
              ? `${selectedModule.code} ${selectedModule.name}`
              : "Select a Module"}
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
            }}
            onClick={(event) => setFilterAnchor(event.currentTarget)}
          >
            <FilterListRoundedIcon className="w-5 h-5" />
            Select Module
          </button>

          <Menu
            anchorEl={filterAnchor}
            open={Boolean(filterAnchor)}
            onClose={() => setFilterAnchor(null)}
            MenuListProps={{ "aria-label": "Select module" }}
            PaperProps={{
              sx: {
                borderRadius: 3,
                minWidth: 280,
                p: 1,
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
                  {module.code} {module.name}
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
        className="min-h-[300px] rounded-[28px] p-3 flex items-center justify-center"
        style={{
          background:
            "linear-gradient(180deg,rgba(232,241,255,0.8) 0%,rgba(244,248,255,0.95) 100%)",
        }}
      >
        {selectedModuleId ? (
          <div className="text-gray-600 text-center">
            <p>Thread map for {selectedModule?.code} will be displayed here</p>
            <p className="text-sm mt-2">Module ID: {selectedModuleId}</p>
          </div>
        ) : (
          <div className="text-gray-500">
            Please select a module to view its thread map
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadMapSection;

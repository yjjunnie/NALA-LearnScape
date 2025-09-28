// src/pages/Modules.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { IconButton } from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SideNav from "../components/SideNav";

interface Module {
  id: number;
  index: number;
  name: string;
}

export const Modules: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [studentModules, setStudentModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const handleCloseDrawer = () => setIsDrawerOpen(false);

        useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fixed: Changed from /api/students/1/ to /api/student/1/
        const response = await axios.get(`/api/student/1/`);
        
        // Debug: Log the entire response to see what we're getting
        console.log("Full API Response:", response.data);
        console.log("enrolled_modules_info:", response.data.enrolled_modules_info);
        console.log("enrolled_modules:", response.data.enrolled_modules);
        
        setStudentModules(response.data.enrolled_modules_info || []);
      } catch (error) {
        console.error("Failed to fetch modules", error);
        setError("Failed to load modules. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 lg:p-8">
      <div className="bg-primary-dark rounded-xl shadow-lg mb-8 p-4 md:p-6">
        <div className="flex items-center gap-8">
          {/* Navigation Button */}
          <IconButton
            onClick={toggleDrawer}
            sx={{
              borderRadius: 2.5,
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "white",
              p: { xs: 1, sm: 1.5 },
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderColor: "rgba(255, 255, 255, 0.3)",
                transform: "translateY(-1px)",
              },
              "&:active": {
                transform: "translateY(0)",
              },
            }}
          >
            <MenuRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </IconButton>

          <h1 className="text-2xl md:text-3xl font-bold text-white flex-1 font-family-display">
            Modules
          </h1>
        </div>
      </div>

      {/* Page Content */}
      <div className="bg-white rounded-xl p-6 flex flex-col gap-3">
        {loading ? (
          <p className="text-slate-600 text-lg">Loading modules...</p>
        ) : error ? (
          <p className="text-red-600 text-lg">{error}</p>
        ) : studentModules.length === 0 ? (
          <p className="text-slate-600 text-lg">No modules found.</p>
        ) : (
          studentModules.map((module) => (
            <div
              key={module.id}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 bg-[rgba(232,241,255,0.6)]"
            >
              <p className="font-medium">{module.name}</p>
              <span className="text-sm text-slate-500">Index: {module.index}</span>
            </div>
          ))
        )}
      </div>

      {/* Side Navigation Drawer */}
      <SideNav isOpen={isDrawerOpen} onClose={handleCloseDrawer} />
    </div>
  );
};

export default Modules;
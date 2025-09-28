// src/pages/Modules.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { IconButton } from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SideNav from "../components/SideNav";
import { Link } from 'react-router-dom';

interface Module {
  id: number;
  index: number;
  name: string;
}

const taxonomy_levels = {
  "Remember": {
    "Level": 1,
    "Description": "Recall facts and basic concepts",
  },
  "Understand": {
    "Level": 2,
    "Description": "Explain ideas or concepts",
  },
  "Apply": {
    "Level": 3,
    "Description": "Use information in new situations",
  },
  "Analyse": {
    "Level": 4,
    "Description": "Draw connections among ideas",
  },
  "Evaluate": {
    "Level": 5,
    "Description": "Justify a stand or decision",
  },
  "Create": {
    "Level": 6,
    "Description": "Produce new or original work",
  },
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
        const response = await axios.get(`/api/student/1/`);
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
      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-slate-600 text-lg">Loading modules...</p>
        ) : error ? (
          <p className="text-red-600 text-lg">{error}</p>
        ) : studentModules.length === 0 ? (
          <p className="text-slate-600 text-lg">No modules found.</p>
        ) : (
          studentModules.map((module) => (
            <Link key={module.id} to={`./${module.id}`}>
              <div
              key={module.id}
              className="flex-row items-center gap-3 rounded-[8px] px-8 py-8 bg-[#cddcf7] w-[50%]"
              >
                <h2 className="font-['GlacialIndifference'] font-bold ">{module.index}</h2>
                <h1 className="font-['Fredoka'] font-bold text-4xl lg:text-5xl">{module.name}</h1>
                <div>
                  <h3>Knowledge Level:</h3>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Side Navigation Drawer */}
      <SideNav isOpen={isDrawerOpen} onClose={handleCloseDrawer} />
    </div>
  );
};

export default Modules;
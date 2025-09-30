import React, { useEffect, useState } from "react";
import axios from "axios";
import { IconButton } from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import SideNav from "../components/SideNav";
import { Link } from "react-router-dom";
import { calculateOverallBloomLevel } from "../utils/bloom";

interface Module {
  id: string;
  index: number;
  name: string;
}

interface BloomSummary {
  [topicId: string]: {
    Remember: number;
    Understand: number;
    Apply: number;
    Analyze: number;
    Evaluate: number;
    Create: number;
  };
}

const STUDENT_ID = "1";

export const Modules: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [studentModules, setStudentModules] = useState<Module[]>([]);
  const [bloomData, setBloomData] = useState<Record<string, BloomSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const handleCloseDrawer = () => setIsDrawerOpen(false);

  useEffect(() => {
    const fetchModulesAndBloom = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch student modules
        const studentResponse = await axios.get(`/api/student/${STUDENT_ID}/`);
        const modules = studentResponse.data.enrolled_modules_info || [];
        setStudentModules(modules);

        // Fetch bloom data for each module in parallel
        const bloomPromises = modules.map(async (module: Module) => {
          try {
            const response = await axios.get("/api/bloom-summary/", {
              params: {
                student_id: STUDENT_ID,
                module_id: module.id,
              },
            });
            return { moduleId: module.id, data: response.data.bloom_summary };
          } catch (error) {
            console.error(`Failed to fetch bloom data for module ${module.id}`, error);
            return { moduleId: module.id, data: {} };
          }
        });

        const bloomResults = await Promise.all(bloomPromises);
        const bloomMap = bloomResults.reduce((acc, { moduleId, data }) => {
          acc[moduleId] = data;
          return acc;
        }, {} as Record<string, BloomSummary>);

        setBloomData(bloomMap);
      } catch (error) {
        console.error("Failed to fetch modules", error);
        setError("Failed to load modules. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchModulesAndBloom();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 lg:p-8">
      <div className="bg-primary-dark rounded-xl shadow-lg mb-8 p-4 md:p-6">
        <div className="flex items-center gap-8">
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

      <div className="flex flex-col gap-3">
        {loading ? (
          <p className="text-slate-600 text-lg">Loading modules...</p>
        ) : error ? (
          <p className="text-red-600 text-lg">{error}</p>
        ) : studentModules.length === 0 ? (
          <p className="text-slate-600 text-lg">No modules found.</p>
        ) : (
          studentModules.map((module) => {
            const bloomSummary = bloomData[module.id] || {};
            const taxonomyInfo = calculateOverallBloomLevel(bloomSummary);

            return (
              <Link key={module.id} to={`./${module.id}`}>
                <div className="flex-row items-center gap-3 rounded-[8px] px-8 py-8 bg-[#cddcf7] w-[50%] hover:shadow-lg transition-shadow duration-200">
                  <h2 className="font-['GlacialIndifference'] font-bold">{module.index}</h2>
                  <h1 className="font-['Fredoka'] font-bold text-4xl lg:text-5xl">{module.name}</h1>

                  <div className="mt-4 p-4 bg-white/50 rounded-lg">
                    <h3 className="text-sm font-semibold text-slate-600 mb-1">
                      Knowledge Level:
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-blue-600">{taxonomyInfo.level}</span>
                      <div className="flex gap-1">
                        {taxonomyInfo.dots.map((filled, i) => (
                          <span
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              filled ? "bg-blue-600" : "bg-gray-300"
                            }`}
                          ></span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{taxonomyInfo.description}</p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <SideNav isOpen={isDrawerOpen} onClose={handleCloseDrawer} />
    </div>
  );
};

export default Modules;

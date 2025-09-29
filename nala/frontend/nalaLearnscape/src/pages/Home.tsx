import React, { useEffect, useState } from "react";
import { Fade, IconButton } from "@mui/material";
import { MenuRounded as MenuRoundedIcon } from "@mui/icons-material";
import Welcome from "../components/Welcome";
import ThreadMapSection, {
  type ThreadMapModule,
} from "../components/ThreadMapSection";
import SideNav from "../components/SideNav";
import LearningStyleOverview from "../components/LearningStyleOverview";
import TopicTaxonomyProgression from "../components/TopicTaxonomyProgression";

const Home: React.FC = () => {
  const DEMO_STUDENT_ID = "1"; // For demo purposes
  const [modules, setModules] = useState<ThreadMapModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>();
  const handleModuleSelect = (moduleId: string) => {
    setSelectedModuleId(moduleId);
  };

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch(`/api/student/${DEMO_STUDENT_ID}/`);
        if (!response.ok) {
          throw new Error("Failed to fetch student.");
        }

        const student = await response.json();
        const moduleList = Array.isArray(student?.enrolled_modules_info)
          ? student.enrolled_modules_info
          : [];

        const normalizedModules: ThreadMapModule[] = moduleList
          .map((module) => ({
            id: module?.id ? String(module.id) : "",
            code: module?.code ?? null,
            name: module?.name ?? null,
            description: module?.description ?? null,
          }))
          .filter((module) => module.id);

        setModules(normalizedModules);
      } catch (error) {
        console.error("Error fetching modules:", error);
        setModules([]);
      }
    };

    fetchModules();
  }, [DEMO_STUDENT_ID]);

  useEffect(() => {
    if (!selectedModuleId && modules.length > 0) {
      setSelectedModuleId(modules[0].id);
    }
  }, [modules, selectedModuleId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
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
            Home
          </h1>
        </div>
      </div>

      {/* Bento Grid Container */}
      <Fade in={true}>
        <div
          className="grid grid-cols-12 gap-4 md:gap-6 max-w-8xl mx-auto"
          style={{ gridTemplateRows: "auto auto" }}
        >
          {/* Welcome Component */}
          <div className="col-span-12 lg:col-span-7 lg:row-start-1">
            <Welcome />
          </div>

          {/* Right column container */}
          <div className="col-span-12 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:row-end-3 flex flex-col gap-4 md:gap-6">
            <LearningStyleOverview />
            <div className="flex-1 bg-gradient-to-br from-purple-100 to-blue-100 border border-purple-200/40 rounded-3xl p-6 flex items-center justify-center">
              <TopicTaxonomyProgression />
            </div>
          </div>

          {/* Thread Map Section */}
          <div className="col-span-12 lg:col-span-7 lg:col-start-1 lg:row-start-2">
            <ThreadMapSection
              modules={modules}
              selectedModuleId={selectedModuleId}
              onModuleSelect={handleModuleSelect}
            />
          </div>
        </div>
      </Fade>

      {/* Side Navigation */}
      <SideNav isOpen={isDrawerOpen} onClose={handleCloseDrawer} />
    </div>
  );
};

export default Home;

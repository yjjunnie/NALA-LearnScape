import React, { useState } from "react";
import {
  Box,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { MenuRounded as MenuRoundedIcon } from "@mui/icons-material";
import Welcome from "../components/Welcome";
import ThreadMapSection from "../components/ThreadMapSection";
import SideNav from "../components/SideNav";
import LearningStyleOverview from "../components/LearningStyleOverview";

const Home: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <div className="min-h-[100%] bg-[#fafbff] py-2 sm:py-3 md:py-4 flex-row">

      {/* Navigation */}
      <IconButton
        onClick={toggleDrawer}
        sx={{
          borderRadius: 3,
          border: "1px solid rgba(76, 115, 255, 0.15)",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          color: "#2447b5",
          p: { xs: 1, sm: 1.5 },
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "rgba(76, 115, 255, 0.05)",
            borderColor: "rgba(76, 115, 255, 0.25)",
            transform: "translateY(-1px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        }}
      >
        <MenuRoundedIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
      </IconButton>

      <div>
        
        <Welcome />
        <LearningStyleOverview/>
        <ThreadMapSection />
        
        {/* Insights Card Section */}
        <div className="w-full lg:w-1/3">
          <div className="flex flex-col space-y-2 sm:space-y-3">
            <div
              className="
                relative flex flex-col items-center justify-center
                min-h-[200px] sm:min-h-[250px] md:min-h-[300px]
                p-3 sm:p-4
                rounded-xl
                border border-[rgba(76,115,255,0.08)]
                bg-gradient-to-br from-[rgba(216,229,255,0.4)] to-[rgba(241,245,255,0.6)]
                overflow-hidden
                transition-all duration-300 ease-in-out
                hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(76,115,255,0.12)]
              "
            >
              {/* gradient line at top */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[rgba(76,115,255,0.3)] to-transparent"></div>

              {/* Title */}
              <h6 className="mb-2 font-semibold text-[#1a2c5e] text-center">
                Personal Dashboard
              </h6>

              {/* Body */}
              <p className="text-center leading-[1.6] max-w-[280px] text-gray-500">
                Track your learning progress, view achievements, and monitor daily streaks. Coming soon!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Side Navigation */}
      <SideNav isOpen={isDrawerOpen} onClose={handleCloseDrawer} />

    </div>
  );
};

export default Home;

import React, { useState } from "react";
import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material";
import Scheduler from "./Scheduler";

const Welcome: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const findOutWhyLink = (
    <button
      type="button"
      onClick={() => setIsModalOpen(true)}
      className="font-['Fredoka','GlacialIndifference',sans-serif] font-semibold text-[#FFE08C] text-[0.95rem] tracking-[0.3px] hover:text-white"
    >
      Find out why
    </button>
  );

  return (
    <>
      {/* Main Card */}
      <div className="relative flex min-h-[340px] flex-col gap-6 rounded-[20px] px-5 py-8 overflow-hidden bg-gradient-to-br from-[#466EFF]/[0.98] via-[#6095FF]/[0.95] to-[#8FBDFF]/[0.98] text-white">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row w-full justify-between items-start md:items-center gap-3 md:gap-4">
          <div className="flex flex-row items-center">
            <div className="flex-grow">
              <h3 className=" text-white text-5xl font-family-display font-bold">
                Welcome back, John!
              </h3>
              <p className="text-white/80 font-glacial tracking-[0.4px] mt-2">
                Your personalised schedule for the day is ready.
              </p>
            </div>
          </div>
        </div>
        <Scheduler />
      </div>

      {/* Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="font-fredoka font-semibold text-primary">
          Why this plan works
        </DialogTitle>
        <DialogContent className="min-h-[180px]">
          <p className="text-gray-600">
            Additional insights will appear here once the recommendation engine
            is connected.
          </p>
          <div className="mt-3">
            <Button variant="contained" onClick={() => setIsModalOpen(false)}>
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Welcome;

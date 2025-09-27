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
    <section className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] gap-3 items-stretch">
      {/* Main Card */}
      <div className="relative flex min-h-[340px] flex-col gap-6 rounded-[36px] px-5 py-4 overflow-hidden bg-gradient-to-br from-[#466EFF]/[0.98] via-[#6095FF]/[0.95] to-[#8FBDFF]/[0.98] text-white shadow-[0_28px_65px_rgba(34,72,168,0.32)]">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-6 rounded-[36px] border border-white/20"
        />

        {/* Header Row */}
        <div className="flex flex-col md:flex-row w-full justify-between items-start md:items-center gap-3 md:gap-4">
          <div className="flex flex-row items-center gap-2.5 w-full">
            <div className="flex-grow">
              <h3 className="mb-1 text-white text-[1.95rem] md:text-[2.4rem] leading-[1.05] tracking-[0.2px] font-bold">
                Welcome back,
                <span className="text-[#FFE08C]"> John!</span>
              </h3>
              <p className="text-white/80 font-['GlacialIndifference',sans-serif] tracking-[0.4px]">
                Your personalised schedule is ready. Drag the blocks to reshape
                your day.
              </p>
            </div>
          </div>
        </div> {/* <-- this was missing */}

        <Scheduler />
      </div>

      {/* Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="font-['Fredoka',sans-serif] font-semibold text-primary">
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
    </section>
  );
};

export default Welcome;

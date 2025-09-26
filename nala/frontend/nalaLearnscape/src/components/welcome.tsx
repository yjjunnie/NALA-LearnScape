import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Scheduler from "./Scheduler";
import LearningStyleOverview from "./LearningStyleOverview";

const Welcome: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const findOutWhyLink = (
    <Link
      component="button"
      type="button"
      onClick={() => setIsModalOpen(true)}
      underline="hover"
      className="font-['Fredoka','GlacialIndifference',sans-serif] font-semibold"
      sx={{
        color: "#FFE08C",
        fontWeight: 600,
        fontSize: "0.95rem",
        letterSpacing: 0.3,
        "&:hover": { color: "#FFFFFF" },
      }}
    >
      Find out why
    </Link>
  );

  const handleNavigate = (path: string): void => {
    navigate(path);
    setIsDrawerOpen(false);
  };

  return (
    <Box
      component="section"
      className="w-full"
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "minmax(0, 1.9fr) minmax(0, 1fr)",
        },
        gap: { xs: 3, lg: 3 },
        alignItems: "stretch",
      }}
    >
      <Paper
        elevation={0}
        className="relative flex min-h-[340px] flex-col gap-6 overflow-hidden rounded-[36px]"
        sx={{
          position: "relative",
          borderRadius: { xs: 5, md: 6 },
          px: { xs: 3, md: 5 },
          py: { xs: 3, md: 4 },
          background:
            "linear-gradient(135deg, rgba(70,110,255,0.98) 0%, rgba(96,149,255,0.95) 55%, rgba(143,189,255,0.98) 100%)",
          color: "#FFFFFF",
          boxShadow: "0 28px 65px rgba(34,72,168,0.32)",
          overflow: "hidden",
        }}
      >
        <Box
          component="span"
          aria-hidden
          className="pointer-events-none absolute inset-6 rounded-[36px] border border-white/20"
        />
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 3, md: 4 }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          className="w-full"
        >
          <Stack
            direction="row"
            spacing={2.5}
            alignItems="center"
            sx={{ width: "100%" }}
          >
            <IconButton
              onClick={() => setIsDrawerOpen(true)}
              sx={{
                borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.2)",
                color: "inherit",
                border: "1px solid rgba(255,255,255,0.38)",
                p: 1,
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.3)",
                },
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h3"
                sx={{
                  mb: 1,
                  color: "#FFFFFF",
                  fontSize: { xs: "1.95rem", md: "2.4rem" },
                  lineHeight: 1.05,
                  letterSpacing: 0.2,
                }}
              >
                Welcome back,
                <Box
                  component="span"
                  className="text-[#FFE08C]"
                  sx={{ color: "#FFE08C" }}
                >
                  {" "}
                  John!
                </Box>
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  color: "rgba(255,255,255,0.82)",
                  fontFamily: '"GlacialIndifference", sans-serif',
                  letterSpacing: 0.4,
                }}
              >
                Your personalised schedule is ready. Drag the blocks to reshape
                your day.
              </Typography>
            </Box>
          </Stack>
          <Stack
            direction="column"
            alignItems="center"
            spacing={1.2}
            sx={{
              backgroundColor: "rgba(255,255,255,0.22)",
              borderRadius: 5,
              px: 2.5,
              py: 2.5,
              border: "1px solid rgba(255,255,255,0.35)",
              minWidth: 96,
              boxShadow: "0 18px 36px rgba(16,46,120,0.2)",
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: 62,
                height: 62,
                borderRadius: "50%",
                background: "linear-gradient(180deg, #4C73FF 0%, #2848D1 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                boxShadow: "0 12px 24px rgba(28,62,158,0.35)",
              }}
            >
              <LocalFireDepartmentRoundedIcon sx={{ fontSize: 36 }} />
              <Typography
                variant="subtitle1"
                sx={{
                  position: "absolute",
                  bottom: 10,
                  fontFamily: '"Fredoka", sans-serif',
                  fontWeight: 700,
                  fontSize: "1.05rem",
                }}
              >
                25
              </Typography>
            </Box>
            <Typography
              variant="subtitle2"
              sx={{
                color: "#FFFFFF",
                fontWeight: 600,
                letterSpacing: 1,
                fontFamily: '"Fredoka", sans-serif',
              }}
            >
              Day Streak
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.8)",
                letterSpacing: 1,
                fontFamily: '"GlacialIndifference", sans-serif',
              }}
            >
              Keep it going!
            </Typography>
          </Stack>
        </Stack>

        <Scheduler headerAction={findOutWhyLink} />
      </Paper>

      <LearningStyleOverview />

      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontFamily: '"Fredoka", sans-serif',
            fontWeight: 600,
            color: "primary.main",
          }}
        >
          Why this plan works
        </DialogTitle>
        <DialogContent sx={{ minHeight: 180 }}>
          <Typography variant="body1" color="text.secondary">
            Additional insights will appear here once the recommendation engine
            is connected.
          </Typography>
          <Box mt={3}>
            <Button variant="contained" onClick={() => setIsModalOpen(false)}>
              Got it
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Welcome;

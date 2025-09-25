import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import { useLocation, useNavigate } from "react-router-dom";
import Scheduler from "./Scheduler";
import LearningStyleOverview from "./LearningStyleOverview";

const Welcome: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = useMemo(
    () => [
      { label: "Home", path: "/" },
      { label: "Course", path: "/threadmap" },
    ],
    []
  );

  const handleNavigate = (path: string): void => {
    navigate(path);
    setIsDrawerOpen(false);
  };

  return (
    <Box
      component="section"
      className="welcome"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.9fr) minmax(0, 1fr)" },
        gap: { xs: 3, lg: 3 },
        alignItems: "stretch",
      }}
    >
      <Paper
        elevation={0}
        className="welcome__card"
        sx={{
          position: "relative",
          borderRadius: { xs: 5, md: 6 },
          px: { xs: 3, md: 5 },
          py: { xs: 3, md: 4 },
          background:
            "linear-gradient(135deg, rgba(76,115,255,0.96) 0%, rgba(110,162,255,0.9) 60%, rgba(147,193,255,0.95) 100%)",
          color: "#FFFFFF",
          boxShadow: "0 24px 60px rgba(44,87,170,0.28)",
          overflow: "hidden",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="flex-start"
          justifyContent="space-between"
          className="welcome__header"
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <IconButton
              className="welcome__menu"
              onClick={() => setIsDrawerOpen(true)}
              sx={{
                borderRadius: 3,
                backgroundColor: "rgba(255,255,255,0.18)",
                color: "inherit",
                border: "1px solid rgba(255,255,255,0.36)",
                p: 1,
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.28)",
                },
              }}
              aria-label="Open navigation menu"
            >
              <MenuRoundedIcon />
            </IconButton>
            <Box className="welcome__title-group">
              <Typography
                variant="h3"
                sx={{
                  mb: 1,
                  color: "#FFFFFF",
                  fontSize: { xs: "1.9rem", md: "2.3rem" },
                  lineHeight: 1.05,
                }}
              >
                Welcome back,
                <Box component="span" className="welcome__highlight" sx={{ color: "#FFE08C" }}>
                  {" "}John!
                </Box>
              </Typography>
              <Link
                component="button"
                type="button"
                onClick={() => setIsModalOpen(true)}
                underline="hover"
                className="welcome__cta"
                sx={{
                  color: "#FFFFFF",
                  fontWeight: 600,
                  fontSize: "1rem",
                  letterSpacing: 0.3,
                  "&:hover": { color: "#FFE08C" },
                }}
              >
                Find out why
              </Link>
            </Box>
          </Stack>
          <Stack
            direction="column"
            alignItems="center"
            spacing={0.5}
            sx={{
              backgroundColor: "rgba(255,255,255,0.18)",
              borderRadius: 4,
              px: 2,
              py: 1.5,
              border: "1px solid rgba(255,255,255,0.35)",
              minWidth: 72,
            }}
          >
            <LocalFireDepartmentRoundedIcon fontSize="large" sx={{ color: "#FFE08C" }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              25 Days
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>
              Streak
            </Typography>
          </Stack>
        </Stack>

        <Divider
          sx={{
            my: { xs: 2.5, md: 3 },
            borderColor: "rgba(255,255,255,0.28)",
            borderBottomWidth: 1,
          }}
        />

        <Scheduler />
      </Paper>

      <LearningStyleOverview />

      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 260,
            backgroundColor: "#f4f7ff",
            paddingY: 3,
            borderTopRightRadius: 24,
            borderBottomRightRadius: 24,
          },
        }}
      >
        <Typography variant="h6" sx={{ px: 3, pb: 2, color: "#1A2C5E" }}>
          Quick Links
        </Typography>
        <List>
          {navigationItems.map((item) => (
            <ListItemButton
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                mx: 2,
                mb: 1,
                borderRadius: 3,
                boxShadow: location.pathname === item.path ? "0 8px 18px rgba(76,115,255,0.2)" : "none",
                backgroundColor:
                  location.pathname === item.path ? "rgba(76,115,255,0.12)" : "transparent",
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontFamily: '"Fredoka", sans-serif',
                  fontWeight: 600,
                  sx: {
                    color:
                      location.pathname === item.path
                        ? "primary.main"
                        : "text.primary",
                  },
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
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
            Additional insights will appear here once the recommendation engine is connected.
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

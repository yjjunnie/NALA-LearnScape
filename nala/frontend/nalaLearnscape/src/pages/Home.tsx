import React, { useMemo, useState } from "react";
import {
  Box,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import { useLocation, useNavigate } from "react-router-dom";
import Welcome from "../components/welcome";
import ThreadMapSection from "../components/ThreadMapSection";
const Home: React.FC = () => {
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
      component="main"
      sx={{ py: { xs: 4, md: 6 } }}
      className="bg-[#e8f1ff] font-['GlacialIndifference',sans-serif]"
    >
      <Container maxWidth="lg" disableGutters sx={{ px: { xs: 3, md: 5 } }}>
        <Stack spacing={{ xs: 4, md: 5 }}>
          <IconButton
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open navigation menu"
            sx={{
              alignSelf: "flex-start",
              borderRadius: 3,
              border: "1px solid rgba(36, 71, 181, 0.25)",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              color: "#1A2C5E",
              p: 1,
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.95)",
              },
            }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <Welcome />
          <Grid container spacing={3} className="w-full">
            <Grid item xs={12} md={8}>
              <ThreadMapSection />
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                className="rounded-[32px]"
                sx={{
                  minHeight: { xs: 200, md: 300 },
                  borderRadius: "32px",
                  px: { xs: 3, md: 4 },
                  py: { xs: 3, md: 4 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(180deg, rgba(216,229,255,0.85) 0%, rgba(241,245,255,0.9) 100%)",
                  boxShadow: "inset 0 0 0 1px rgba(76,115,255,0.1)",
                  border: "1px solid rgba(76,115,255,0.12)",
                }}
              >
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{
                    textAlign: "center",
                    fontFamily: '"GlacialIndifference", sans-serif',
                  }}
                >
                  Personal insights and streak milestones will appear here soon.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Container>
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
            boxShadow: "none",
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
                backgroundColor:
                  location.pathname === item.path
                    ? "rgba(76,115,255,0.15)"
                    : "transparent",
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
    </Box>
  );
};

export default Home;

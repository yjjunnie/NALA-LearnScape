import React from "react";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import Welcome from "../components/welcome";
import ThreadMapSection from "../components/ThreadMapSection";
import "./Home.css";

const Home: React.FC = () => {
  return (
    <Box component="main" sx={{ py: { xs: 4, md: 6 } }} className="home">
      <Container maxWidth="lg" disableGutters sx={{ px: { xs: 3, md: 5 } }}>
        <Stack spacing={{ xs: 4, md: 5 }}>
          <Welcome />
          <Grid container spacing={3} className="home__below">
            <Grid item xs={12} md={8}>
              <ThreadMapSection />
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                className="home__side-card"
                sx={{
                  minHeight: { xs: 200, md: 300 },
                  borderRadius: 5,
                  px: { xs: 3, md: 4 },
                  py: { xs: 3, md: 4 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(180deg, rgba(216,229,255,0.85) 0%, rgba(241,245,255,0.9) 100%)",
                  boxShadow: "inset 0 0 0 1px rgba(76,115,255,0.1)",
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
    </Box>
  );
};

export default Home;

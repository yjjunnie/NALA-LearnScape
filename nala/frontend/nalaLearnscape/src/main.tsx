import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline, GlobalStyles, ThemeProvider } from "@mui/material";
import "./index.css";
import "./fonts.css";
import App from "./App.tsx";
import { ReactFlowProvider } from "@xyflow/react";
import theme from "./theme";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            backgroundColor: theme.palette.background.default,
            fontFamily: theme.typography.fontFamily,
            color: theme.palette.text.primary,
          },
          h1: {
            fontFamily: theme.typography.h1.fontFamily,
          },
          h2: {
            fontFamily: theme.typography.h2.fontFamily,
          },
          h3: {
            fontFamily: theme.typography.h3.fontFamily,
          },
          a: {
            color: "inherit",
          },
        }}
      />
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>
    </ThemeProvider>
  </StrictMode>
);

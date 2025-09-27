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
            fontWeight: theme.typography.fontWeightRegular,
            color: theme.palette.text.primary,
          },
          h1: {
            fontFamily: theme.typography.h1.fontFamily,
            fontWeight: theme.typography.h1.fontWeight,
          },
          h2: {
            fontFamily: theme.typography.h2.fontFamily,
            fontWeight: theme.typography.h2.fontWeight,
          },
          h3: {
            fontFamily: theme.typography.h3.fontFamily,
            fontWeight: theme.typography.h3.fontWeight,
          },
          h4: {
            fontFamily: theme.typography.h4?.fontFamily,
            fontWeight: theme.typography.h4?.fontWeight,
          },
          h5: {
            fontFamily: theme.typography.h5?.fontFamily,
            fontWeight: theme.typography.h5?.fontWeight,
          },
          h6: {
            fontFamily: theme.typography.h6?.fontFamily,
            fontWeight: theme.typography.h6?.fontWeight,
          },
          p: {
            fontFamily: theme.typography.fontFamily,
            fontWeight: theme.typography.fontWeightRegular,
          },
          span: {
            fontFamily: theme.typography.fontFamily,
            fontWeight: theme.typography.fontWeightRegular,
          },
          button: {
            fontFamily: theme.typography.button?.fontFamily,
            fontWeight: theme.typography.button?.fontWeight,
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

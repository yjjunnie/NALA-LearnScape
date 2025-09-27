import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    background: {
      default: "#E8F1FF",
    },
    primary: {
      main: "#4C73FF",
      light: "#7EA8FF",
      dark: "#2B4BC7",
    },
    secondary: {
      main: "#FFB347",
    },
    text: {
      primary: "#1A2C5E",
      secondary: "#4C73FF",
    },
  },
  shape: {
    borderRadius: 24,
  },
  typography: {
    fontFamily: '"GlacialIndifference", ui-sans-serif, system-ui, sans-serif',
    h1: {
      fontFamily: '"Fredoka", ui-serif, serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Fredoka", ui-serif, serif',
      fontWeight: 600,
    },
    h3: {
      fontFamily: '"Fredoka", ui-serif, serif',
      fontWeight: 600,
    },
    h4: {
      fontFamily: '"Fredoka", ui-serif, serif',
      fontWeight: 500,
    },
    h5: {
      fontFamily: '"Fredoka", ui-serif, serif',
      fontWeight: 500,
    },
    h6: {
      fontFamily: '"Fredoka", ui-serif, serif',
      fontWeight: 500,
    },
    subtitle1: {
      fontFamily: '"GlacialIndifference", ui-sans-serif, system-ui, sans-serif',
      fontWeight: 600,
    },
    subtitle2: {
      fontFamily: '"GlacialIndifference", ui-sans-serif, system-ui, sans-serif',
      fontWeight: 500,
    },
    body1: {
      fontFamily: '"GlacialIndifference", ui-sans-serif, system-ui, sans-serif',
    },
    body2: {
      fontFamily: '"GlacialIndifference", ui-sans-serif, system-ui, sans-serif',
    },
    button: {
      textTransform: "none",
      fontFamily: '"GlacialIndifference", ui-sans-serif, system-ui, sans-serif',
      fontWeight: 600,
    },
    caption: {
      fontFamily: '"GlacialIndifference", ui-sans-serif, system-ui, sans-serif',
    },
  },
});

export default theme;
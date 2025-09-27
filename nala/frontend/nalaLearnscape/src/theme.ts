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
    fontFamily: '"GlacialIndifference", "Helvetica Neue", Arial, sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontFamily: '"Fredoka", "GlacialIndifference", sans-serif',
      fontWeight: 700,
    },
    h2: {
      fontFamily: '"Fredoka", "GlacialIndifference", sans-serif',
      fontWeight: 700,
    },
    h3: {
      fontFamily: '"Fredoka", "GlacialIndifference", sans-serif',
      fontWeight: 700,
    },
    h4: {
      fontFamily: '"Fredoka", "GlacialIndifference", sans-serif',
      fontWeight: 700,
    },
    h5: {
      fontFamily: '"Fredoka", "GlacialIndifference", sans-serif',
      fontWeight: 700,
    },
    h6: {
      fontFamily: '"Fredoka", "GlacialIndifference", sans-serif',
      fontWeight: 700,
    },
    subtitle1: {
      fontFamily: '"GlacialIndifference", "Helvetica Neue", Arial, sans-serif',
      fontWeight: 400,
    },
    subtitle2: {
      fontFamily: '"GlacialIndifference", "Helvetica Neue", Arial, sans-serif',
      fontWeight: 400,
    },
    body1: {
      fontFamily: '"GlacialIndifference", "Helvetica Neue", Arial, sans-serif',
      fontWeight: 400,
    },
    body2: {
      fontFamily: '"GlacialIndifference", "Helvetica Neue", Arial, sans-serif',
      fontWeight: 400,
    },
    button: {
      textTransform: "none",
      fontFamily: '"GlacialIndifference", "Helvetica Neue", Arial, sans-serif',
      fontWeight: 400,
    },
    caption: {
      fontFamily: '"GlacialIndifference", "Helvetica Neue", Arial, sans-serif',
      fontWeight: 400,
    },
  },
});

export default theme;

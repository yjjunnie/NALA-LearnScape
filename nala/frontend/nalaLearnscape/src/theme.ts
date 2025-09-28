import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4C73FF",
    },
    secondary: {
      main: "#FFB347",
    },
  },
  typography: {
    fontFamily: '"GlacialIndifference", ui-sans-serif, system-ui, sans-serif',
  },
});

export default theme;
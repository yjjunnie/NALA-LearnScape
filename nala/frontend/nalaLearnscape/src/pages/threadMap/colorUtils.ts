import { nodeModules } from "./mockData";

export const getColorForModule = (moduleId: string): string => {
  const module = nodeModules.find((m) => m.module_id === moduleId);
  if (module) return module.color;

  const colors = [
    "#00bcd4",
    "#5c9cfc",
    "#4a85f5",
    "#ff6b35",
    "#4caf50",
    "#9c27b0",
    "#ff9800",
    "#e91e63",
  ];
  const hash = moduleId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
};

export const getTopicColor = (moduleColor: string): string => {
  const hex = moduleColor.replace("#", "");
  const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 20);
  const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 20);
  const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 20);
  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

const hslToHex = (h: number, s: number, l: number): string => {
  const hue = h % 360;
  const saturation = Math.max(0, Math.min(1, s));
  const lightness = Math.max(0, Math.min(1, l));

  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hPrime = hue / 60;
  const x = chroma * (1 - Math.abs((hPrime % 2) - 1));

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (0 <= hPrime && hPrime <= 1) {
    r1 = chroma;
    g1 = x;
  } else if (1 < hPrime && hPrime <= 2) {
    r1 = x;
    g1 = chroma;
  } else if (2 < hPrime && hPrime <= 3) {
    g1 = chroma;
    b1 = x;
  } else if (3 < hPrime && hPrime <= 4) {
    g1 = x;
    b1 = chroma;
  } else if (4 < hPrime && hPrime <= 5) {
    r1 = x;
    b1 = chroma;
  } else if (5 < hPrime && hPrime <= 6) {
    r1 = chroma;
    b1 = x;
  }

  const m = lightness - chroma / 2;
  const r = Math.round((r1 + m) * 255)
    .toString(16)
    .padStart(2, "0");
  const g = Math.round((g1 + m) * 255)
    .toString(16)
    .padStart(2, "0");
  const b = Math.round((b1 + m) * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${r}${g}${b}`;
};

export const generateDistinctTopicColor = (
  usedColors: Set<string>
): string => {
  const basePalette = [
    "#00bcd4",
    "#5c9cfc",
    "#4a85f5",
    "#ff6b35",
    "#4caf50",
    "#9c27b0",
    "#ff9800",
    "#e91e63",
  ];

  for (const color of basePalette) {
    if (!usedColors.has(color)) {
      return color;
    }
  }

  const goldenRatio = 0.61803398875;
  let hue = Math.random() * 360;
  for (let i = 0; i < 24; i += 1) {
    hue = (hue + goldenRatio * 360) % 360;
    const candidate = hslToHex(hue, 0.6, 0.5);
    if (!usedColors.has(candidate)) {
      return candidate;
    }
  }

  return hslToHex(Math.random() * 360, 0.6, 0.5);
};

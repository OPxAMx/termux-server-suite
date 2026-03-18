export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    border: string;
    terminalCyan: string;
    terminalYellow: string;
    terminalRed: string;
  };
}

export const THEMES: ThemeConfig[] = [
  {
    id: "matrix",
    name: "Matrix",
    colors: {
      background: "220 20% 7%",
      foreground: "150 60% 75%",
      card: "220 18% 10%",
      primary: "150 80% 45%",
      primaryForeground: "220 20% 7%",
      secondary: "220 15% 15%",
      muted: "220 15% 13%",
      mutedForeground: "220 10% 50%",
      accent: "35 90% 55%",
      border: "150 30% 18%",
      terminalCyan: "180 70% 55%",
      terminalYellow: "45 95% 60%",
      terminalRed: "0 75% 55%",
    },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    colors: {
      background: "270 25% 6%",
      foreground: "300 60% 80%",
      card: "270 20% 10%",
      primary: "320 90% 55%",
      primaryForeground: "270 25% 6%",
      secondary: "270 15% 15%",
      muted: "270 15% 13%",
      mutedForeground: "270 10% 50%",
      accent: "55 95% 55%",
      border: "320 30% 20%",
      terminalCyan: "190 90% 55%",
      terminalYellow: "55 95% 60%",
      terminalRed: "350 80% 55%",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    colors: {
      background: "210 30% 7%",
      foreground: "200 50% 75%",
      card: "210 25% 10%",
      primary: "200 80% 50%",
      primaryForeground: "210 30% 7%",
      secondary: "210 20% 15%",
      muted: "210 20% 13%",
      mutedForeground: "210 10% 50%",
      accent: "170 70% 50%",
      border: "200 25% 18%",
      terminalCyan: "180 70% 55%",
      terminalYellow: "45 90% 60%",
      terminalRed: "0 70% 55%",
    },
  },
  {
    id: "amber",
    name: "Amber Retro",
    colors: {
      background: "30 15% 5%",
      foreground: "35 80% 65%",
      card: "30 12% 9%",
      primary: "35 95% 50%",
      primaryForeground: "30 15% 5%",
      secondary: "30 10% 14%",
      muted: "30 10% 12%",
      mutedForeground: "30 8% 45%",
      accent: "20 90% 55%",
      border: "35 25% 18%",
      terminalCyan: "45 80% 55%",
      terminalYellow: "40 95% 60%",
      terminalRed: "5 75% 50%",
    },
  },
  {
    id: "light",
    name: "Light",
    colors: {
      background: "0 0% 96%",
      foreground: "220 15% 25%",
      card: "0 0% 100%",
      primary: "220 75% 50%",
      primaryForeground: "0 0% 100%",
      secondary: "220 10% 90%",
      muted: "220 10% 92%",
      mutedForeground: "220 8% 55%",
      accent: "200 70% 50%",
      border: "220 10% 85%",
      terminalCyan: "200 60% 45%",
      terminalYellow: "40 80% 50%",
      terminalRed: "0 65% 50%",
    },
  },
];

const THEME_KEY = "termux-theme";
const BRIGHTNESS_KEY = "termux-brightness";

export function getStoredTheme(): string {
  return localStorage.getItem(THEME_KEY) || "matrix";
}

export function setStoredTheme(id: string) {
  localStorage.setItem(THEME_KEY, id);
}

export function getStoredBrightness(): number {
  const v = localStorage.getItem(BRIGHTNESS_KEY);
  return v ? parseFloat(v) : 1;
}

export function setStoredBrightness(v: number) {
  localStorage.setItem(BRIGHTNESS_KEY, String(v));
}

export function applyTheme(id: string, brightness: number = 1) {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0];
  const root = document.documentElement;
  const c = theme.colors;

  root.style.setProperty("--background", c.background);
  root.style.setProperty("--foreground", c.foreground);
  root.style.setProperty("--card", c.card);
  root.style.setProperty("--card-foreground", c.foreground);
  root.style.setProperty("--popover", c.card);
  root.style.setProperty("--popover-foreground", c.foreground);
  root.style.setProperty("--primary", c.primary);
  root.style.setProperty("--primary-foreground", c.primaryForeground);
  root.style.setProperty("--secondary", c.secondary);
  root.style.setProperty("--secondary-foreground", c.foreground);
  root.style.setProperty("--muted", c.muted);
  root.style.setProperty("--muted-foreground", c.mutedForeground);
  root.style.setProperty("--accent", c.accent);
  root.style.setProperty("--accent-foreground", c.primaryForeground);
  root.style.setProperty("--border", c.border);
  root.style.setProperty("--input", c.secondary);
  root.style.setProperty("--ring", c.primary);
  root.style.setProperty("--terminal-cyan", c.terminalCyan);
  root.style.setProperty("--terminal-yellow", c.terminalYellow);
  root.style.setProperty("--terminal-red", c.terminalRed);

  root.style.filter = `brightness(${brightness})`;
  setStoredTheme(id);
  setStoredBrightness(brightness);
}

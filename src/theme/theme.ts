export type ThemeId = "midnight" | "forest" | "sunrise";

export type AppTheme = {
  id: ThemeId;
  name: string;
  description: string;
  statusBarStyle: "light" | "dark";
  colors: {
    background: string;
    header: string;
    surface: string;
    surfaceMuted: string;
    input: string;
    border: string;
    borderStrong: string;
    text: string;
    textInverse: string;
    mutedText: string;
    subtleText: string;
    primary: string;
    primaryAccent: string;
    primaryPressed: string;
    primaryText: string;
    primarySoft: string;
    primarySoftText: string;
    successSurface: string;
    successBorder: string;
    successText: string;
    warningSurface: string;
    warningBorder: string;
    warningText: string;
    danger: string;
    dangerSurface: string;
    dangerBorder: string;
    dangerText: string;
    dangerButtonText: string;
    overlay: string;
  };
};

export const DEFAULT_THEME_ID: ThemeId = "midnight";

export const themes: Record<ThemeId, AppTheme> = {
  midnight: {
    id: "midnight",
    name: "Neon Night",
    description: "Colorful dark mode with violet, cyan, and pink accents.",
    statusBarStyle: "light",
    colors: {
      background: "#0f1028",
      header: "#171833",
      surface: "#1d1b3d",
      surfaceMuted: "#2a2554",
      input: "#12142f",
      border: "#453a7a",
      borderStrong: "#6750a4",
      text: "#fff7ff",
      textInverse: "#0f1028",
      mutedText: "#c9c1f5",
      subtleText: "#9d8fd8",
      primary: "#22d3ee",
      primaryAccent: "#f472b6",
      primaryPressed: "#0e7490",
      primaryText: "#08111f",
      primarySoft: "#2d1b4e",
      primarySoftText: "#f0abfc",
      successSurface: "#123b3f",
      successBorder: "#0e7490",
      successText: "#67e8f9",
      warningSurface: "#3f2f09",
      warningBorder: "#ca8a04",
      warningText: "#fde68a",
      danger: "#fb7185",
      dangerSurface: "#3b1122",
      dangerBorder: "#be123c",
      dangerText: "#fecdd3",
      dangerButtonText: "#250614",
      overlay: "rgba(7, 8, 26, 0.78)",
    },
  },
  forest: {
    id: "forest",
    name: "Forest",
    description: "Deep green tones for a calmer grocery run.",
    statusBarStyle: "light",
    colors: {
      background: "#07130f",
      header: "#102018",
      surface: "#12251b",
      surfaceMuted: "#1c3326",
      input: "#07130f",
      border: "#2d4a3a",
      borderStrong: "#3f6f55",
      text: "#f3fbf6",
      textInverse: "#10200a",
      mutedText: "#a9c3b4",
      subtleText: "#789383",
      primary: "#84cc16",
      primaryAccent: "#bef264",
      primaryPressed: "#365314",
      primaryText: "#10200a",
      primarySoft: "#1f3d17",
      primarySoftText: "#d9f99d",
      successSurface: "#16351f",
      successBorder: "#2f6b3d",
      successText: "#bbf7d0",
      warningSurface: "#442b08",
      warningBorder: "#a16207",
      warningText: "#fde68a",
      danger: "#f87171",
      dangerSurface: "#311313",
      dangerBorder: "#7f1d1d",
      dangerText: "#fecaca",
      dangerButtonText: "#10200a",
      overlay: "rgba(2, 12, 8, 0.76)",
    },
  },
  sunrise: {
    id: "sunrise",
    name: "Sunrise",
    description: "Warm and bright when you want the app to feel lighter.",
    statusBarStyle: "dark",
    colors: {
      background: "#fff7ed",
      header: "#ffffff",
      surface: "#ffffff",
      surfaceMuted: "#ffedd5",
      input: "#fffaf5",
      border: "#fed7aa",
      borderStrong: "#fdba74",
      text: "#1c1917",
      textInverse: "#ffffff",
      mutedText: "#57534e",
      subtleText: "#78716c",
      primary: "#ea580c",
      primaryAccent: "#f97316",
      primaryPressed: "#9a3412",
      primaryText: "#ffffff",
      primarySoft: "#ffedd5",
      primarySoftText: "#9a3412",
      successSurface: "#dcfce7",
      successBorder: "#86efac",
      successText: "#166534",
      warningSurface: "#fef3c7",
      warningBorder: "#f59e0b",
      warningText: "#78350f",
      danger: "#dc2626",
      dangerSurface: "#fee2e2",
      dangerBorder: "#fecaca",
      dangerText: "#991b1b",
      dangerButtonText: "#ffffff",
      overlay: "rgba(28, 25, 23, 0.42)",
    },
  },
};

export const themeOptions = Object.values(themes);

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(themes, value)
  );
}

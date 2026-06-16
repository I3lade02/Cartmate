import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  DEFAULT_THEME_ID,
  isThemeId,
  themes,
  type AppTheme,
  type ThemeId,
} from "../theme/theme";

const THEME_STORAGE_KEY = "cartmate-theme";

type ThemeState = {
  themeId: ThemeId;
  theme: AppTheme;
  hasHydrated: boolean;
  loadThemePreference: () => Promise<void>;
  setThemeId: (themeId: ThemeId) => Promise<void>;
};

export const useThemeStore = create<ThemeState>((set) => ({
  themeId: DEFAULT_THEME_ID,
  theme: themes[DEFAULT_THEME_ID],
  hasHydrated: false,
  loadThemePreference: async () => {
    let themeId = DEFAULT_THEME_ID;

    try {
      const storedThemeId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      themeId = isThemeId(storedThemeId) ? storedThemeId : DEFAULT_THEME_ID;
    } catch (error) {
      console.log(error);
    }

    set({
      themeId,
      theme: themes[themeId],
      hasHydrated: true,
    });
  },
  setThemeId: async (themeId) => {
    set({
      themeId,
      theme: themes[themeId],
    });

    await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
  },
}));

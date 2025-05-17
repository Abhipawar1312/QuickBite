import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light";

type ThemeStore = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            theme: "light", // Default theme on first visit

            setTheme: (theme: Theme) => {
                // Update the <html> class
                document.documentElement.classList.remove("light", "dark");
                document.documentElement.classList.add(theme);
                // Persist state
                set({ theme });
            },
        }),
        {
            name: "theme-store",
            onRehydrateStorage: () => (state) => {
                const stored = state?.theme || "light";
                document.documentElement.classList.remove("light", "dark");
                document.documentElement.classList.add(stored);
            },
        }
    )
);
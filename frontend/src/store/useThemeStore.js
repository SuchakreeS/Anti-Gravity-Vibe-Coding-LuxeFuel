import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'midnight_jdm',
      toggleTheme: () => {
        const nextTheme = get().theme === 'midnight_jdm' ? 'light_jdm' : 'midnight_jdm';
        set({ theme: nextTheme });
        document.documentElement.setAttribute('data-theme', nextTheme);
      },
      initTheme: () => {
        const currentTheme = get().theme;
        document.documentElement.setAttribute('data-theme', currentTheme);
      }
    }),
    {
      name: 'luxefuel-theme',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

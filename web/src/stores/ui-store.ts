import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

type UiState = {
  readonly sidebarOpen: boolean;
  readonly locale: string;
  readonly theme: Theme;
};

type UiActions = {
  readonly toggleSidebar: () => void;
  readonly setLocale: (locale: string) => void;
  readonly setTheme: (theme: Theme) => void;
};

export const useUiStore = create<UiState & UiActions>()((set) => ({
  sidebarOpen: false,
  locale: 'fr',
  theme: 'system',

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setLocale: (locale) => set({ locale }),

  setTheme: (theme) => set({ theme }),
}));

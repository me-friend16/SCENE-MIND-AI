import { create } from 'zustand';

interface AppState {
  theme: 'dark' | 'cinematic';
  activeProjectId?: string;
  setTheme: (theme: 'dark' | 'cinematic') => void;
  setActiveProjectId: (projectId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  activeProjectId: undefined,
  setTheme: (theme) => set({ theme }),
  setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
}));

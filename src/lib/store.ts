import { create } from 'zustand';
import type { Seller, Goals, Mission, CycleSnapshot, Admin } from './types';

interface AppState {
  sellers: Seller[];
  goals: Goals | null;
  missions: Mission[];
  cycleHistory: CycleSnapshot[];
  admin: Admin | null;
  setSellers: (updater: (prev: Seller[]) => Seller[]) => void;
  setGoals: (updater: (prev: Goals | null) => Goals | null) => void;
  setMissions: (updater: (prev: Mission[]) => Mission[]) => void;
  setCycleHistory: (updater: (prev: CycleSnapshot[]) => CycleSnapshot[]) => void;
  setAdmin: (updater: (prev: Admin | null) => Admin | null) => void;
}

export const useStore = create<AppState>((set) => ({
  sellers: [],
  goals: null,
  missions: [],
  cycleHistory: [],
  admin: null,
  setSellers: (updater) => set((state) => ({ sellers: updater(state.sellers) })),
  setGoals: (updater) => set((state) => ({ goals: updater(state.goals) })),
  setMissions: (updater) => set((state) => ({ missions: updater(state.missions) })),
  setCycleHistory: (updater) => set((state) => ({ cycleHistory: updater(state.cycleHistory) })),
  setAdmin: (updater) => set((state) => ({ admin: updater(state.admin) })),
}));

// Exportar o store diretamente para uso fora de componentes React, se necessário
export const store = useStore;
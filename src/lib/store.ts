'use client';

import { useSyncExternalStore } from 'react';
import { createStore } from 'zustand/vanilla';
import type { Seller, Goals, Mission, Admin, CycleSnapshot, DailySprint } from './types';
import { initialSellers, initialGoals, initialMissions } from './data';

type AppState = {
  sellers: Seller[];
  goals: Goals | null;
  missions: Mission[];
  sprints: DailySprint[];
  admin: Admin | null;
  cycleHistory: CycleSnapshot[];
};

type AppStore = AppState & {
  setSellers: (updater: (prev: Seller[]) => Seller[]) => void;
  setGoals: (updater: (prev: Goals | null) => Goals | null) => void;
  setMissions: (updater: (prev: Mission[]) => Mission[]) => void;
  setSprints: (updater: (prev: DailySprint[]) => DailySprint[]) => void;
  setAdmin: (updater: (prev: Admin | null) => Admin | null) => void;
  setCycleHistory: (updater: (prev: CycleSnapshot[]) => CycleSnapshot[]) => void;
};

const initialState: AppState = {
  sellers: initialSellers,
  goals: initialGoals,
  missions: initialMissions,
  sprints: [],
  admin: null,
  cycleHistory: [],
};

export const store = createStore<AppStore>((set) => ({
  ...initialState,
  setSellers: (updater) => set((state) => ({ sellers: updater(state.sellers) })),
  setGoals: (updater) => set((state) => ({ goals: updater(state.goals) })),
  setMissions: (updater) => set((state) => ({ missions: updater(state.missions) })),
  setSprints: (updater) => set((state) => ({ sprints: updater(state.sprints) })),
  setAdmin: (updater) => set((state) => ({ admin: updater(state.admin) })),
  setCycleHistory: (updater) => set((state) => ({ cycleHistory: updater(state.cycleHistory) })),
}));

// Expondo as ações para uso fora dos componentes React
export const dataStore = {
  setSellers: store.getState().setSellers,
  setGoals: store.getState().setGoals,
  setMissions: store.getState().setMissions,
  setSprints: store.getState().setSprints,
  setAdmin: store.getState().setAdmin,
  setCycleHistory: store.getState().setCycleHistory,
};

// Hook para consumir a store nos componentes
export const useStore = <T>(selector: (state: AppStore) => T): T => {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()), () => selector(initialState as AppStore));
};

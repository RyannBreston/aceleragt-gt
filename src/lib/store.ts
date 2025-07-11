'use client';

import { useSyncExternalStore } from 'react';
import type {Seller, Goals, Mission, Admin, CycleSnapshot} from './types';
import {
  sellersData as initialSellers,
  goalsData as initialGoals,
  missionsData as initialMissions,
} from './data';

type AppState = {
  sellers: Seller[];
  goals: Goals;
  missions: Mission[];
  adminUser: Admin;
  cycleHistory: CycleSnapshot[];
};

let state: AppState = {
  sellers: initialSellers,
  goals: initialGoals,
  missions: initialMissions,
  adminUser: {
    nickname: 'admin',
    email: 'admin@aceleragtsupermoda.com',
    password: 'admin',
  },
  cycleHistory: [],
};

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const dataStore = {
  getState: () => state,

  setSellers: (updater: (prev: Seller[]) => Seller[]) => {
    state = {...state, sellers: updater(state.sellers)};
    notifyListeners();
  },

  setGoals: (updater: (prev: Goals) => Goals) => {
    state = {...state, goals: updater(state.goals)};
    notifyListeners();
  },

  setMissions: (updater: (prev: Mission[]) => Mission[]) => {
    state = {...state, missions: updater(state.missions)};
    notifyListeners();
  },

  setAdminUser: (updater: (prev: Admin) => Admin) => {
    state = {...state, adminUser: updater(state.adminUser)};
    notifyListeners();
  },

  setCycleHistory: (updater: (prev: CycleSnapshot[]) => CycleSnapshot[]) => {
    state = {...state, cycleHistory: updater(state.cycleHistory)};
    notifyListeners();
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useStore<T>(selector: (state: AppState) => T): T {
  return useSyncExternalStore(
    dataStore.subscribe,
    () => selector(dataStore.getState()),
    () => selector(dataStore.getState())
  );
}

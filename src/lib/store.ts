'use client';

import { useSyncExternalStore } from 'react';
import type {Seller, Goals, Mission, Admin, CycleSnapshot} from './types';
import {
  initialSellers,
  initialGoals,
  initialMissions,
} from './data';

type AppState = {
  sellers: Seller[];
  goals: Goals | null;
  missions: Mission[];
  admin: Admin | null;
  cycleHistory: CycleSnapshot[];
};

const initialState: AppState = {
  sellers: initialSellers,
  goals: initialGoals,
  missions: initialMissions,
  admin: null,
  cycleHistory: [],
};

let state: AppState = { ...initialState };

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;

const getServerSnapshot = () => initialState;

const emitChange = () => {
  for (const listener of listeners) {
    listener();
  }
};

export const dataStore = {
  setSellers: (updater: (prev: Seller[]) => Seller[]) => {
    state = { ...state, sellers: updater(state.sellers) };
    emitChange();
  },
  setGoals: (updater: (prev: Goals | null) => Goals | null) => {
    state = { ...state, goals: updater(state.goals) };
    emitChange();
  },
  setMissions: (updater: (prev: Mission[]) => Mission[]) => {
    state = { ...state, missions: updater(state.missions) };
    emitChange();
  },
  setAdmin: (updater: (prev: Admin | null) => Admin | null) => {
    state = { ...state, admin: updater(state.admin) };
    emitChange();
  },
  setCycleHistory: (updater: (prev: CycleSnapshot[]) => CycleSnapshot[]) => {
    state = { ...state, cycleHistory: updater(state.cycleHistory) };
    emitChange();
  },
};

export const useStore = <T>(selector: (state: AppState) => T): T => {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()), () => selector(getServerSnapshot()));
};
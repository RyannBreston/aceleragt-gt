'use client';

import { useSyncExternalStore } from 'react';
import type {Seller, Goals, Mission, Admin, CycleSnapshot} from './types';
// Correção: Importar os nomes corretos diretamente do ficheiro de dados.
import {
  initialSellers,
  initialGoals,
  initialMissions,
} from './data';

type AppState = {
  sellers: Seller[];
  goals: Goals;
  missions: Mission[];
  adminUser: Admin | null; // O admin pode ser nulo antes do login
  cycleHistory: CycleSnapshot[];
};

// Estado inicial para o servidor e o primeiro render no cliente
const initialState: AppState = {
  sellers: initialSellers,
  goals: initialGoals,
  missions: initialMissions,
  adminUser: null,
  cycleHistory: [],
};

// O estado que será modificado no cliente
let state: AppState = { ...initialState };

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => state;

// Função para o Server-Side Rendering (SSR)
// Retorna o estado inicial e imutável no servidor.
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
  setGoals: (updater: (prev: Goals) => Goals) => {
    state = { ...state, goals: updater(state.goals) };
    emitChange();
  },
  setMissions: (updater: (prev: Mission[]) => Mission[]) => {
    state = { ...state, missions: updater(state.missions) };
    emitChange();
  },
  setAdminUser: (updater: (prev: Admin | null) => Admin | null) => {
    state = { ...state, adminUser: updater(state.adminUser) };
    emitChange();
  },
  setCycleHistory: (updater: (prev: CycleSnapshot[]) => CycleSnapshot[]) => {
    state = { ...state, cycleHistory: updater(state.cycleHistory) };
    emitChange();
  },
};

export const useStore = <T>(selector: (state: AppState) => T): T => {
  // Adiciona getServerSnapshot como terceiro argumento para compatibilidade com SSR
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()), () => selector(getServerSnapshot()));
};

// src/lib/store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

// Definição do tipo para o estado e ações
type AdminStore = {
  // Estado
  isAdmin: boolean;
  isLoading: boolean;
  lastLoginTime: number | null;
  
  // Ações
  setIsAdmin: (isAdmin: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  updateLastLogin: () => void;
  reset: () => void;
  
  // Computed values
  isSessionValid: () => boolean;
};

// Estado inicial
const initialState = {
  isAdmin: false,
  isLoading: false,
  lastLoginTime: null,
};

// Store principal com middleware de persistência e devtools
export const useAdminStore = create<AdminStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Ações
        setIsAdmin: (isAdmin: boolean) => {
          set(
            { 
              isAdmin,
              lastLoginTime: isAdmin ? Date.now() : null 
            },
            false,
            'setIsAdmin'
          );
        },
        
        setLoading: (isLoading: boolean) => {
          set({ isLoading }, false, 'setLoading');
        },
        
        updateLastLogin: () => {
          set({ lastLoginTime: Date.now() }, false, 'updateLastLogin');
        },
        
        reset: () => {
          set(initialState, false, 'reset');
        },
        
        // Computed values
        isSessionValid: () => {
          const { isAdmin, lastLoginTime } = get();
          if (!isAdmin || !lastLoginTime) return false;
          
          // Sessão válida por 24 horas (86400000 ms)
          const sessionDuration = 24 * 60 * 60 * 1000;
          return Date.now() - lastLoginTime < sessionDuration;
        },
      }),
      {
        name: 'admin-store', // nome único para localStorage
        storage: createJSONStorage(() => {
          // Usar sessionStorage ao invés de localStorage para maior segurança
          if (typeof window !== 'undefined') {
            return sessionStorage;
          }
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }),
        partialize: (state) => ({
          // Apenas persistir campos específicos (não isLoading)
          isAdmin: state.isAdmin,
          lastLoginTime: state.lastLoginTime,
        }),
      }
    ),
    {
      name: 'admin-store', // nome para Redux DevTools
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Hook personalizado com funcionalidades extras
export const useAdminAuth = () => {
  const store = useAdminStore();
  
  return {
    ...store,
    
    // Método para login seguro
    login: () => {
      store.setIsAdmin(true);
      store.updateLastLogin();
    },
    
    // Método para logout
    logout: () => {
      store.reset();
    },
    
    // Verificar se está autenticado e sessão é válida
    isAuthenticated: () => {
      return store.isAdmin && store.isSessionValid();
    },
  };
};

// Selector hooks para performance otimizada
export const useIsAdmin = () => useAdminStore((state) => state.isAdmin);
export const useIsLoading = () => useAdminStore((state) => state.isLoading);
export const useAdminActions = () => useAdminStore((state) => ({
  setIsAdmin: state.setIsAdmin,
  setLoading: state.setLoading,
  reset: state.reset,
}));

// Tipo para export (útil para outros arquivos)
export type { AdminStore };
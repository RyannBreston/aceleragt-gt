'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '@/lib/firebase';
import type { Admin, Goals as GoalsType, Mission, Seller, CycleSnapshot, DailySprint } from '@/lib/types';

// 1. Definição da Interface
interface AdminContextType {
  sellers: Seller[];
  goals: GoalsType | null;
  missions: Mission[];
  sprints: DailySprint[];
  admin: Admin | null;
  cycleHistory: CycleSnapshot[];
  isLoading: boolean;
  isAdmin: boolean;
  isDirty: boolean;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  saveSprint: (data: Omit<DailySprint, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  toggleSprint: (id: string, isActive: boolean) => Promise<void>;
}

// 2. Criação do Contexto
const AdminContext = createContext<AdminContextType | undefined>(undefined);

// 3. Provider Refatorado
export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [goals, setGoals] = useState<GoalsType | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [sprints, setSprints] = useState<DailySprint[]>([]);
  const [cycleHistory, setCycleHistory] = useState<CycleSnapshot[]>([]);
  // Garantir que o estado de loading comece como true por padrão
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Centraliza a lógica de autenticação e verificação de perfil
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          // Força a atualização do token para garantir que as claims personalizadas estejam presentes
          const idTokenResult = await user.getIdTokenResult(true);

          // Verifica se o usuário tem a claim 'admin'
          if (idTokenResult.claims.role === 'admin') {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              // Usuário é admin e seu documento existe
              setAdmin({ id: user.uid, ...userDoc.data() } as Admin);
              // Não definimos isLoading aqui, deixamos o listener de dados fazer isso
            } else {
              // Usuário autenticado como admin, mas sem perfil no Firestore
              console.error("Admin user document not found in Firestore.");
              setAdmin(null);
              setIsLoading(false); // Fim do carregamento, usuário não autorizado
            }
          } else {
            // Usuário autenticado, mas não é admin
            setAdmin(null);
            setIsLoading(false); // Fim do carregamento, usuário não autorizado
          }
        } catch (error) {
          console.error("Error verifying admin role:", error);
          setAdmin(null);
          setIsLoading(false); // Fim do carregamento devido a erro
        }
      } else {
        // Nenhum usuário logado
        setAdmin(null);
        setSellers([]);
        setGoals(null);
        setMissions([]);
        setSprints([]);
        setCycleHistory([]);
        setIsLoading(false); // Fim do carregamento, nenhum usuário
      }
    });

    return () => unsubscribe();
  }, []);

  // Gerencia o carregamento dos dados APENAS se o usuário for um admin válido
  useEffect(() => {
    if (!admin) {
        // Se não houver admin, garante que o estado de loading já esteja como false
        // A lógica no useEffect de autenticação já deve ter tratado isso
        return;
    }

    // Quando o admin é definido, começamos o processo de carregar os dados
    const dataPaths = ['sellers', 'dailySprints', 'missions', 'cycle_history'];
    const setters = [setSellers, setSprints, setMissions, setCycleHistory];
    let loadedCount = 0;

    const onDataLoaded = () => {
        loadedCount++;
        if (loadedCount === dataPaths.length + 1) { // +1 para o listener de 'goals'
            setIsLoading(false);
        }
    };

    const unsubscribers = dataPaths.map((path, index) => {
        const q = query(collection(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/${path}`));
        return onSnapshot(q, (snapshot) => {
            setters[index](snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as never);
            onDataLoaded();
        }, (error) => {
            console.error(`Error loading ${path}:`, error);
            onDataLoaded(); // Continua mesmo em caso de erro para não bloquear o app
        });
    });

    const goalsRef = doc(db, `artifacts/${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}/public/data/goals`, 'main');
    const unsubGoals = onSnapshot(goalsRef, (doc) => {
        setGoals(doc.exists() ? doc.data() as GoalsType : null);
        onDataLoaded();
    }, (error) => {
        console.error("Error loading goals:", error);
        onDataLoaded();
    });
    unsubscribers.push(unsubGoals);


    return () => { unsubscribers.forEach(unsub => unsub()); };
  }, [admin]); // Este useEffect depende apenas do 'admin'

  const callApi = useCallback(async (action: string, data: object) => {
    const callable = httpsCallable(functions, 'api');
    await callable({ action, ...data });
  }, []);

  const saveSprint = useCallback(
    (data: Omit<DailySprint, 'id' | 'createdAt'>, id?: string) => callApi(id ? 'updateDailySprint' : 'createDailySprint', { ...data, id }),
    [callApi]
  );
  const deleteSprint = useCallback((id: string) => callApi('deleteDailySprint', { id }), [callApi]);
  const toggleSprint = useCallback((id: string, isActive: boolean) => callApi('toggleDailySprint', { id, isActive }), [callApi]);

  const contextValue: AdminContextType = {
    sellers,
    goals,
    missions,
    sprints,
    admin,
    cycleHistory,
    isLoading,
    isAdmin: !!admin,
    isDirty,
    setIsDirty,
    saveSprint,
    deleteSprint,
    toggleSprint,
  };

  return <AdminContext.Provider value={contextValue}>{children}</AdminContext.Provider>;
};

// Hook para usar o contexto
export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminContext deve ser usado dentro de um AdminProvider');
  }
  return context;
};

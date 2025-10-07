'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc, setDoc, arrayUnion, collection, Timestamp } from 'firebase/firestore';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { Task, Session, SortMode, Effort } from '@/lib/types';
import { getToday } from '@/lib/utils';
import { getAiTaskEnhancements } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { subDays, differenceInDays } from 'date-fns';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';


type AiData = {
  effortSuggestions: { id: string; effort: Effort }[];
  topReasons: string[];
};

export function useTaskManager() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [carryoverTasks, setCarryoverTasks] = useState<Task[]>([]);
  const [session, setSession] = useState<Session>({ energy: 'med', sessionQuickWinsCompleted: 0 });
  const [sortMode, setSortMode] = useState<SortMode>('ai');
  const [loading, setLoading] = useState(true);
  const [aiData, setAiData] = useState<AiData>({ effortSuggestions: [], topReasons: [] });

  const today = getToday();
  const yesterday = getToday(subDays(new Date(), 1));

  const userListsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'lists');
  }, [firestore, user]);


  useEffect(() => {
    if (isUserLoading || !user || !firestore || !userListsCollection) {
      setLoading(true);
      return;
    };
    
    const loadData = async () => {
      setLoading(true);
      try {
        const todayRef = doc(userListsCollection, today);
        const yesterdayRef = doc(userListsCollection, yesterday);

        const [todaySnap, yesterdaySnap] = await Promise.all([getDoc(todayRef), getDoc(yesterdayRef)]);
        
        let todaysTasks: Task[] = [];
        if (todaySnap.exists()) {
          const todayData = todaySnap.data();
          todaysTasks = (todayData.tasks || []).map((t: any) => ({
            ...t,
            createdAt: t.createdAt instanceof Timestamp ? t.createdAt.toMillis() : t.createdAt,
            completedAt: t.completedAt instanceof Timestamp ? t.completedAt.toMillis() : t.completedAt,
          }));
        } else {
          // Create today's list if it doesn't exist
          setDocumentNonBlocking(todayRef, { date: today, tasks: [] }, { merge: false });
        }
        
        if (yesterdaySnap.exists()) {
          const yesterdayData = yesterdaySnap.data();
          const carryovers = (yesterdayData.tasks || [])
            .filter((task: Task) => task.status === 'todo')
            .map((task: any) => ({ 
              ...task, 
              isCarryover: true,
              createdAt: task.createdAt instanceof Timestamp ? task.createdAt.toMillis() : task.createdAt,
              completedAt: task.completedAt instanceof Timestamp ? task.completedAt.toMillis() : task.completedAt,
            }))
            // Filter out tasks already carried over to today
            .filter((ct: Task) => !todaysTasks.some(tt => tt.id === ct.id && tt.listDate === today));
            
          setCarryoverTasks(carryovers);
        }

        setTasks(todaysTasks);

      } catch (error: any) {
        console.error("Error loading data:", error);
        if (error.name === 'FirebaseError' && error.code === 'permission-denied') {
          toast({ title: "Connecting...", description: "We’re still connecting—please try again in a moment.", variant: "destructive" });
        } else {
          toast({ title: "Error", description: "Could not load tasks. Please try again later.", variant: "destructive" });
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isUserLoading, firestore, user, userListsCollection, today, yesterday, toast]);
  
  const addTask = useCallback(async (newTask: Omit<Task, 'id' | 'listDate' | 'isCarryover' | 'createdAt' | 'status' | 'originDate'>) => {
    if (!userListsCollection) return;

    const now = Date.now();
    const taskToAdd: Task = {
      ...newTask,
      id: crypto.randomUUID(),
      listDate: today,
      isCarryover: false,
      status: 'todo' as const,
      createdAt: now,
      originDate: today
    };

    setTasks(prev => [...prev, taskToAdd]);
    
    const todayRef = doc(userListsCollection, today);
    updateDocumentNonBlocking(todayRef, { tasks: arrayUnion(taskToAdd) });
  }, [userListsCollection, today]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!userListsCollection) return;

    const newTasks = tasks.map(t => t.id === id ? { ...t, ...updates, ...(updates.status === 'done' && !t.completedAt && { completedAt: Date.now() }) } : t);
    setTasks(newTasks);

    const todayRef = doc(userListsCollection, today);
    setDocumentNonBlocking(todayRef, { tasks: newTasks, date: today }, { merge: true });
  }, [userListsCollection, tasks, today]);

  const deleteTask = useCallback(async (id: string) => {
    if (!userListsCollection) return;

    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    
    const todayRef = doc(userListsCollection, today);
    setDocumentNonBlocking(todayRef, { tasks: updatedTasks }, { merge: true });
  }, [userListsCollection, tasks, today]);

  const addCarryoverToToday = useCallback(async (id: string) => {
    if (!userListsCollection || !firestore) return;
    const taskToCarryOver = carryoverTasks.find(t => t.id === id);
    if (!taskToCarryOver) return;

    const newTask: Task = { 
      ...taskToCarryOver, 
      listDate: today, 
      isCarryover: true,
      originDate: taskToCarryOver.originDate || taskToCarryOver.listDate
    }; 
    
    setCarryoverTasks(prev => prev.filter(t => t.id !== id));
    setTasks(prev => [...prev, newTask]);
    
    const todayRef = doc(userListsCollection, today);
    updateDocumentNonBlocking(todayRef, { tasks: arrayUnion(newTask) });

  }, [userListsCollection, firestore, carryoverTasks, today]);


  const getTaskScore = useCallback((task: Task, energy: Session['energy']) => {
    const effortEaseMap: Record<Effort, number> = { XS: 1, S: 0.75, M: 0.3, L: 0.1 };
    
    const importanceScore = task.importance === '!!' ? 1 : 0;
    const effortEaseScore = task.effort ? effortEaseMap[task.effort] : 0;
    
    const stalenessDays = differenceInDays(new Date(), new Date(task.originDate || task.createdAt));
    const isStale = stalenessDays >= 2;
    const stalenessNudge = isStale ? 0.2 : 0;

    let energyFit = 0;
    if (task.effort) {
        if (energy === 'low') {
            if (task.effort === 'XS' || task.effort === 'S') energyFit = 0.1;
        } else if (energy === 'high') {
            if (task.effort === 'XS' || task.effort === 'S') energyFit = -0.1;
            if (task.effort === 'M' || task.effort === 'L') energyFit = 0.1;
        }
    }
    
    return (0.45 * importanceScore) + (0.35 * effortEaseScore) + (0.20 * stalenessNudge) + energyFit;
  }, []);

  const sortedTasks = useMemo(() => {
    const todoTasks = tasks.filter(t => t.status === 'todo');
    const doneTasks = tasks.filter(t => t.status === 'done').sort((a,b) => (b.completedAt || 0) - (a.completedAt || 0));
    
    let sortedTodoTasks: Task[];

    switch (sortMode) {
      case 'easy':
        const effortOrder: (Effort | null)[] = ['XS', 'S', 'M', 'L', null];
        sortedTodoTasks = [...todoTasks].sort((a, b) => {
          const effortA = effortOrder.indexOf(a.effort);
          const effortB = effortOrder.indexOf(b.effort);
          if (effortA !== effortB) return effortA - effortB;
          return (a.createdAt || 0) - (b.createdAt || 0);
        });
        break;
      case 'ai':
        sortedTodoTasks = [...todoTasks].sort((a, b) => {
          const scoreA = getTaskScore(a, session.energy);
          const scoreB = getTaskScore(b, session.energy);
          if (scoreB !== scoreA) return scoreB - scoreA;
          if (a.title.length !== b.title.length) return a.title.length - b.title.length;
          return a.title.localeCompare(b.title);
        });
        break;
      case 'custom':
      default:
        sortedTodoTasks = [...todoTasks].sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));
        break;
    }
    return [...sortedTodoTasks, ...doneTasks];
  }, [tasks, sortMode, session.energy, getTaskScore]);

  const firstTask = useMemo(() => {
    return sortedTasks.find(t => t.status === 'todo');
  }, [sortedTasks]);

  useEffect(() => {
    if (sortMode !== 'ai' || loading || !userListsCollection) return;

    const todoTasks = tasks.filter(t => t.status === 'todo');
    if (todoTasks.length === 0) {
      setAiData({ effortSuggestions: [], topReasons: [] });
      return;
    }

    const runAiEnhancement = async () => {
      const tasksNeedingEffort = todoTasks.filter(t => !t.effort);
      const topTask = firstTask;

      if (tasksNeedingEffort.length > 0 || topTask) {
        const aiInput = {
          tasks: todoTasks.map(t => ({
            id: t.id,
            title: t.title,
            effort: t.effort,
            importance: t.importance,
            isStale: (differenceInDays(new Date(), new Date(t.originDate || t.createdAt))) >= 2,
          })),
          topTaskId: topTask?.id || '',
          session,
        };

        const result = await getAiTaskEnhancements(aiInput);
        setAiData(result);

        if (result.effortSuggestions.length > 0) {
          const updatedTasks = tasks.map(task => {
            const suggestion = result.effortSuggestions.find(s => s.id === task.id);
            if (suggestion && !task.effort) {
              return { ...task, effort: suggestion.effort };
            }
            return task;
          });
          
          setTasks(updatedTasks); 

          const todayRef = doc(userListsCollection, today);
          setDocumentNonBlocking(todayRef, { tasks: updatedTasks, date: today }, { merge: true });
        }
      }
    };

    const timeoutId = setTimeout(runAiEnhancement, 500); // Debounce AI call
    return () => clearTimeout(timeoutId);

  }, [sortMode, tasks, session, firstTask, loading, userListsCollection, today]);


  return {
    tasks: sortedTasks,
    carryoverTasks,
    session,
    setSession,
    sortMode,
    setSortMode,
    addTask,
    updateTask,
    deleteTask,
    addCarryoverToToday,
    loading: isUserLoading || loading,
    firstTask,
    aiData,
  };
}
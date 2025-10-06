'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, Firestore } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { Task, Session, SortMode, Effort } from '@/lib/types';
import { getToday } from '@/lib/utils';
import { getAiTaskEnhancements } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { subDays, differenceInDays } from 'date-fns';

type AiData = {
  effortSuggestions: { id: string; effort: Effort }[];
  topReasons: string[];
};

export function useTaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [carryoverTasks, setCarryoverTasks] = useState<Task[]>([]);
  const [session, setSession] = useState<Session>({ energy: 'med', sessionQuickWinsCompleted: 0 });
  const [sortMode, setSortMode] = useState<SortMode>('ai');
  const [loading, setLoading] = useState(true);
  const [aiData, setAiData] = useState<AiData>({ effortSuggestions: [], topReasons: [] });
  const [db, setDb] = useState<Firestore | null>(null);
  const { toast } = useToast();

  const today = getToday();
  const yesterday = getToday(subDays(new Date(), 1));

  useEffect(() => {
    const initDb = async () => {
      const firestore = await getDb();
      setDb(firestore);
    };
    initDb();
  }, []);

  useEffect(() => {
    if (!db) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const todayRef = doc(db, 'lists', today);
        const yesterdayRef = doc(db, 'lists', yesterday);

        const [todaySnap, yesterdaySnap] = await Promise.all([getDoc(todayRef), getDoc(yesterdayRef)]);

        if (yesterdaySnap.exists()) {
          const yesterdayData = yesterdaySnap.data();
          const carryovers = (yesterdayData.tasks || []).filter((task: Task) => task.status === 'todo').map((task: Task) => ({ ...task, isCarryover: true }));
          setCarryoverTasks(carryovers);
        }

        if (todaySnap.exists()) {
          const todayData = todaySnap.data();
          // Ensure createdAt is present, default to listDate if not
          const loadedTasks = (todayData.tasks || []).map((t: Task) => ({
            ...t,
            createdAt: t.createdAt || new Date(t.listDate).getTime()
          }));
          setTasks(loadedTasks);
        } else {
          await setDoc(todayRef, { date: today, tasks: [] });
          setTasks([]);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({ title: "Error", description: "Could not load tasks. Please try again later.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [db, today, yesterday, toast]);
  
  const addTask = useCallback(async (newTask: Omit<Task, 'id' | 'listDate' | 'isCarryover' | 'createdAt' | 'status'>) => {
    if (!db) return;
    const taskToAdd: Task = {
      ...newTask,
      id: crypto.randomUUID(),
      listDate: today,
      isCarryover: false,
      status: 'todo' as const,
      createdAt: Date.now(),
    };

    setTasks(prev => [...prev, taskToAdd]);
    
    try {
      const todayRef = doc(db, 'lists', today);
      await updateDoc(todayRef, {
        tasks: arrayUnion(taskToAdd)
      });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({ title: "Error", description: "Failed to save new task.", variant: "destructive" });
      setTasks(prev => prev.filter(p => p.id !== taskToAdd.id));
    }
  }, [db, today, toast]);

  const addTasks = useCallback(async (newTasks: Omit<Task, 'id' | 'listDate' | 'isCarryover' | 'createdAt' | 'status'>[]) => {
    if (!db) return;
    const tasksToAdd: Task[] = newTasks.map(t => ({
      ...t,
      id: crypto.randomUUID(),
      listDate: today,
      isCarryover: false,
      status: 'todo' as const,
      createdAt: Date.now(),
    }));

    setTasks(prev => [...prev, ...tasksToAdd]);
    
    try {
      const todayRef = doc(db, 'lists', today);
      await updateDoc(todayRef, {
        tasks: arrayUnion(...tasksToAdd)
      });
    } catch (error) {
      console.error("Error adding tasks:", error);
      toast({ title: "Error", description: "Failed to save new tasks.", variant: "destructive" });
      setTasks(prev => prev.filter(p => !tasksToAdd.some(n => n.id === p.id)));
    }
  }, [db, today, toast]);
  
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!db) return;
    const originalTasks = tasks;
    const newTasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    setTasks(newTasks);

    try {
      const todayRef = doc(db, 'lists', today);
      // Using setDoc to overwrite the entire array, which is simpler for updates.
      await setDoc(todayRef, { tasks: newTasks, date: today }, { merge: true });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ title: "Error", description: "Failed to update task.", variant: "destructive" });
      setTasks(originalTasks);
    }
  }, [db, tasks, today, toast]);

  const deleteTask = useCallback(async (id: string) => {
    if (!db) return;
    const taskToDelete = tasks.find(t => t.id === id);
    if (!taskToDelete) return;

    const originalTasks = tasks;
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      const todayRef = doc(db, 'lists', today);
      await updateDoc(todayRef, {
        tasks: arrayRemove(taskToDelete)
      });
    } catch (error) {
        console.error("Error deleting task:", error);
        toast({ title: "Error", description: "Failed to delete task.", variant: "destructive" });
        setTasks(originalTasks);
    }
  }, [db, tasks, today, toast]);

  const addCarryoverToToday = useCallback(async (id: string) => {
    if (!db) return;
    const task = carryoverTasks.find(t => t.id === id);
    if (!task) return;

    // Preserve original creation date on carryover
    const newTask = { ...task, listDate: today, isCarryover: true }; // isCarryover remains true for staleness check
    
    setCarryoverTasks(prev => prev.filter(t => t.id !== id));
    setTasks(prev => [...prev, newTask]);

    try {
        const todayRef = doc(db, 'lists', today);
        await updateDoc(todayRef, {
            tasks: arrayUnion(newTask)
        });
    } catch (error) {
        console.error("Error adding carryover task:", error);
        toast({ title: "Error", description: "Could not add task from yesterday.", variant: "destructive" });
        setCarryoverTasks(prev => [...prev, task]);
        setTasks(prev => prev.filter(t => t.id !== newTask.id));
    }
  }, [db, carryoverTasks, today, toast]);

  const getTaskScore = useCallback((task: Task, energy: Session['energy']) => {
    const effortEaseMap: Record<Effort, number> = { XS: 1, S: 0.75, M: 0.3, L: 0.1 };
    
    const importanceScore = task.importance === '!!' ? 1 : 0;
    const effortEaseScore = task.effort ? effortEaseMap[task.effort] : 0; // Default to 0 if no effort
    
    const isStale = task.isCarryover && differenceInDays(new Date(), new Date(task.createdAt)) >= 2;
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
    const doneTasks = tasks.filter(t => t.status === 'done').sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)); // Show most recently completed first
    
    let sortedTodoTasks: Task[];

    switch (sortMode) {
      case 'easy':
        const effortOrder: (Effort | null)[] = ['XS', 'S', 'M', 'L', null];
        sortedTodoTasks = [...todoTasks].sort((a, b) => {
          const effortA = effortOrder.indexOf(a.effort);
          const effortB = effortOrder.indexOf(b.effort);
          return effortA - effortB;
        });
        break;
      case 'ai':
        sortedTodoTasks = [...todoTasks].sort((a, b) => {
          const scoreA = getTaskScore(a, session.energy);
          const scoreB = getTaskScore(b, session.energy);
          if (scoreB !== scoreA) return scoreB - scoreA;
          // Tie-breakers
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
    if (sortMode !== 'ai' || loading || !db) return;

    const todoTasks = tasks.filter(t => t.status === 'todo');
    if (todoTasks.length === 0) {
      setAiData({ effortSuggestions: [], topReasons: [] });
      return;
    }

    const runAiEnhancement = async () => {
      // 1. Get new suggestions if needed
      const tasksNeedingEffort = todoTasks.filter(t => !t.effort);
      const topTask = firstTask;

      if (tasksNeedingEffort.length > 0 || topTask) {
        const aiInput = {
          tasks: todoTasks.map(t => ({
            id: t.id,
            title: t.title,
            effort: t.effort,
            importance: t.importance,
            isStale: t.isCarryover && differenceInDays(new Date(), new Date(t.createdAt)) >= 2,
          })),
          topTaskId: topTask?.id || '',
          session,
        };

        const result = await getAiTaskEnhancements(aiInput);
        setAiData(result); // Store reasons

        // 2. Apply effort suggestions
        if (result.effortSuggestions.length > 0) {
          const updatedTasks = tasks.map(task => {
            const suggestion = result.effortSuggestions.find(s => s.id === task.id);
            if (suggestion && !task.effort) {
              return { ...task, effort: suggestion.effort };
            }
            return task;
          });
          
          // Use a temporary state update for immediate UI feedback before DB write
          setTasks(updatedTasks); 

          // Persist all updates at once
          try {
            const todayRef = doc(db, 'lists', today);
            await setDoc(todayRef, { tasks: updatedTasks, date: today }, { merge: true });
          } catch(error) {
             console.error("Error saving effort suggestions:", error);
             // Note: No rollback here to keep the UI consistent with the AI's suggestions.
          }
        }
      }
    };

    runAiEnhancement();
  }, [sortMode, tasks, session, firstTask, loading, today, db]);


  return {
    tasks: sortedTasks,
    carryoverTasks,
    session,
    setSession,
    sortMode,
    setSortMode,
    addTask,
    addTasks,
    updateTask,
    deleteTask,
    addCarryoverToToday,
    loading,
    firstTask,
    aiData, // Expose reasons and suggestions
  };
}

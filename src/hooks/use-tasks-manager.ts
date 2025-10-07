'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc, arrayUnion, collection, Timestamp, writeBatch } from 'firebase/firestore';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { Task, Session, SortMode, Effort } from '@/lib/types';
import { getToday } from '@/lib/utils';
import { getAiTaskEnhancements } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { subDays, differenceInDays } from 'date-fns';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';

type AiData = {
  effortSuggestions: { id: string; effort: Effort; confidence: number; reasons: string[] }[];
  topReasons: string[];
};

type DebugInfo = {
  scores: { id: string, title: string, score: number, reason: string }[];
};

// Helper to remove undefined values from an object before writing to Firestore
const cleanFirestoreData = (data: any) => {
  const cleanedData: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
      cleanedData[key] = data[key];
    }
  }
  return cleanedData;
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
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  const today = getToday();
  const yesterday = getToday(subDays(new Date(), 1));

  const userListsCollection = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'lists');
  }, [firestore, user]);

  const runAiEnhancements = useCallback(async (currentTasks: Task[], currentSession: Session, currentTopTaskId?: string) => {
    const todoTasks = currentTasks.filter(t => t.status === 'todo');
    const tasksNeedingEffort = todoTasks.filter(t => t.effort === null && t.effortSource !== 'user');
    
    if (tasksNeedingEffort.length === 0 && !currentTopTaskId) {
      setAiData({ effortSuggestions: [], topReasons: [] });
      return;
    }

    try {
      const aiInput = {
        tasks: todoTasks.map(t => ({
          id: t.id,
          title: t.title,
          effort: t.effort,
          flagged: t.flagged,
          isStale: (differenceInDays(new Date(), new Date(t.originDate || t.createdAt))) >= 2,
        })),
        topTaskId: currentTopTaskId || '',
        session: currentSession,
      };
      
      const result = await getAiTaskEnhancements(aiInput);
      setAiData(result);

      if (result.effortSuggestions.length > 0 && userListsCollection) {
        let didUpdate = false;
        const updatedTasks = currentTasks.map(task => {
          const suggestion = result.effortSuggestions.find(s => s.id === task.id);
          if (suggestion && task.effort === null) {
            didUpdate = true;
            return { 
              ...task, 
              effort: suggestion.effort,
              effortConfidence: suggestion.confidence,
              effortReasons: suggestion.reasons,
              effortSource: 'ai' as const
            };
          }
          return task;
        });
        
        if (didUpdate) {
            setTasks(updatedTasks);
            const cleanedTasks = updatedTasks.map(cleanFirestoreData);
            const todayRef = doc(userListsCollection, today);
            setDocumentNonBlocking(todayRef, { tasks: cleanedTasks, date: today }, { merge: true });
        }
      }
    } catch (e) {
      console.error('AI enhancement failed', e);
      // Optional: show a toast to the user
    }
  }, [userListsCollection, today]);

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
            id: t.id || crypto.randomUUID(),
            flagged: t.flagged ?? false,
            effort: t.effort ?? null,
            isCarryover: t.isCarryover ?? false,
            originDate: t.originDate ?? t.listDate,
            createdAt: t.createdAt instanceof Timestamp ? t.createdAt.toMillis() : t.createdAt,
            completedAt: t.completedAt instanceof Timestamp ? t.completedAt.toMillis() : t.completedAt,
          }));
        } else {
          setDocumentNonBlocking(todayRef, { date: today, tasks: [] }, { merge: false });
        }
        
        if (yesterdaySnap.exists()) {
          const yesterdayData = yesterdaySnap.data();
          const carryovers = (yesterdayData.tasks || [])
            .filter((task: Task) => task.status === 'todo')
            .map((task: any) => ({ 
              ...task,
              flagged: task.flagged ?? false,
              isCarryover: true,
              originDate: task.originDate ?? task.listDate,
              createdAt: task.createdAt instanceof Timestamp ? task.createdAt.toMillis() : task.createdAt,
            }))
            .filter((ct: Task) => !todaysTasks.some(tt => tt.id === ct.id && tt.listDate === today));
            
          setCarryoverTasks(carryovers);
        }
        setTasks(todaysTasks);
      } catch (error: any) {
        console.error("Error loading data:", error);
        toast({ title: "Error", description: "Could not load tasks. Please try again later.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isUserLoading, firestore, user, userListsCollection, today, yesterday, toast]);
  
  const addTask = useCallback((newTaskData: Omit<Task, 'id' | 'listDate' | 'isCarryover' | 'createdAt' | 'status' | 'originDate' | 'flagged'>) => {
    if (!userListsCollection) return;

    const now = Date.now();
    const taskToAdd: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      listDate: today,
      isCarryover: false,
      status: 'todo' as const,
      createdAt: now,
      originDate: today,
      flagged: false,
    };

    const newTasks = [...tasks, taskToAdd];
    setTasks(newTasks);
    
    const todayRef = doc(userListsCollection, today);
    const cleanedTask = cleanFirestoreData(taskToAdd);
    updateDocumentNonBlocking(todayRef, { tasks: arrayUnion(cleanedTask) });
    
    // Trigger AI enhancement non-blockingly
    runAiEnhancements(newTasks, session);

  }, [userListsCollection, tasks, today, session, runAiEnhancements]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    if (!userListsCollection) return;
    
    let originalTitle: string | undefined;
    const newTasks = tasks.map(t => {
      if (t.id === id) {
        originalTitle = t.title;
        return { ...t, ...updates, ...(updates.status === 'done' && !t.completedAt && { completedAt: Date.now() }) };
      }
      return t;
    });
    setTasks(newTasks);

    const cleanedTasks = newTasks.map(cleanFirestoreData);
    const todayRef = doc(userListsCollection, today);
    setDocumentNonBlocking(todayRef, { tasks: cleanedTasks, date: today }, { merge: true });

    // If title changed and effort is not user-set, run AI
    const updatedTask = newTasks.find(t => t.id === id);
    if (updatedTask && updates.title && updates.title !== originalTitle && updatedTask.effortSource !== 'user') {
      runAiEnhancements(newTasks, session);
    }
  }, [userListsCollection, tasks, today, session, runAiEnhancements]);


  const deleteTask = useCallback(async (id: string) => {
    if (!userListsCollection) return;

    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);
    
    const cleanedTasks = updatedTasks.map(cleanFirestoreData);
    const todayRef = doc(userListsCollection, today);
    setDocumentNonBlocking(todayRef, { tasks: cleanedTasks }, { merge: true });
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
    const cleanedTask = cleanFirestoreData(newTask);
    updateDocumentNonBlocking(todayRef, { tasks: arrayUnion(cleanedTask) });
  }, [userListsCollection, firestore, carryoverTasks, today]);

  const getTaskScore = useCallback((task: Task, energy: Session['energy']) => {
    const effortEaseMap: Record<Effort, number> = { XS: 1, S: 0.75, M: 0.3, L: 0.1 };
    
    const flagScore = task.flagged ? 1 : 0;
    const effortEaseScore = task.effort ? effortEaseMap[task.effort] : 0.0;
    
    const stalenessDays = differenceInDays(new Date(), new Date(task.originDate || task.createdAt));
    const isStale = stalenessDays >= 2;
    const stalenessNudge = isStale ? 0.2 : 0;

    let energyFit = 0;
    let energyReason = '';
    if (task.effort) {
        if (energy === 'low') {
            if (task.effort === 'XS' || task.effort === 'S') { energyFit = 0.1; energyReason = 'Good for low energy. '; }
        } else if (energy === 'high') {
            if (task.effort === 'M' || task.effort === 'L') { energyFit = 0.1; energyReason = 'Good for high energy. '; }
            else { energyFit = -0.1; energyReason = 'Not a high-energy task. ';}
        }
    } else {
      energyReason = 'No effort set. ';
    }
    
    const totalScore = (0.45 * flagScore) + (0.35 * effortEaseScore) + (0.20 * stalenessNudge) + energyFit;
    
    const reason = `FLAG: ${task.flagged ? 'On' : 'Off'} (${(0.45 * flagScore).toFixed(2)}) / EASE: ${task.effort || 'None'} (${(0.35 * effortEaseScore).toFixed(2)}) / STALE: ${isStale ? 'Yes' : 'No'} (${(0.20 * stalenessNudge).toFixed(2)}) / ENERGY: ${energyReason}(${energyFit.toFixed(2)})`;
    
    return { score: totalScore, reason };
  }, []);

  const sortedTasks = useMemo(() => {
    const todoTasks = tasks.filter(t => t.status === 'todo');
    const doneTasks = tasks.filter(t => t.status === 'done').sort((a,b) => (b.completedAt || 0) - (a.completedAt || 0));
    
    let sortedTodoTasks: Task[];
    const scores: DebugInfo['scores'] = [];

    switch (sortMode) {
      case 'easy':
        const effortOrder: (Effort | null)[] = ['XS', 'S', 'M', 'L', null];
        sortedTodoTasks = [...todoTasks].sort((a, b) => {
          const effortA = effortOrder.indexOf(a.effort);
          const effortB = effortOrder.indexOf(b.effort);
          if (effortA !== effortB) return effortA - effortB;
          return a.createdAt - b.createdAt;
        });
        setDebugInfo(null);
        break;
      case 'ai':
        const scoredTasks = todoTasks.map(task => {
          const { score, reason } = getTaskScore(task, session.energy);
          scores.push({ id: task.id, title: task.title, score, reason });
          return { ...task, score };
        });

        sortedTodoTasks = scoredTasks.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.createdAt - b.createdAt;
        });
        scores.sort((a,b) => b.score - a.score);
        setDebugInfo({ scores });
        break;
      case 'custom':
      default:
        sortedTodoTasks = [...todoTasks].sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));
        setDebugInfo(null);
        break;
    }
    return [...sortedTodoTasks, ...doneTasks];
  }, [tasks, sortMode, session.energy, getTaskScore]);

  const firstTask = useMemo(() => {
    return sortedTasks.find(t => t.status === 'todo');
  }, [sortedTasks]);
  
  // This effect calls the AI for top task reasons, separate from effort estimation.
  useEffect(() => {
    if (sortMode !== 'ai' || loading || !firstTask) {
      if (sortMode !== 'ai') setAiData(d => ({ ...d, topReasons: [] }));
      return;
    }

    const timeoutId = setTimeout(() => runAiEnhancements(tasks, session, firstTask.id), 500); // Debounce AI call
    return () => clearTimeout(timeoutId);

  }, [sortMode, firstTask, tasks, session, loading, runAiEnhancements]);

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
    debugInfo,
  };
}

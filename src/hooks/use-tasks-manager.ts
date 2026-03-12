'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc, arrayUnion, collection, Timestamp, writeBatch } from 'firebase/firestore';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { Task, Session, SortMode, Effort } from '@/lib/types';
import { getToday } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { subDays, differenceInDays } from 'date-fns';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type DebugInfo = {
  scores: { id: string; title: string; score: number; reason: string }[];
};

// Helper to remove undefined values from an object before writing to Firestore
const cleanFirestoreData = (data: Record<string, unknown>) => {
  const cleanedData: Record<string, unknown> = {};
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
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

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
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const todayRef = doc(userListsCollection, today);
        const yesterdayRef = doc(userListsCollection, yesterday);

        const [todaySnap, yesterdaySnap] = await Promise.all([getDoc(todayRef), getDoc(yesterdayRef)]);

        // Raw type from Firestore before timestamp normalization
        type RawTask = Omit<Task, 'createdAt' | 'completedAt'> & {
          createdAt: Timestamp | number;
          completedAt?: Timestamp | number;
        };

        const normalizeTimestamp = (v: Timestamp | number | undefined): number | undefined =>
          v instanceof Timestamp ? v.toMillis() : v;

        let todaysTasks: Task[] = [];
        if (todaySnap.exists()) {
          const todayData = todaySnap.data();
          todaysTasks = (todayData.tasks || []).map((t: RawTask) => ({
            ...t,
            id: t.id || crypto.randomUUID(),
            flagged: t.flagged ?? false,
            effort: t.effort ?? null,
            isCarryover: t.isCarryover ?? false,
            originDate: t.originDate ?? t.listDate,
            createdAt: normalizeTimestamp(t.createdAt) ?? Date.now(),
            completedAt: normalizeTimestamp(t.completedAt),
          }));
        } else {
          setDocumentNonBlocking(todayRef, { date: today, tasks: [] }, { merge: false });
        }

        if (yesterdaySnap.exists()) {
          const yesterdayData = yesterdaySnap.data();
          const carryovers = (yesterdayData.tasks || [])
            .filter((task: RawTask) => task.status === 'todo')
            .map((task: RawTask) => ({
              ...task,
              flagged: task.flagged ?? false,
              isCarryover: true,
              originDate: task.originDate ?? task.listDate,
              createdAt: normalizeTimestamp(task.createdAt) ?? Date.now(),
            }))
            .filter((ct: Task) => !todaysTasks.some(tt => tt.id === ct.id && tt.listDate === today));

          setCarryoverTasks(carryovers);
        }
        setTasks(todaysTasks);
      } catch (error: unknown) {
        console.error('Error loading data:', error);
        toast({ title: 'Error', description: 'Could not load tasks. Please try again later.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isUserLoading, firestore, user, userListsCollection, today, yesterday, toast]);

  const addTask = useCallback((newTaskData: Omit<Task, 'id' | 'listDate' | 'isCarryover' | 'createdAt' | 'status' | 'originDate' | 'flagged'>) => {
    if (!userListsCollection) return;

    const taskToAdd: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      listDate: today,
      isCarryover: false,
      status: 'todo' as const,
      createdAt: Date.now(),
      originDate: today,
      flagged: false,
      effortSource: newTaskData.effort ? 'user' : null,
    };

    const newTasks = [...tasks, taskToAdd];
    setTasks(newTasks);

    const todayRef = doc(userListsCollection, today);
    const cleanedTask = cleanFirestoreData(taskToAdd as unknown as Record<string, unknown>);
    updateDocumentNonBlocking(todayRef, { tasks: arrayUnion(cleanedTask) });
  }, [userListsCollection, tasks, today]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    if (!userListsCollection) return;

    const newTasks = tasks.map(t => {
      if (t.id === id) {
        if (updates.effort && updates.effort !== t.effort) {
          updates.effortSource = 'user';
        }
        return {
          ...t,
          ...updates,
          ...(updates.status === 'done' && !t.completedAt && { completedAt: Date.now() }),
        };
      }
      return t;
    });
    setTasks(newTasks);

    const cleanedTasks = newTasks.map(t => cleanFirestoreData(t as unknown as Record<string, unknown>));
    const todayRef = doc(userListsCollection, today);
    setDocumentNonBlocking(todayRef, { tasks: cleanedTasks, date: today }, { merge: true });
  }, [userListsCollection, tasks, today]);

  const deleteTask = useCallback((id: string) => {
    if (!userListsCollection) return;

    const updatedTasks = tasks.filter(t => t.id !== id);
    setTasks(updatedTasks);

    const cleanedTasks = updatedTasks.map(t => cleanFirestoreData(t as unknown as Record<string, unknown>));
    const todayRef = doc(userListsCollection, today);
    setDocumentNonBlocking(todayRef, { tasks: cleanedTasks }, { merge: true });
  }, [userListsCollection, tasks, today]);

  const addCarryoverToToday = useCallback((id: string) => {
    if (!userListsCollection || !firestore) return;
    const taskToCarryOver = carryoverTasks.find(t => t.id === id);
    if (!taskToCarryOver) return;

    const newTask: Task = {
      ...taskToCarryOver,
      listDate: today,
      isCarryover: true,
      originDate: taskToCarryOver.originDate || taskToCarryOver.listDate,
    };

    setCarryoverTasks(prev => prev.filter(t => t.id !== id));
    setTasks(prev => [...prev, newTask]);

    const todayRef = doc(userListsCollection, today);
    const cleanedTask = cleanFirestoreData(newTask as unknown as Record<string, unknown>);
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
        else { energyFit = -0.1; energyReason = 'Not a high-energy task. '; }
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
    const doneTasks = tasks.filter(t => t.status === 'done').sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    let sortedTodoTasks: Task[];
    const scores: DebugInfo['scores'] = [];

    switch (sortMode) {
      case 'easy': {
        const effortOrder: (Effort | null)[] = ['XS', 'S', 'M', 'L', null];
        sortedTodoTasks = [...todoTasks].sort((a, b) => {
          const effortA = effortOrder.indexOf(a.effort);
          const effortB = effortOrder.indexOf(b.effort);
          if (effortA !== effortB) return effortA - effortB;
          return a.createdAt - b.createdAt;
        });
        setDebugInfo(prev => prev ? { ...prev, scores: [] } : null);
        break;
      }
      case 'ai': {
        const scoredTasks = todoTasks.map(task => {
          const { score, reason } = getTaskScore(task, session.energy);
          scores.push({ id: task.id, title: task.title, score, reason });
          return { ...task, score };
        });

        sortedTodoTasks = scoredTasks.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (a.title.length !== b.title.length) return a.title.length - b.title.length;
          return a.title.localeCompare(b.title);
        });
        scores.sort((a, b) => b.score - a.score);
        setDebugInfo(prev => prev ? { ...prev, scores } : null);
        break;
      }
      case 'custom':
      default:
        sortedTodoTasks = [...todoTasks].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        setDebugInfo(prev => prev ? { ...prev, scores: [] } : null);
        break;
    }
    return [...sortedTodoTasks, ...doneTasks];
  }, [tasks, sortMode, session.energy, getTaskScore]);

  const firstTask = useMemo(() => {
    return sortedTasks.find(t => t.status === 'todo');
  }, [sortedTasks]);

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
    debugInfo,
  };
}

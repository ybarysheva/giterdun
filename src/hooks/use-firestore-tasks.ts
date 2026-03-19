'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, arrayUnion, collection, Timestamp } from 'firebase/firestore';
import { useFirebase, useUser, useMemoFirebase } from '@/firebase';
import { Task } from '@/lib/types';
import { getToday } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { subDays } from 'date-fns';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { classifyTaskEffort } from '@/app/actions';

// Raw type from Firestore before timestamp normalization
type RawTask = Omit<Task, 'createdAt' | 'completedAt'> & {
  createdAt: Timestamp | number;
  completedAt?: Timestamp | number;
};

const normalizeTimestamp = (v: Timestamp | number | undefined): number | undefined =>
  v instanceof Timestamp ? v.toMillis() : v;

const cleanFirestoreData = (data: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
      result[key] = data[key];
    }
  }
  return result;
};

export function useFirestoreTasks() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [carryoverTasks, setCarryoverTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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

        let todaysTasks: Task[] = [];
        if (todaySnap.exists()) {
          todaysTasks = (todaySnap.data().tasks || []).map((t: RawTask) => ({
            ...t,
            id: t.id || crypto.randomUUID(),
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
          const carryovers = (yesterdaySnap.data().tasks || [])
            .filter((t: RawTask) => t.status === 'todo')
            .map((t: RawTask) => ({
              ...t,
              isCarryover: true,
              originDate: t.originDate ?? t.listDate,
              createdAt: normalizeTimestamp(t.createdAt) ?? Date.now(),
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

  const addTask = useCallback((newTaskData: Omit<Task, 'id' | 'listDate' | 'isCarryover' | 'createdAt' | 'status' | 'originDate'>) => {
    if (!userListsCollection) return;

    const taskToAdd: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      listDate: today,
      isCarryover: false,
      status: 'todo',
      createdAt: Date.now(),
      originDate: today,
      effortSource: newTaskData.effort ? 'user' : null,
    };

    setTasks(prev => [...prev, taskToAdd]);
    const todayRef = doc(userListsCollection, today);
    updateDocumentNonBlocking(todayRef, { tasks: arrayUnion(cleanFirestoreData(taskToAdd as unknown as Record<string, unknown>)) });

    if (!taskToAdd.effort) {
      classifyTaskEffort(taskToAdd.title).then(result => {
        if (!result || !userListsCollection) return;
        setTasks(prev => {
          const newTasks = prev.map(t => {
            if (t.id !== taskToAdd.id) return t;
            return { ...t, effort: result.effort, effortSource: 'ai' as const, effortReasons: [result.reason] };
          });
          const ref = doc(userListsCollection, today);
          setDocumentNonBlocking(ref, {
            tasks: newTasks.map(t => cleanFirestoreData(t as unknown as Record<string, unknown>)),
            date: today,
          }, { merge: true });
          return newTasks;
        });
      });
    }
  }, [userListsCollection, today]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    if (!userListsCollection) return;

    setTasks(prev => {
      const newTasks = prev.map(t => {
        if (t.id !== id) return t;
        if (updates.effort && updates.effort !== t.effort) updates.effortSource = 'user';
        return {
          ...t,
          ...updates,
          ...(updates.status === 'done' && !t.completedAt && { completedAt: Date.now() }),
        };
      });
      const todayRef = doc(userListsCollection, today);
      setDocumentNonBlocking(todayRef, {
        tasks: newTasks.map(t => cleanFirestoreData(t as unknown as Record<string, unknown>)),
        date: today,
      }, { merge: true });
      return newTasks;
    });
  }, [userListsCollection, today]);

  const deleteTask = useCallback((id: string) => {
    if (!userListsCollection) return;

    setTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      const todayRef = doc(userListsCollection, today);
      setDocumentNonBlocking(todayRef, {
        tasks: updated.map(t => cleanFirestoreData(t as unknown as Record<string, unknown>)),
      }, { merge: true });
      return updated;
    });
  }, [userListsCollection, today]);

  const addCarryoverToToday = useCallback((id: string) => {
    if (!userListsCollection) return;
    const task = carryoverTasks.find(t => t.id === id);
    if (!task) return;

    const newTask: Task = {
      ...task,
      listDate: today,
      isCarryover: true,
      originDate: task.originDate || task.listDate,
    };

    setCarryoverTasks(prev => prev.filter(t => t.id !== id));
    setTasks(prev => [...prev, newTask]);
    const todayRef = doc(userListsCollection, today);
    updateDocumentNonBlocking(todayRef, { tasks: arrayUnion(cleanFirestoreData(newTask as unknown as Record<string, unknown>)) });
  }, [userListsCollection, carryoverTasks, today]);

  const addSubtask = useCallback((parentTaskId: string, title: string) => {
    if (!userListsCollection || !title.trim()) return;

    const subtask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      status: 'todo',
      listDate: today,
      isCarryover: false,
      createdAt: Date.now(),
      originDate: today,
      parentTaskId,
      depth: 1,
    };

    setTasks(prev => [...prev, subtask]);
    const todayRef = doc(userListsCollection, today);
    updateDocumentNonBlocking(todayRef, { tasks: arrayUnion(cleanFirestoreData(subtask as unknown as Record<string, unknown>)) });
  }, [userListsCollection, today]);

  return {
    tasks,
    setTasks,
    carryoverTasks,
    loading: isUserLoading || loading,
    addTask,
    updateTask,
    deleteTask,
    addCarryoverToToday,
    addSubtask,
  };
}

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Task, Session, SortMode, Effort } from '@/lib/types';
import { getToday } from '@/lib/utils';
import { getAiSortedTaskIds } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { subDays } from 'date-fns';

export function useTaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [carryoverTasks, setCarryoverTasks] = useState<Task[]>([]);
  const [session, setSession] = useState<Session>({ energy: 'med', sessionQuickWinsCompleted: 0 });
  const [sortMode, setSortMode] = useState<SortMode>('ai');
  const [loading, setLoading] = useState(true);
  const [aiSortedIds, setAiSortedIds] = useState<string[]>([]);
  const { toast } = useToast();

  const today = getToday();
  const yesterday = getToday(subDays(new Date(), 1));

  useEffect(() => {
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
          setTasks(todayData.tasks || []);
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
  }, [today, yesterday, toast]);

  useEffect(() => {
    if (sortMode === 'ai' && tasks.length > 0) {
      const runAiSort = async () => {
        const sortedIds = await getAiSortedTaskIds({
          tasks: tasks.filter(t => t.status === 'todo'),
          session,
        });
        setAiSortedIds(sortedIds);
      };
      runAiSort();
    }
  }, [tasks, session, sortMode]);
  
  const addTask = useCallback(async (newTask: Omit<Task, 'id' | 'listDate' | 'isCarryover' | 'createdAt' | 'status'>) => {
    const taskToAdd = {
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
  }, [today, toast]);

  const addTasks = useCallback(async (newTasks: Omit<Task, 'id' | 'listDate' | 'isCarryover' | 'createdAt'>[]) => {
    const tasksToAdd = newTasks.map(t => ({
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
  }, [today, toast]);
  
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const originalTasks = tasks;
    const newTasks = tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    setTasks(newTasks);

    try {
      const todayRef = doc(db, 'lists', today);
      await setDoc(todayRef, { tasks: newTasks, date: today });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ title: "Error", description: "Failed to update task.", variant: "destructive" });
      setTasks(originalTasks);
    }
  }, [tasks, today, toast]);

  const deleteTask = useCallback(async (id: string) => {
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
  }, [tasks, today, toast]);

  const addCarryoverToToday = useCallback(async (id: string) => {
    const task = carryoverTasks.find(t => t.id === id);
    if (!task) return;

    const newTask = { ...task, listDate: today, isCarryover: false };
    
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
  }, [carryoverTasks, today, toast]);

  const sortedTasks = useMemo(() => {
    const todoTasks = tasks.filter(t => t.status === 'todo');
    const doneTasks = tasks.filter(t => t.status === 'done').sort((a,b) => a.createdAt - b.createdAt);
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
          const indexA = aiSortedIds.indexOf(a.id);
          const indexB = aiSortedIds.indexOf(b.id);
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
        break;
      case 'custom':
      default:
        sortedTodoTasks = [...todoTasks].sort((a,b) => a.createdAt - b.createdAt);
        break;
    }
    return [...sortedTodoTasks, ...doneTasks];
  }, [tasks, sortMode, aiSortedIds]);

  const progress = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { completed, total, percentage };
  }, [tasks]);

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
    addTasks,
    updateTask,
    deleteTask,
    addCarryoverToToday,
    loading,
    progress,
    firstTask,
  };
}

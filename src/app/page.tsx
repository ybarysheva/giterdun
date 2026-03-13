'use client';

import { useEffect, useRef, useState } from 'react';
import { useTaskManager } from '@/hooks/use-tasks-manager';
import { Header } from '@/components/app/Header';
import { TaskInput } from '@/components/app/TaskInput';
import { TaskList } from '@/components/app/TaskList';
import { CarryoverList } from '@/components/app/CarryoverList';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Task } from '@/lib/types';

export default function Home() {
  const {
    tasks,
    carryoverTasks,
    session,
    setSession,
    sortMode,
    setSortMode,
    addTask,
    updateTask,
    deleteTask,
    addCarryoverToToday,
    loading,
    firstTask,
    debugInfo,
  } = useTaskManager();

  const [lastChange, setLastChange] = useState<{ time: Date; what: string } | null>(null);
  const prevTasksRef = useRef<Task[]>([]);

  useEffect(() => {
    const prev = prevTasksRef.current;
    if (prev.length === 0 && tasks.length === 0) { prevTasksRef.current = tasks; return; }

    let what = 'task updated';
    if (tasks.length > prev.length) {
      what = 'task added';
    } else if (tasks.length < prev.length) {
      what = 'task deleted';
    } else {
      for (const task of tasks) {
        const old = prev.find(t => t.id === task.id);
        if (!old) continue;
        if (old.status === 'todo' && task.status === 'done') { what = 'task completed'; break; }
        if (task.status === 'todo' && old.status === 'done') { what = 'task uncompleted'; break; }
        if (!old.effort && task.effort && task.effortSource === 'ai') { what = 'effort classified by AI'; break; }
      }
    }

    setLastChange({ time: new Date(), what });
    prevTasksRef.current = tasks;
  }, [tasks]);

  return (
    <main className="container mx-auto max-w-lg p-4 md:p-8 font-body">
      <Header
        session={session}
        onEnergyChange={(energy) => setSession((s) => ({ ...s, energy }))}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
      />

      <div className="mt-8 space-y-2">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            firstTaskId={firstTask?.id}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        )}

        {!loading && (
          <TaskInput onAddTask={addTask} />
        )}

        {!loading && carryoverTasks.length > 0 && (
          <div className="mt-8">
            <CarryoverList
              tasks={carryoverTasks}
              onAddCarryoverToToday={addCarryoverToToday}
            />
          </div>
        )}

        {!loading && tasks.length === 0 && carryoverTasks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nothing yet — add a few things to get started.</p>
          </div>
        )}
      </div>

      {debugInfo && (
        <Card className="mt-16 bg-muted/50">
          <CardHeader>
            <CardTitle>Debug Panel</CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-xs space-y-4">
            {lastChange && (
              <div className="border-b border-border pb-2">
                <p>Last change: {lastChange.time.toLocaleTimeString()}</p>
                <p>What: {lastChange.what}</p>
              </div>
            )}
            <div>
              <p>Energy: {session.energy}</p>
              <p>Sort Mode: {sortMode}</p>
              <p>First Task ID: {firstTask?.id || 'N/A'}</p>
            </div>
            {debugInfo.scores && debugInfo.scores.length > 0 && (
              <div>
                <p className="font-semibold mb-2">Task Scores (Higher is better):</p>
                <ul className="space-y-1">
                  {debugInfo.scores.map(item => (
                    <li key={item.id}>
                      <span className={item.id === firstTask?.id ? 'font-bold text-primary' : ''}>
                        {item.title}: {item.score.toFixed(4)}
                      </span>
                      <p className="text-muted-foreground text-xs pl-4">{item.reason}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}

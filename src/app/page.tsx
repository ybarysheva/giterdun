'use client';

import { useTaskManager } from '@/hooks/use-tasks-manager';
import { Header } from '@/components/app/Header';
import { TaskInput } from '@/components/app/TaskInput';
import { TaskList } from '@/components/app/TaskList';
import { CarryoverList } from '@/components/app/CarryoverList';
import { Skeleton } from '@/components/ui/skeleton';

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
    aiData,
  } = useTaskManager();

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
            aiReasons={sortMode === 'ai' ? aiData.topReasons : []}
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
    </main>
  );
}

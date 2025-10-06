'use client';

import { useTaskManager } from '@/hooks/use-tasks-manager';
import { Header } from '@/components/app/Header';
import { StartBanner } from '@/components/app/StartBanner';
import { ProgressIndicator } from '@/components/app/ProgressIndicator';
import { TaskInput } from '@/components/app/TaskInput';
import { TaskList } from '@/components/app/TaskList';
import { CarryoverList } from '@/components/app/CarryoverList';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const {
    tasks,
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
  } = useTaskManager();

  return (
    <main className="container mx-auto max-w-2xl p-4 md:p-8 font-body">
      <Header
        session={session}
        onEnergyChange={(energy) => setSession((s) => ({ ...s, energy }))}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
      />

      <div className="mt-6 space-y-6">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          firstTask && <StartBanner task={firstTask} />
        )}

        <Card className="shadow-sm">
          <CardContent className="p-4">
            {loading ? (
               <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-24 ml-auto" />
              </div>
            ) : (
              <TaskInput onAddTasks={addTasks} />
            )}
            
            {!loading && tasks.length > 0 && (
              <>
                <Separator className="my-4" />
                <ProgressIndicator
                  value={progress.percentage}
                  count={progress.completed}
                  total={progress.total}
                />
              </>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        )}
        
        {!loading && carryoverTasks.length > 0 && (
          <CarryoverList
            tasks={carryoverTasks}
            onAddCarryoverToToday={addCarryoverToToday}
          />
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

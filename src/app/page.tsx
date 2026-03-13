'use client';

import { useTaskManager } from '@/hooks/use-tasks-manager';
import { Header } from '@/components/app/Header';
import { TaskInput } from '@/components/app/TaskInput';
import { TaskList } from '@/components/app/TaskList';
import { CarryoverList } from '@/components/app/CarryoverList';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
            {process.env.NEXT_PUBLIC_BUILD_TIMESTAMP && (
              <div className="border-b border-border pb-2">
                <p>Deployed: {new Date(parseInt(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP)).toLocaleString()}</p>
                <p>{process.env.NEXT_PUBLIC_BUILD_INFO}</p>
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

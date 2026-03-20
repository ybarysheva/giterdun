'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useTaskManager } from '@/hooks/use-tasks-manager';
import { Header } from '@/components/app/Header';
import { TaskInput } from '@/components/app/TaskInput';
import { TaskList } from '@/components/app/TaskList';
import { CarryoverList } from '@/components/app/CarryoverList';
import { TaskDetailPanel, TaskDetailPanelDesktop } from '@/components/app/TaskDetailPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Home() {
  const auth = useAuth();
  const {
    tasks,
    carryoverTasks,
    addTask,
    updateTask,
    deleteTask,
    addCarryoverToToday,
    addSubtask,
    getSubtasksForTask,
    loading,
    firstTask,
  } = useTaskManager();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;
  const selectedTaskSubtasks = selectedTask ? getSubtasksForTask(selectedTask.id) : [];

  const handleSelectTask = (id: string) => {
    setSelectedTaskId((prev) => (prev === id ? null : id));
  };

  const handleClosePanel = () => setSelectedTaskId(null);

  const handleAddSubtask = (title: string) => {
    if (selectedTask) {
      addSubtask(selectedTask.id, title);
    }
  };

  return (
    <main className={cn(
      'container mx-auto p-4 md:p-8 font-body transition-all duration-300',
      selectedTask ? 'max-w-4xl' : 'max-w-lg'
    )}>
      <div className="flex gap-8 items-start">
        {/* ── Left column: main content ── */}
        <div className="flex-1 min-w-0">
          <Header />

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
                selectedTaskId={selectedTaskId}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onSelectTask={handleSelectTask}
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
        </div>

        {/* ── Right column: desktop detail panel ── */}
        {selectedTask && (
          <div className="hidden md:block w-80 flex-shrink-0 sticky top-8">
            <TaskDetailPanelDesktop
              task={selectedTask}
              onClose={handleClosePanel}
              onUpdateTask={updateTask}
              onDeleteTask={deleteTask}
              subtasks={selectedTaskSubtasks}
              onAddSubtask={handleAddSubtask}
            />
          </div>
        )}
      </div>

      {/* ── Mobile: bottom sheet ── */}
      <TaskDetailPanel
        task={selectedTask}
        onClose={handleClosePanel}
        onUpdateTask={updateTask}
        onDeleteTask={deleteTask}
        subtasks={selectedTaskSubtasks}
        onAddSubtask={handleAddSubtask}
      />

      {/* ── Sign out button: bottom center ── */}
      <div className="flex justify-center mt-12 pb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut(auth)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Sign out
        </Button>
      </div>
    </main>
  );
}

'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useTaskManager } from '@/hooks/use-tasks-manager';
import { useProjects } from '@/hooks/use-projects';
import { Header } from '@/components/app/Header';
import { TaskInput } from '@/components/app/TaskInput';
import { TaskList } from '@/components/app/TaskList';
import { CarryoverList } from '@/components/app/CarryoverList';
import { CanvasView } from '@/components/app/CanvasView';
import { TaskDetailPanel, TaskDetailPanelDesktop } from '@/components/app/TaskDetailPanel';
import { ShoppingListPanel, ShoppingListPanelDesktop } from '@/components/app/ShoppingListPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShoppingList } from '@/hooks/use-shopping-list';

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

  const { createProject } = useProjects();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'canvas'>('list');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const createInputRef = useRef<HTMLInputElement | null>(null);

  const { items: shoppingItems, addItem, deleteItem, toggleItem, setCategoryItem } = useShoppingList();

  const handleCreateProject = useCallback(async () => {
    if (!newProjectName.trim()) return;
    await createProject(newProjectName.trim());
    setNewProjectName('');
    setShowCreateInput(false);
  }, [newProjectName, createProject]);

  const handleCreateInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreateProject();
    if (e.key === 'Escape') { setShowCreateInput(false); setNewProjectName(''); }
  };

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;
  const selectedTaskSubtasks = selectedTask ? getSubtasksForTask(selectedTask.id) : [];

  // Build a map of taskId → first todo subtask (for collapsed card previews)
  const rootTasks = tasks.filter((t) => !t.parentTaskId);
  const subtaskPreviewMap = new Map(
    rootTasks.map((t) => {
      const subtasks = getSubtasksForTask(t.id);
      const next = subtasks.find((s) => s.status === 'todo') ?? subtasks[0] ?? null;
      return [t.id, next] as const;
    })
  );

  const handleSelectTask = (id: string) => {
    setShoppingListOpen(false);
    setSelectedTaskId((prev) => (prev === id ? null : id));
  };

  const handleClosePanel = () => setSelectedTaskId(null);

  const handleAddSubtask = (title: string) => {
    if (selectedTask) {
      addSubtask(selectedTask.id, title);
    }
  };

  if (activeView === 'canvas') {
    return (
      <main className="fixed inset-0 font-body">
        <CanvasView
          showCreateInput={showCreateInput}
          newProjectName={newProjectName}
          onShowCreateInput={setShowCreateInput}
          onNewProjectNameChange={setNewProjectName}
          onCreateProject={handleCreateProject}
        />
        <div className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 pt-4 md:pt-8 pointer-events-none">
          <div className="pointer-events-auto flex justify-between items-start gap-4">
            <div>
              {showCreateInput ? (
                <div className="flex gap-2">
                  <Input
                    ref={createInputRef}
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={handleCreateInputKeyDown}
                    placeholder="Project name..."
                    className="h-8 text-sm w-48 bg-background"
                    autoFocus
                  />
                  <Button size="sm" className="h-8 px-3" onClick={handleCreateProject}>
                    Create
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  className="gap-2 shadow-sm"
                  onClick={() => setShowCreateInput(true)}
                >
                  <Plus className="h-4 w-4" />
                  Create project
                </Button>
              )}
            </div>
            <Header
              onOpenShoppingList={() => setShoppingListOpen((prev) => !prev)}
              shoppingItemCount={shoppingItems.filter((i) => !i.done).length}
              activeView={activeView}
              onViewChange={setActiveView}
            />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={cn(
      'container mx-auto p-4 md:p-8 font-body transition-all duration-300',
      (selectedTask || shoppingListOpen) ? 'max-w-4xl' : 'max-w-lg'
    )}>
      <div className="flex gap-8 items-start">
        {/* ── Left column: main content ── */}
        <div className="flex-1 min-w-0">
          <Header
            onOpenShoppingList={() => {
              setShoppingListOpen((prev) => !prev);
              setSelectedTaskId(null);
            }}
            shoppingItemCount={shoppingItems.filter((i) => !i.done).length}
            activeView={activeView}
            onViewChange={setActiveView}
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
                selectedTaskId={selectedTaskId}
                subtaskPreviewMap={subtaskPreviewMap}
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

        {/* ── Right column: desktop shopping list panel ── */}
        {shoppingListOpen && !selectedTask && (
          <div className="hidden md:block w-80 flex-shrink-0 sticky top-8">
            <ShoppingListPanelDesktop
              isOpen={shoppingListOpen}
              onClose={() => setShoppingListOpen(false)}
              items={shoppingItems}
              onAddItem={addItem}
              onDeleteItem={deleteItem}
              onToggleItem={toggleItem}
              onSetCategory={setCategoryItem}
            />
          </div>
        )}
      </div>

      {/* ── Mobile: shopping list bottom sheet ── */}
      <ShoppingListPanel
        isOpen={shoppingListOpen}
        onClose={() => setShoppingListOpen(false)}
        items={shoppingItems}
        onAddItem={addItem}
        onDeleteItem={deleteItem}
        onToggleItem={toggleItem}
        onSetCategory={setCategoryItem}
      />

      {/* ── Mobile: task detail bottom sheet ── */}
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

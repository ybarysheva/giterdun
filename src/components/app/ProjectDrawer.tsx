'use client';

import { useRef, useEffect } from 'react';
import { formatDistance } from 'date-fns';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { X, Trash2 } from 'lucide-react';

interface ProjectDrawerProps {
  project: Project | null;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void>;
}

function DrawerContent({ project, onClose, onDelete }: { project: Project; onClose: () => void; onDelete?: (id: string) => Promise<void> }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = closeButtonRef.current;
    if (!button) return;

    let touchStartPos = { x: 0, y: 0 };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartPos = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.x);
      const dy = Math.abs(touch.clientY - touchStartPos.y);

      if (dx < 10 && dy < 10) {
        onClose();
      }
    };

    button.addEventListener('touchstart', handleTouchStart, { passive: false });
    button.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      button.removeEventListener('touchstart', handleTouchStart);
      button.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onClose]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b">
        <span className="flex-1 text-base font-semibold truncate">{project.name}</span>
        <Button ref={closeButtonRef} variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">Created</p>
          <p className="text-sm">
            {formatDistance(project.createdAt, new Date(), { addSuffix: true })}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase">Position</p>
          <p className="text-sm text-muted-foreground">
            {Math.round(project.canvasPositionX)}, {Math.round(project.canvasPositionY)}
          </p>
        </div>

        <div className="pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive"
            onClick={async () => {
              if (onDelete) {
                await onDelete(project.id);
                onClose();
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Project
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Mobile: bottom sheet */
export function ProjectDrawer({ project, onClose, onDelete }: ProjectDrawerProps) {
  const isOpen = project !== null;
  return (
    <>
      <div
        className={cn(
          'md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl transition-transform duration-300 ease-out h-[60vh] flex flex-col',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        {project && <DrawerContent project={project} onClose={onClose} onDelete={onDelete} />}
      </div>
    </>
  );
}

/** Desktop: right sidebar */
export function ProjectDrawerDesktop({ project, onClose, onDelete }: ProjectDrawerProps) {
  if (!project) return null;
  return (
    <div className="hidden md:flex fixed top-20 right-4 bottom-20 w-64 z-50 bg-card border rounded-xl shadow-sm overflow-hidden flex-col">
      <DrawerContent project={project} onClose={onClose} onDelete={onDelete} />
    </div>
  );
}

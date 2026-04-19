'use client';

import { useRef, useState, useCallback } from 'react';
import { Info } from 'lucide-react';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  zoom: number;
  onPositionChange: (id: string, x: number, y: number) => void;
  onOpen: (id: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const LONG_PRESS_MS = 500;
const DRAG_THRESHOLD = 5; // px — below this = click, above = drag

export function ProjectCard({ project, zoom, onPositionChange, onOpen, onDragStart, onDragEnd }: ProjectCardProps) {
  const posRef = useRef({ x: project.canvasPositionX, y: project.canvasPositionY });
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // ── Mouse: click vs drag (desktop) ────────────────────────────────────────
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      hasDragged.current = false;
      mouseDownPos.current = { x: e.clientX, y: e.clientY };
      lastMouse.current = { x: e.clientX, y: e.clientY };

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - mouseDownPos.current.x;
        const dy = ev.clientY - mouseDownPos.current.y;

        if (!hasDragged.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
          hasDragged.current = true;
          setDragging(true);
          onDragStart?.();
        }

        if (hasDragged.current && cardRef.current) {
          const ddx = (ev.clientX - lastMouse.current.x) / zoom;
          const ddy = (ev.clientY - lastMouse.current.y) / zoom;
          posRef.current = { x: posRef.current.x + ddx, y: posRef.current.y + ddy };
          lastMouse.current = { x: ev.clientX, y: ev.clientY };
          cardRef.current.style.left = `${posRef.current.x}px`;
          cardRef.current.style.top = `${posRef.current.y}px`;
        }
      };

      const onUp = () => {
        if (hasDragged.current) {
          onPositionChange(project.id, posRef.current.x, posRef.current.y);
          onDragEnd?.();
        }
        setDragging(false);
        hasDragged.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [zoom, onPositionChange, project.id]
  );

  // ── Touch: tap vs long press + drag (mobile) ──────────────────────────────
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDragActive = useRef(false);
  const touchStart = useRef({ x: 0, y: 0 });
  const lastTouch = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    lastTouch.current = { x: touch.clientX, y: touch.clientY };
    touchDragActive.current = false;

    longPressTimer.current = setTimeout(() => {
      touchDragActive.current = true;
      setDragging(true);
      onDragStart?.();
      if (navigator.vibrate) navigator.vibrate(40);
    }, LONG_PRESS_MS);
  }, [onDragStart]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];

      if (!touchDragActive.current) {
        const dx = Math.abs(touch.clientX - touchStart.current.x);
        const dy = Math.abs(touch.clientY - touchStart.current.y);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
        }
        return;
      }

      e.stopPropagation();
      if (!cardRef.current) return;

      const dx = (touch.clientX - lastTouch.current.x) / zoom;
      const dy = (touch.clientY - lastTouch.current.y) / zoom;
      posRef.current = { x: posRef.current.x + dx, y: posRef.current.y + dy };
      lastTouch.current = { x: touch.clientX, y: touch.clientY };
      cardRef.current.style.left = `${posRef.current.x}px`;
      cardRef.current.style.top = `${posRef.current.y}px`;
    },
    [zoom]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (touchDragActive.current) {
      onPositionChange(project.id, posRef.current.x, posRef.current.y);
      onDragEnd?.();
    }
    touchDragActive.current = false;
    setDragging(false);
  }, [onPositionChange, project.id, onDragEnd]);

  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'absolute bg-card border rounded-xl shadow-sm px-4 py-3 select-none relative',
        'transition-shadow duration-150 w-48',
        dragging
          ? 'cursor-grabbing shadow-lg scale-105'
          : 'cursor-grab hover:shadow-md'
      )}
      style={{
        left: project.canvasPositionX,
        top: project.canvasPositionY,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold truncate flex-1">{project.name}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen(project.id);
          }}
          className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors cursor-pointer"
          aria-label="View project details"
        >
          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useRef, useState, useCallback } from 'react';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  zoom: number;
  onPositionChange: (id: string, x: number, y: number) => void;
}

const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_THRESHOLD = 6;

export function ProjectCard({ project, zoom, onPositionChange }: ProjectCardProps) {
  const posRef = useRef({ x: project.canvasPositionX, y: project.canvasPositionY });
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // ── Mouse drag (desktop) ────────────────────────────────────────────────
  const lastMouse = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setDragging(true);
      lastMouse.current = { x: e.clientX, y: e.clientY };

      const onMove = (ev: MouseEvent) => {
        if (!cardRef.current) return;
        const dx = (ev.clientX - lastMouse.current.x) / zoom;
        const dy = (ev.clientY - lastMouse.current.y) / zoom;
        posRef.current = { x: posRef.current.x + dx, y: posRef.current.y + dy };
        lastMouse.current = { x: ev.clientX, y: ev.clientY };
        cardRef.current.style.left = `${posRef.current.x}px`;
        cardRef.current.style.top = `${posRef.current.y}px`;
      };

      const onUp = () => {
        setDragging(false);
        onPositionChange(project.id, posRef.current.x, posRef.current.y);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [zoom, onPositionChange, project.id]
  );

  // ── Long press + drag (mobile) ──────────────────────────────────────────
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
      if (navigator.vibrate) navigator.vibrate(40);
    }, LONG_PRESS_MS);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];

      // Cancel long press if finger moves too much before it fires
      if (!touchDragActive.current) {
        const dx = Math.abs(touch.clientX - touchStart.current.x);
        const dy = Math.abs(touch.clientY - touchStart.current.y);
        if (dx > LONG_PRESS_MOVE_THRESHOLD || dy > LONG_PRESS_MOVE_THRESHOLD) {
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
        }
        return;
      }

      e.stopPropagation(); // prevent canvas pan while dragging card
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
    }
    touchDragActive.current = false;
    setDragging(false);
  }, [onPositionChange, project.id]);

  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'absolute bg-card border rounded-xl shadow-sm px-4 py-3 select-none',
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
      <p className="text-sm font-semibold truncate">{project.name}</p>
    </div>
  );
}

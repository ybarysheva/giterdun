'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Info } from 'lucide-react';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  zoom: number;
  onPositionChange: (id: string, x: number, y: number) => void;
  onOpen: (id: string) => void;
  onPointerBegin?: () => void; // fires immediately on any press — pauses panzoom
  onPointerFinish?: () => void; // fires when press ends — resumes panzoom
  onDragStart?: () => void;
  onDragEnd?: () => void;
  // legacy touch names kept for CanvasView compat
  onTouchBegin?: () => void;
  onTouchFinish?: () => void;
}

const LONG_PRESS_MS = 500;
const DRAG_THRESHOLD = 5;

export function ProjectCard({
  project, zoom, onPositionChange, onOpen,
  onPointerBegin, onPointerFinish,
  onTouchBegin, onTouchFinish,
  onDragStart, onDragEnd,
}: ProjectCardProps) {
  const posRef = useRef({ x: project.canvasPositionX, y: project.canvasPositionY });
  const cardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);

  const beginPause = onPointerBegin ?? onTouchBegin;
  const finishResume = onPointerFinish ?? onTouchFinish;

  // ── Mouse (desktop) ────────────────────────────────────────────────────────
  const mouseDownPos = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      beginPause?.(); // pause panzoom immediately so it doesn't also pan
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
          const ddx = ev.clientX - lastMouse.current.x;
          const ddy = ev.clientY - lastMouse.current.y;
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
        finishResume?.(); // resume panzoom when mouse released
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [zoom, onPositionChange, project.id, beginPause, finishResume, onDragStart, onDragEnd]
  );

  // ── Touch (mobile) ─────────────────────────────────────────────────────────
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDragActive = useRef(false);
  const touchStart = useRef({ x: 0, y: 0 });
  const lastTouch = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    beginPause?.(); // pause panzoom before it can capture this touch
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
  }, [beginPause, onDragStart]);

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

      const dx = (touch.clientX - lastTouch.current.x) / zoom * 0.5;
      const dy = (touch.clientY - lastTouch.current.y) / zoom * 0.5;
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
    finishResume?.(); // resume panzoom when finger lifts
  }, [onPositionChange, project.id, onDragEnd, finishResume]);

  // Native touch handler on card to pause panzoom before it captures the touch
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleCardTouchStart = (e: TouchEvent) => {
      // Prevent panzoom from seeing this touch and pause it
      e.preventDefault();
      onPointerBegin?.();
    };

    const handleCardTouchMove = (e: TouchEvent) => {
      // Prevent panzoom from panning while card is being dragged
      e.preventDefault();
    };

    card.addEventListener('touchstart', handleCardTouchStart, { passive: false });
    card.addEventListener('touchmove', handleCardTouchMove, { passive: false });

    return () => {
      card.removeEventListener('touchstart', handleCardTouchStart);
      card.removeEventListener('touchmove', handleCardTouchMove);
    };
  }, [onPointerBegin]);

  // Native touch handler on button to prevent panzoom from consuming the tap
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    let touchStartPos = { x: 0, y: 0 };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault(); // block panzoom from seeing this touch
      onPointerBegin?.();
      const touch = e.touches[0];
      touchStartPos = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.x);
      const dy = Math.abs(touch.clientY - touchStartPos.y);

      // If touch didn't move much, it's a tap — open the drawer
      if (dx < 10 && dy < 10) {
        onOpen(project.id);
      }

      onPointerFinish?.();
    };

    button.addEventListener('touchstart', handleTouchStart, { passive: false });
    button.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      button.removeEventListener('touchstart', handleTouchStart);
      button.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onPointerBegin, onPointerFinish, onOpen, project.id]);

  return (
    <div
      ref={cardRef}
      data-project-card
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
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold truncate flex-1">{project.name}</p>
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(project.id);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors cursor-pointer"
          aria-label="View project details"
          style={{ touchAction: 'manipulation' }}
        >
          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </div>
  );
}

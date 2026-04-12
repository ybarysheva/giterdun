'use client';

import { useRef, useCallback } from 'react';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  zoom: number;
  onPositionChange: (id: string, x: number, y: number) => void;
}

export function ProjectCard({ project, zoom, onPositionChange }: ProjectCardProps) {
  const posRef = useRef({ x: project.canvasPositionX, y: project.canvasPositionY });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // don't trigger canvas pan
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      const onMove = (ev: MouseEvent) => {
        if (!isDragging.current || !cardRef.current) return;
        const dx = (ev.clientX - lastMouse.current.x) / zoom;
        const dy = (ev.clientY - lastMouse.current.y) / zoom;
        posRef.current = { x: posRef.current.x + dx, y: posRef.current.y + dy };
        lastMouse.current = { x: ev.clientX, y: ev.clientY };
        // Move card visually via direct DOM manipulation for smooth drag
        cardRef.current.style.left = `${posRef.current.x}px`;
        cardRef.current.style.top = `${posRef.current.y}px`;
      };

      const onUp = () => {
        isDragging.current = false;
        onPositionChange(project.id, posRef.current.x, posRef.current.y);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [zoom, onPositionChange, project.id]
  );

  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      className={cn(
        'absolute bg-card border rounded-xl shadow-sm px-4 py-3 cursor-grab active:cursor-grabbing select-none',
        'hover:shadow-md transition-shadow duration-150',
        'w-48'
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

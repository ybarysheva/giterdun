'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { useProjects } from '@/hooks/use-projects';
import { ProjectCard } from './ProjectCard';

export function CanvasView() {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const isPanning = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const { projects, createProject, updateProjectPosition } = useProjects();

  // ── Create project input ──────────────────────────────────────────────────
  const [showInput, setShowInput] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createProject(newName.trim());
    setNewName('');
    setShowInput(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') { setShowInput(false); setNewName(''); }
  };

  // ── Pan ───────────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    isPanning.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const stopPanning = useCallback(() => { isPanning.current = false; }, []);

  // ── Touch pan ─────────────────────────────────────────────────────────────
  const lastTouch = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastTouch.current.x;
    const dy = e.touches[0].clientY - lastTouch.current.y;
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.93;
      setZoom((z) => Math.min(Math.max(z * factor, 0.2), 5));
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-muted/20 rounded-xl border border-dashed border-muted-foreground/20 cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopPanning}
      onMouseLeave={stopPanning}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Transformable surface */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          position: 'absolute',
        }}
      >
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            zoom={zoom}
            onPositionChange={updateProjectPosition}
          />
        ))}
      </div>

      {/* Fixed UI — not affected by pan/zoom */}
      <div className="absolute top-4 left-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        {showInput ? (
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Project name..."
              className="h-8 text-sm w-48 bg-background"
              autoFocus
            />
            <Button size="sm" className="h-8 px-3" onClick={handleCreate}>
              Create
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="gap-2 shadow-sm"
            onClick={() => setShowInput(true)}
          >
            <Plus className="h-4 w-4" />
            Create project
          </Button>
        )}
      </div>

      {/* Empty state */}
      {projects.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-muted-foreground/50 select-none">
            Your projects will live here — drag to pan, scroll to zoom
          </p>
        </div>
      )}
    </div>
  );
}

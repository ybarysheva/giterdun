'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import panzoom, { PanZoom } from 'panzoom';
import { useProjects } from '@/hooks/use-projects';
import { ProjectCard } from './ProjectCard';
import { ProjectDrawer, ProjectDrawerDesktop } from './ProjectDrawer';

interface CanvasViewProps {
  showCreateInput: boolean;
  newProjectName: string;
  onShowCreateInput: (show: boolean) => void;
  onNewProjectNameChange: (name: string) => void;
  onCreateProject: () => void;
}

export function CanvasView({
  showCreateInput,
  newProjectName,
  onShowCreateInput,
  onNewProjectNameChange,
  onCreateProject,
}: CanvasViewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const panzoomRef = useRef<PanZoom | null>(null);
  const isDraggingCardRef = useRef(false);

  const { projects, updateProjectPosition, deleteProject } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onCreateProject();
    if (e.key === 'Escape') { onShowCreateInput(false); onNewProjectNameChange(''); }
  };

  // Initialize Panzoom
  useEffect(() => {
    if (!surfaceRef.current) return;

    const pz = panzoom(surfaceRef.current, {
      minZoom: 0.2,
      maxZoom: 5,
      smoothScroll: true,
      initialX: 0,
      initialY: 0,
      initialZoom: 1,
    });

    pz.on('beforeWheel', (e: any) => {
      if (isDraggingCardRef.current) {
        e.preventDefault();
      }
    });

    pz.on('beforeMouseDown', (e: any) => {
      if (isDraggingCardRef.current) {
        e.preventDefault();
      }
    });

    pz.on('change', () => {
      const transform = pz.getTransform();
      setZoom(transform.scale);
    });

    panzoomRef.current = pz;

    return () => {
      pz.dispose();
      panzoomRef.current = null;
    };
  }, []);

  // Called immediately when finger touches a card — pause panzoom before it can pan
  const handleCardTouchBegin = useCallback(() => {
    panzoomRef.current?.pause();
  }, []);

  // Called when finger lifts off a card — always resume panzoom
  const handleCardTouchFinish = useCallback(() => {
    isDraggingCardRef.current = false;
    panzoomRef.current?.resume();
  }, []);

  const handleCardDragStart = useCallback(() => {
    isDraggingCardRef.current = true;
    // panzoom already paused by handleCardTouchBegin
  }, []);

  const handleCardDragEnd = useCallback(() => {
    // isDraggingCardRef and panzoom resume handled by handleCardTouchFinish
  }, []);

  return (
    <>
      <div
        ref={canvasRef}
        className="fixed inset-0 overflow-hidden bg-muted/20 select-none"
        style={{ overscrollBehavior: 'none' }}
      >
        {/* Transformable surface (controlled by panzoom) */}
        <div
          ref={surfaceRef}
          style={{
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
              onOpen={setSelectedProjectId}
              onPointerBegin={handleCardTouchBegin}
              onPointerFinish={handleCardTouchFinish}
              onDragStart={handleCardDragStart}
              onDragEnd={handleCardDragEnd}
            />
          ))}
        </div>

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-muted-foreground/50 select-none">
              Your projects will live here — drag to pan, scroll to zoom
            </p>
          </div>
        )}

        {/* Mobile bottom sheet */}
        <ProjectDrawer project={selectedProject} onClose={() => setSelectedProjectId(null)} onDelete={deleteProject} />
      </div>

      {/* Desktop drawer — fixed outside canvas, unaffected by pan/zoom */}
      <ProjectDrawerDesktop project={selectedProject} onClose={() => setSelectedProjectId(null)} onDelete={deleteProject} />
    </>
  );
}

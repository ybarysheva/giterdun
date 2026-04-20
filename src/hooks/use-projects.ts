'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase';
import type { Project } from '@/lib/types';

export function useProjects() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener
  useEffect(() => {
    if (isUserLoading || !user || !firestore) {
      setLoading(true);
      return;
    }

    const ref = collection(firestore, 'users', user.uid, 'projects');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
      setProjects(data.sort((a, b) => a.createdAt - b.createdAt));
      setLoading(false);
    });

    return unsub;
  }, [isUserLoading, user, firestore]);

  const createProject = useCallback(
    async (name: string) => {
      if (!firestore || !user || !name.trim()) return;
      const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      // Offset each new card so they don't stack
      const offset = projects.length;
      const project: Project = {
        id,
        name: name.trim(),
        canvasPositionX: 80 + (offset % 4) * 240,
        canvasPositionY: 80 + Math.floor(offset / 4) * 160,
        createdAt: Date.now(),
      };
      await setDoc(doc(firestore, 'users', user.uid, 'projects', id), project);
    },
    [firestore, user, projects.length]
  );

  // Debounced position save
  const positionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateProjectPosition = useCallback(
    (id: string, x: number, y: number) => {
      if (!firestore || !user) return;
      if (positionTimer.current) clearTimeout(positionTimer.current);
      positionTimer.current = setTimeout(() => {
        updateDoc(doc(firestore, 'users', user.uid, 'projects', id), {
          canvasPositionX: x,
          canvasPositionY: y,
        });
      }, 500);
    },
    [firestore, user]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      if (!firestore || !user) return;
      await deleteDoc(doc(firestore, 'users', user.uid, 'projects', id));
    },
    [firestore, user]
  );

  const updateProjectDescription = useCallback(
    async (id: string, description: string) => {
      if (!firestore || !user) return;
      await updateDoc(doc(firestore, 'users', user.uid, 'projects', id), {
        description,
      });
    },
    [firestore, user]
  );

  const updateProjectLinks = useCallback(
    async (id: string, links: string[]) => {
      if (!firestore || !user) return;
      await updateDoc(doc(firestore, 'users', user.uid, 'projects', id), {
        links,
      });
    },
    [firestore, user]
  );

  return { projects, loading, createProject, updateProjectPosition, deleteProject, updateProjectDescription, updateProjectLinks };
}

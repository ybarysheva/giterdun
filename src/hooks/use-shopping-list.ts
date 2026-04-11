'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirebase, useUser } from '@/firebase';
import { ShoppingItem } from '@/lib/types';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { classifyItem } from '@/lib/grocery-classifier';

export function useShoppingList() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading || !user || !firestore) {
      setLoading(true);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const ref = doc(firestore, 'users', user.uid, 'shopping', 'list');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setItems(snap.data().items || []);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isUserLoading, user, firestore]);

  const saveItems = useCallback(
    (newItems: ShoppingItem[]) => {
      if (!firestore || !user) return;
      const ref = doc(firestore, 'users', user.uid, 'shopping', 'list');
      setDocumentNonBlocking(ref, { items: newItems }, { merge: false });
    },
    [firestore, user]
  );

  const addItem = useCallback(
    (title: string) => {
      if (!title.trim()) return;
      const item: ShoppingItem = {
        id: crypto.randomUUID(),
        title: title.trim(),
        done: false,
        createdAt: Date.now(),
        category: classifyItem(title.trim()),
      };
      setItems((prev) => {
        const next = [...prev, item];
        saveItems(next);
        return next;
      });
    },
    [saveItems]
  );

  const deleteItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.id !== id);
        saveItems(next);
        return next;
      });
    },
    [saveItems]
  );

  const toggleItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i));
        saveItems(next);
        return next;
      });
    },
    [saveItems]
  );

  const setCategoryItem = useCallback(
    (id: string, category: 'grocery' | 'other') => {
      setItems((prev) => {
        const next = prev.map((i) => (i.id === id ? { ...i, category } : i));
        saveItems(next);
        return next;
      });
    },
    [saveItems]
  );

  return {
    items,
    loading: isUserLoading || loading,
    addItem,
    deleteItem,
    toggleItem,
    setCategoryItem,
  };
}

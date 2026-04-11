'use client';

import { useState, useRef, useEffect } from 'react';
import type { ShoppingItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Trash2, Plus, X, ShoppingCart, ArrowLeftRight } from 'lucide-react';

interface ShoppingListPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItem[];
  onAddItem: (title: string) => void;
  onDeleteItem: (id: string) => void;
  onToggleItem: (id: string) => void;
  onSetCategory: (id: string, category: 'grocery' | 'other') => void;
}

function ShoppingItemRow({
  item,
  onToggle,
  onDelete,
  onMoveCategory,
}: {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
  onMoveCategory: () => void;
}) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!item.done) { setFading(false); return; }
    const fadeTimer = setTimeout(() => setFading(true), 3000);
    return () => clearTimeout(fadeTimer);
  }, [item.done]);

  useEffect(() => {
    if (!fading) return;
    const removeTimer = setTimeout(() => onDelete(), 500);
    return () => clearTimeout(removeTimer);
  }, [fading, onDelete]);

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-500 group ${fading ? 'opacity-0' : 'opacity-100'}`}>
      <button
        onClick={onToggle}
        className={cn(
          'flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors',
          item.done
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-muted-foreground hover:border-primary'
        )}
        aria-label={item.done ? 'Mark as not bought' : 'Mark as bought'}
      >
        {item.done && <Check className="h-2.5 w-2.5" />}
      </button>
      <span className={cn('flex-1 text-sm', item.done && 'line-through text-muted-foreground')}>
        {item.title}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={onMoveCategory}
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Move to other section"
        title="Move to other section"
      >
        <ArrowLeftRight className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove item"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

function AddItemInput({ onAdd }: { onAdd: (title: string) => void }) {
  const [value, setValue] = useState('');
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const items = value.split(',').map((s) => s.trim()).filter(Boolean);
    if (items.length > 0) {
      items.forEach((item) => onAdd(item));
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
    else if (e.key === 'Escape') {
      setValue('');
      setShowInput(false);
    }
  };

  if (!showInput) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setShowInput(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="h-8 text-sm gap-2 text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Add item
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (!value.trim()) setShowInput(false);
        }}
        placeholder="Item name..."
        className="text-sm h-8"
        autoFocus
      />
      <Button size="sm" onClick={handleSubmit} className="h-8 px-3">
        Add
      </Button>
    </div>
  );
}

function PanelContent({
  onClose,
  items,
  onAddItem,
  onDeleteItem,
  onToggleItem,
  onSetCategory,
}: Omit<ShoppingListPanelProps, 'isOpen'>) {
  const groceryItems = items.filter((i) => i.category === 'grocery');
  const otherItems = items.filter((i) => i.category !== 'grocery');

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b">
        <ShoppingCart className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <span className="flex-1 text-base font-semibold">Shopping List</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4">
        {groceryItems.length === 0 && otherItems.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Your list is empty — add something to get started.
          </p>
        )}

        {/* Groceries section */}
        {groceryItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Groceries
            </p>
            {groceryItems.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={() => onToggleItem(item.id)}
                onDelete={() => onDeleteItem(item.id)}
                onMoveCategory={() => onSetCategory(item.id, 'other')}
              />
            ))}
          </div>
        )}

        {/* Amazon or Whatever section */}
        {otherItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Amazon or Whatever
            </p>
            {otherItems.map((item) => (
              <ShoppingItemRow
                key={item.id}
                item={item}
                onToggle={() => onToggleItem(item.id)}
                onDelete={() => onDeleteItem(item.id)}
                onMoveCategory={() => onSetCategory(item.id, 'grocery')}
              />
            ))}
          </div>
        )}


        <AddItemInput onAdd={onAddItem} />
      </div>
    </div>
  );
}

export function ShoppingListPanel({
  isOpen,
  onClose,
  items,
  onAddItem,
  onDeleteItem,
  onToggleItem,
  onSetCategory,
}: ShoppingListPanelProps) {
  return (
    <>
      {/* Mobile: bottom sheet */}
      <div
        className={cn(
          'md:hidden fixed inset-0 bg-black/40 z-40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl transition-transform duration-300 ease-out max-h-[80vh] flex flex-col',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        {isOpen && (
          <PanelContent
            onClose={onClose}
            items={items}
            onAddItem={onAddItem}
            onDeleteItem={onDeleteItem}
            onToggleItem={onToggleItem}
            onSetCategory={onSetCategory}
          />
        )}
      </div>
    </>
  );
}

/**
 * Desktop-only inline panel (rendered in the right column by the parent layout).
 */
export function ShoppingListPanelDesktop({
  isOpen,
  onClose,
  items,
  onAddItem,
  onDeleteItem,
  onToggleItem,
  onSetCategory,
}: ShoppingListPanelProps) {
  if (!isOpen) return null;
  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden h-full">
      <PanelContent
        onClose={onClose}
        items={items}
        onAddItem={onAddItem}
        onDeleteItem={onDeleteItem}
        onToggleItem={onToggleItem}
        onSetCategory={onSetCategory}
      />
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ShoppingCart, List, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onOpenShoppingList: () => void;
  shoppingItemCount: number;
  activeView: 'list' | 'canvas';
  onViewChange: (view: 'list' | 'canvas') => void;
}

export function Header({ onOpenShoppingList, shoppingItemCount, activeView, onViewChange }: HeaderProps) {
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formatted = format(now, 'EEE MMM d  h:mma');
      setDateTime(formatted);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="mb-6">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="whitespace-nowrap">{dateTime}</span>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            <button
              onClick={() => onViewChange('list')}
              className={cn(
                'h-7 w-7 flex items-center justify-center transition-colors',
                activeView === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'
              )}
              aria-label="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onViewChange('canvas')}
              className={cn(
                'h-7 w-7 flex items-center justify-center transition-colors',
                activeView === 'canvas'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'
              )}
              aria-label="Canvas view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenShoppingList}
            className="h-7 w-7 relative"
            aria-label="Open shopping list"
          >
            <ShoppingCart className="h-4 w-4" />
            {shoppingItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-medium leading-none">
                {shoppingItemCount > 9 ? '9+' : shoppingItemCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

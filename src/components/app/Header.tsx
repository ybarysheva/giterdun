'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';

export function Header() {
  const [currentDate, setCurrentDate] = useState('');
  const auth = useAuth();

  useEffect(() => {
    const now = new Date();
    setCurrentDate(format(now, 'E, LLL d'));
  }, []);

  return (
    <header className="flex flex-col items-center gap-6">
      <div className="w-full relative text-center">
        <p className="text-5xl font-bold uppercase tracking-wider">
          <span className="text-foreground">{currentDate.split(',')[0]}</span>
          <span className="text-muted-foreground">{currentDate.substring(currentDate.indexOf(','))}</span>
        </p>
        <button
          onClick={() => signOut(auth)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </div>

    </header>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

export function Header() {
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formatted = format(now, 'EEE MMM d  h:mma');
      setDateTime(formatted);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="mb-6">
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>{dateTime}</span>
        <span>3 due soon</span>
      </div>
    </header>
  );
}

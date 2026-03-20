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

  const datePart = dateTime.split('  ')[0]; // "Thu Mar 19"
  const timePart = dateTime.split('  ')[1]; // "2:34pm"

  return (
    <header className="mb-6">
      <div className="flex justify-between items-center text-sm font-semibold">
        <div>
          <span className="text-foreground">{datePart}</span>
          <span className="text-muted-foreground ml-2">{timePart}</span>
        </div>
        <span className="text-foreground">3 due soon</span>
      </div>
    </header>
  );
}

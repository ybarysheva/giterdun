'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useRandomFont } from '@/hooks/use-random-font';

interface Font {
  name: string;
  url: string;
}

interface AppConfigContextType {
  currentFont: string;
  fontList: Font[];
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export function AppConfigProvider({ children }: { children: ReactNode }) {
  const { currentFont, fontList } = useRandomFont();

  return (
    <AppConfigContext.Provider value={{ currentFont, fontList }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }
  return context;
}

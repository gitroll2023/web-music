'use client';

import { type ReactNode } from 'react';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { SongProvider } from '@/contexts/SongContext';
import { UIProvider } from '@/contexts/UIContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <UIProvider>
      <SongProvider>
        <PlayerProvider>
          {children}
        </PlayerProvider>
      </SongProvider>
    </UIProvider>
  );
}

'use client';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import React, { useRef } from 'react';
import { ImperativePanelHandle } from 'react-resizable-panels';
import DevTools from './dev-tools';

type ImperativeResizablePanel = ImperativePanelHandle;

const ResizableWindows = ({ children }: { children: React.ReactNode }) => {
  const devToolsPanelRef = useRef<ImperativeResizablePanel>(null);

  return (
    <ResizablePanelGroup
      direction='horizontal'
      onLayout={(sizes: number[]) => {
        localStorage.setItem('log-feed:layout', JSON.stringify(sizes));
      }}
    >
      <ResizablePanel
        collapsible={false}
        defaultSize={20}
        minSize={10}
        maxSize={70}
        ref={devToolsPanelRef}
      >
        <DevTools />
      </ResizablePanel>
      <ResizableHandle withHandle={true} />
      <ResizablePanel defaultSize={70}>{children}</ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ResizableWindows;

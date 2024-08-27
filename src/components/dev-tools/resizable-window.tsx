import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import React from 'react';
import DevTools from './dev-tools';

const ResizableWindows = ({ children }: { children: React.ReactNode }) => {
  return (
    <ResizablePanelGroup direction='horizontal'>
      <ResizablePanel
        collapsible={false}
        defaultSize={20}
        minSize={10}
        maxSize={70}
      >
        <DevTools />
      </ResizablePanel>
      <ResizableHandle withHandle={true} />
      <ResizablePanel defaultSize={70}>{children}</ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ResizableWindows;

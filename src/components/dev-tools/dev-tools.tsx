'use client';

import DevToolsLinks from './links';

export default function DevTools() {
  return (
    <div className='mt-4'>
      <div className='mb-4 text-lg font-bold'>Dev Tools</div>
      <DevToolsLinks />
    </div>
  );
}
